import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnnualProfection, getProfectionProgress, getNextAnnualProfection } from "@/lib/astrology/profections";
import type { NatalChart } from "@/lib/astrology/chart";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("chart_data, birth_date")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "No natal chart found" }, { status: 400 });
  }

  const chart = chartRow.chart_data as NatalChart;
  const birthDate = new Date(chartRow.birth_date + "T12:00:00");
  const today = new Date();

  const profection = getAnnualProfection(birthDate, chart, today);
  const progress   = getProfectionProgress(profection);
  const next       = getNextAnnualProfection(birthDate, chart, today);

  return NextResponse.json(
    {
      profection: {
        ...profection,
        yearStart: profection.yearStart.toISOString(),
        yearEnd:   profection.yearEnd.toISOString(),
      },
      progress,
      next: {
        house:      next.house,
        houseName:  next.houseName,
        themes:     next.themes,
        lordOfYear: next.lordOfYear,
        lordSign:   next.lordSign,
      },
    },
    {
      headers: {
        // Revalidate at most once per hour; profection only changes on birthday
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
