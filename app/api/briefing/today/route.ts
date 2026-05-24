import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyBriefing } from "@/lib/ai/briefing";
import type { NatalChart } from "@/lib/astrology/chart";
import type { MemoryEntry } from "@/lib/ai/systemPrompt";

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const todayDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const requestedDate = url.searchParams.get("date") ?? todayDate;
  const isPastDate = requestedDate < todayDate;

  // Return cached briefing if it exists
  const { data: existing } = await supabase
    .from("daily_briefings")
    .select("id, content, created_at")
    .eq("user_id", user.id)
    .eq("date", requestedDate)
    .single();

  if (existing?.content) {
    if (!existing.created_at) {
      await supabase
        .from("daily_briefings")
        .update({ read_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return NextResponse.json({ briefing: existing.content, cached: true });
  }

  // Past dates are only served from cache — don't generate retroactively
  if (isPastDate) {
    return NextResponse.json({ briefing: null, cached: false });
  }

  // Generate fresh briefing for today
  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "No natal chart found" }, { status: 400 });
  }

  const { data: memoryRows } = await supabase
    .from("memories")
    .select("content, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const chart = chartRow.chart_data as NatalChart;
  const userName = user.email?.split("@")[0] ?? "friend";
  const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;
  const memories: MemoryEntry[] = memoryRows ?? [];

  try {
    const content = await generateDailyBriefing(chart, userName, birthInfo, memories);

    // Cache in DB
    await supabase.from("daily_briefings").upsert(
      {
        user_id: user.id,
        date: todayDate,
        content,
        read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    );

    return NextResponse.json({ briefing: content, cached: false });
  } catch (err) {
    console.error("[briefing/today]", err);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
