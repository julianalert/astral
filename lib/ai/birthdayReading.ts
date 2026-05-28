import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildChartContext } from "@/lib/astrology/format";
import { formatPlacement } from "@/lib/astrology/format";
import type { NatalChart } from "@/lib/astrology/chart";
import type { AnnualProfection } from "@/lib/astrology/profections";

export async function generateBirthdayReading(
  chart: NatalChart,
  userName: string,
  birthInfo: string,
  newProfection: AnnualProfection,
  oldProfection: AnnualProfection
): Promise<string> {
  const chartContext = buildChartContext(chart, userName, birthInfo);

  const lordKey = newProfection.lordOfYear.toLowerCase() as keyof NatalChart;
  const lordPosition = chart[lordKey];
  const lordNatalPlacement =
    lordPosition && typeof lordPosition === "object" && "sign" in lordPosition
      ? formatPlacement(newProfection.lordOfYear, lordPosition as Parameters<typeof formatPlacement>[1])
      : `${newProfection.lordOfYear} (position unavailable)`;

  const prompt = `Generate a birthday annual reading for ${userName}.

They are turning ${newProfection.age} today. This means they're entering a ${newProfection.houseName} year.
New themes: ${newProfection.themes}
New Lord of the Year: ${newProfection.lordOfYear} (ruling ${newProfection.lordSign} on the ${newProfection.houseName} cusp)
Their ${newProfection.lordOfYear} is natally: ${lordNatalPlacement}

Compare briefly with the year just ending (${oldProfection.houseName} year, themes: ${oldProfection.themes}):
What was that year likely about for them?
What shifts now?

Their natal chart context:
${chartContext}

Write as a personal letter, not a report. 3–4 paragraphs.
Warm and direct. Reference specific chart details — natal placements, not just generic house meanings.
End with one concrete thing to pay attention to in this new year.
No salutation. Start directly with the insight. Do not use the phrase "annual profection" or technical jargon.`;

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    prompt,
    maxOutputTokens: 800,
  });

  return text;
}
