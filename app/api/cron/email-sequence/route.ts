import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEngagementEmail, sendTrialEndingEmail } from "@/lib/email/send";
import { getCurrentTransits } from "@/lib/astrology/transits";
import type { NatalChart } from "@/lib/astrology/chart";

// Vercel cron calls this route with a secret header to prevent unauthorized invocations
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev: allow without secret
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function buildTransitSnippet(
  chart: NatalChart,
  userName: string
): string {
  const hits = getCurrentTransits(chart);
  if (!hits.length) {
    return `The sky is quiet for you today, ${userName} — a good moment to reflect on what you've already been navigating.`;
  }

  const topHit = hits[0];
  const verbMap: Record<string, string> = {
    Conjunction: "aligning with",
    Trine: "flowing harmoniously through",
    Sextile: "opening a door to",
    Square: "challenging",
    Opposition: "pulling against",
    Quincunx: "asking for adjustment in",
  };
  const verb = verbMap[topHit.aspect] ?? "activating";

  const planetMeanings: Record<string, string> = {
    Saturn: "a period of maturation and restructuring",
    Jupiter: "expansion and opportunity",
    Mars: "drive, urgency, and decisive action",
    Venus: "connection, beauty, and what you value",
    Mercury: "communication, clarity, and the way you think",
    Moon: "emotional shifts and inner tides",
    Sun: "vitality and your sense of direction",
    Uranus: "unexpected change and breakthroughs",
    Neptune: "intuition, dreams, and spiritual longing",
  };
  const meaning = planetMeanings[topHit.transitPlanet] ?? "a significant shift";

  return `${topHit.transitPlanet} is ${verb} your natal ${topHit.natalPlanet} right now — signaling ${meaning} in your life.`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find users who completed onboarding and are still in sequence step 1 or 2
  // Step 1 = welcome sent → need day-2 email if ~24h have passed
  // Step 2 = day-2 sent → need day-3 email if ~48h have passed (trial ending)
  const now = new Date();
  const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const h72Ago = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  // Users due for day-2 email: completed onboarding 24–48h ago, step=1
  const { data: day2Users } = await supabase
    .from("profiles")
    .select("id, email_sequence_step, created_at")
    .eq("email_sequence_step", 1)
    .eq("onboarding_completed", true)
    .gte("created_at", h48Ago.toISOString())
    .lte("created_at", h24Ago.toISOString());

  // Users due for day-3 email: completed onboarding 48–72h ago, step=2
  const { data: day3Users } = await supabase
    .from("profiles")
    .select("id, email_sequence_step, created_at")
    .eq("email_sequence_step", 2)
    .eq("onboarding_completed", true)
    .gte("created_at", h72Ago.toISOString())
    .lte("created_at", h48Ago.toISOString());

  const results = { day2: 0, day3: 0, errors: 0 };

  // Send day-2 engagement emails
  for (const profile of day2Users ?? []) {
    try {
      // Get user email and natal chart
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const userName = email.split("@")[0];

      const { data: chartRow } = await supabase
        .from("natal_charts")
        .select("chart_data")
        .eq("user_id", profile.id)
        .single();

      const transitSnippet = chartRow
        ? buildTransitSnippet(chartRow.chart_data as NatalChart, userName)
        : `The sky is speaking to your chart today, ${userName}.`;

      await sendEngagementEmail({ to: email, userName, transitSnippet });

      await supabase
        .from("profiles")
        .update({ email_sequence_step: 2 })
        .eq("id", profile.id);

      results.day2++;
    } catch (err) {
      console.error(`[cron/email-sequence] day2 error for ${profile.id}:`, err);
      results.errors++;
    }
  }

  // Send day-3 trial-ending emails
  for (const profile of day3Users ?? []) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const userName = email.split("@")[0];

      await sendTrialEndingEmail({ to: email, userName });

      await supabase
        .from("profiles")
        .update({ email_sequence_step: 3 })
        .eq("id", profile.id);

      results.day3++;
    } catch (err) {
      console.error(`[cron/email-sequence] day3 error for ${profile.id}:`, err);
      results.errors++;
    }
  }

  console.log("[cron/email-sequence]", results);
  return NextResponse.json({ ok: true, ...results });
}
