import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateDailyBriefing } from "@/lib/ai/briefing";
import { sendDailyBriefingEmail } from "@/lib/email/send";
import type { NatalChart } from "@/lib/astrology/chart";
import type { MemoryEntry } from "@/lib/ai/systemPrompt";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const todayDate = new Date().toISOString().slice(0, 10);

  // Find users who have a natal chart and haven't received today's briefing yet
  const { data: charts } = await supabase
    .from("natal_charts")
    .select("user_id, birth_date, birth_time, birth_location, chart_data");

  if (!charts?.length) {
    return NextResponse.json({ ok: true, generated: 0 });
  }

  // Filter out users who already have today's briefing
  const { data: existingBriefings } = await supabase
    .from("daily_briefings")
    .select("user_id")
    .eq("date", todayDate);

  const alreadyDone = new Set((existingBriefings ?? []).map(b => b.user_id));
  const pending = charts.filter(c => !alreadyDone.has(c.user_id));

  const results = { generated: 0, emailed: 0, errors: 0 };

  for (const chartRow of pending) {
    try {
      // Load memories for this user
      const { data: memoryRows } = await supabase
        .from("memories")
        .select("content, category")
        .eq("user_id", chartRow.user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      const chart = chartRow.chart_data as NatalChart;
      const memories: MemoryEntry[] = memoryRows ?? [];

      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(chartRow.user_id);
      const email = authUser?.user?.email;
      const userName = email?.split("@")[0] ?? "friend";
      const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;

      const content = await generateDailyBriefing(chart, userName, birthInfo, memories);

      // Store in DB
      await supabase.from("daily_briefings").upsert(
        { user_id: chartRow.user_id, date: todayDate, content },
        { onConflict: "user_id,date" }
      );
      results.generated++;

      // Email it out
      if (email) {
        await sendDailyBriefingEmail({ to: email, userName, briefingContent: content });
        results.emailed++;
      }
    } catch (err) {
      console.error(`[cron/daily-briefing] error for user ${chartRow.user_id}:`, err);
      results.errors++;
    }
  }

  console.log("[cron/daily-briefing]", results);
  return NextResponse.json({ ok: true, ...results });
}
