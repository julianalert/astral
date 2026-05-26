import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnnualProfection } from "@/lib/astrology/profections";
import { generateAnnualReading } from "@/lib/ai/annualReading";
import type { NatalChart } from "@/lib/astrology/chart";

// GET — return cached reading if it's still for the current profection house
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: chartRow }, { data: profile }] = await Promise.all([
    supabase
      .from("natal_charts")
      .select("chart_data, birth_date")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("profection_reading, profection_reading_house")
      .eq("id", user.id)
      .single(),
  ]);

  if (!chartRow) return NextResponse.json({ reading: null });

  if (profile?.profection_reading && profile?.profection_reading_house != null) {
    // Validate that the cached reading is for the current house
    const birthDate = new Date(chartRow.birth_date + "T12:00:00");
    const chart = chartRow.chart_data as NatalChart;
    const profection = getAnnualProfection(birthDate, chart);

    if (profile.profection_reading_house === profection.house) {
      return NextResponse.json({ reading: profile.profection_reading, cached: true });
    }
  }

  return NextResponse.json({ reading: null });
}

// POST — generate (or regenerate) the annual reading and cache it
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("chart_data, birth_date, birth_time, birth_location")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "No natal chart found" }, { status: 400 });
  }

  const chart     = chartRow.chart_data as NatalChart;
  const birthDate = new Date(chartRow.birth_date + "T12:00:00");
  const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;

  const { data: authProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const userName  = authProfile?.name ?? user.email?.split("@")[0] ?? "friend";
  const profection = getAnnualProfection(birthDate, chart);

  try {
    const reading = await generateAnnualReading(chart, userName, birthInfo, profection);

    await supabase
      .from("profiles")
      .update({
        profection_reading:       reading,
        profection_reading_house: profection.house,
      })
      .eq("id", user.id);

    return NextResponse.json({ reading });
  } catch (err) {
    console.error("[profection/reading]", err);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
