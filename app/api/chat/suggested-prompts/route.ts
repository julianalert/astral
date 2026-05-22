import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTransits } from "@/lib/astrology/transits";
import type { NatalChart } from "@/lib/astrology/chart";

// Maps transit planets/aspects to focused prompt suggestions
function transitsToPrompts(
  hits: { transitPlanet: string; natalPlanet: string; aspect: string; exact: boolean }[]
): string[] {
  const prompts: string[] = [];

  const aspectVerbs: Record<string, string> = {
    Conjunction: "activating",
    Trine: "flowing through",
    Sextile: "opening doors with",
    Square: "challenging",
    Opposition: "creating tension with",
    Quincunx: "creating adjustment with",
  };

  for (const hit of hits.slice(0, 6)) {
    const verb = aspectVerbs[hit.aspect] ?? "influencing";
    const tp = hit.transitPlanet;
    const np = hit.natalPlanet;

    if (tp === "Saturn" || tp === "Jupiter") {
      prompts.push(`What does ${tp} ${verb} my natal ${np} mean for me right now?`);
    } else if (tp === "Venus" && (np === "Sun" || np === "Moon" || np === "ASC")) {
      prompts.push(`How is Venus influencing my relationships and self-expression today?`);
    } else if (tp === "Mars") {
      prompts.push(`How should I channel my Mars energy today?`);
    } else if (tp === "Moon") {
      prompts.push(`What's the Moon asking me to feel and release today?`);
    } else if (np === "ASC" || np === "MC") {
      prompts.push(`How is ${tp} affecting my identity and direction right now?`);
    } else {
      prompts.push(`What does ${tp} ${verb} my natal ${np} mean for me?`);
    }

    if (prompts.length >= 4) break;
  }

  // Fallback prompts if not enough transits
  const fallbacks = [
    "What should I focus on energetically this week?",
    "How can I work with today's cosmic weather?",
    "What patterns keep showing up for me lately?",
    "What does my chart say about my current path?",
  ];

  while (prompts.length < 4) {
    const fb = fallbacks[prompts.length];
    if (fb) prompts.push(fb);
    else break;
  }

  return prompts.slice(0, 4);
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("chart_data")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({
      prompts: [
        "What should I focus on this week?",
        "How's my energy looking today?",
        "What patterns keep showing up for me?",
        "What does my chart say about my path?",
      ],
    });
  }

  const chart = chartRow.chart_data as NatalChart;
  const hits = getCurrentTransits(chart);
  const prompts = transitsToPrompts(hits);

  // Cache for 1 hour — transits don't meaningfully change within a session
  return NextResponse.json(
    { prompts },
    {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=7200",
      },
    }
  );
}
