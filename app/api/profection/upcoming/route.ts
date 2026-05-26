import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAnnualProfection,
  getNextAnnualProfection,
} from "@/lib/astrology/profections";
import type { NatalChart } from "@/lib/astrology/chart";

// Returns preview of the next profection year.
// Only meaningful (and only exposed in UI) during the last 30 days before birthday.
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

  const chart     = chartRow.chart_data as NatalChart;
  const birthDate = new Date(chartRow.birth_date + "T12:00:00");
  const today     = new Date();

  const current = getAnnualProfection(birthDate, chart, today);
  const next    = getNextAnnualProfection(birthDate, chart, today);

  const withinWindow = current.daysRemaining <= 30;

  return NextResponse.json({
    daysUntilBirthday: current.daysRemaining,
    withinWindow,
    current: {
      house:      current.house,
      houseName:  current.houseName,
      themes:     current.themes,
      lordOfYear: current.lordOfYear,
    },
    next: withinWindow
      ? {
          house:      next.house,
          houseName:  next.houseName,
          themes:     next.themes,
          lordOfYear: next.lordOfYear,
          lordSign:   next.lordSign,
        }
      : null,
  });
}
