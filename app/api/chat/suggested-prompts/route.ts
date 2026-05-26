import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTransits } from "@/lib/astrology/transits";
import { getAnnualProfection } from "@/lib/astrology/profections";
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

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const source = new URL(req.url).searchParams.get("source");

  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("chart_data, birth_date")
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

  // When the user arrives from the "Explore this year" button, show year-focused chips
  if (source === "year" && chartRow.birth_date) {
    try {
      const birthDate = new Date((chartRow.birth_date as string) + "T12:00:00");
      const profection = getAnnualProfection(birthDate, chart);
      const isNearBirthday = profection.daysRemaining <= 14;

      const prompts = [
        `What does my ${profection.houseName} year mean for me?`,
        `How does ${profection.lordOfYear} shape this year for me?`,
        isNearBirthday
          ? `What's coming in my next annual cycle?`
          : `What should I focus on in a ${profection.houseName} year?`,
        `Why do certain themes keep coming up for me this year?`,
      ];

      return NextResponse.json({ prompts });
    } catch {
      // Fall through to default behaviour if profection fails
    }
  }

  const hits = getCurrentTransits(chart);
  const transitPrompts = transitsToPrompts(hits);

  // Inject 1 profection chip at the front for regular visits
  let profectionPrompts: string[] = [];
  if (chartRow.birth_date) {
    try {
      const birthDate = new Date((chartRow.birth_date as string) + "T12:00:00");
      const profection = getAnnualProfection(birthDate, chart);
      profectionPrompts = [
        profection.daysRemaining <= 14
          ? `What's coming in my next annual cycle?`
          : `What does my ${profection.houseName} year mean for me?`,
      ];
    } catch {
      // Non-fatal
    }
  }

  // 1 profection chip + 3 transit chips
  const prompts = [...profectionPrompts, ...transitPrompts].slice(0, 4);

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
