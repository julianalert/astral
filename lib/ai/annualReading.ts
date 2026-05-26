import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildChartContext } from "@/lib/astrology/format";
import { getCurrentTransits, formatTransitsForPrompt } from "@/lib/astrology/transits";
import type { NatalChart } from "@/lib/astrology/chart";
import type { AnnualProfection } from "@/lib/astrology/profections";
import { formatPlacement } from "@/lib/astrology/format";

export async function generateAnnualReading(
  chart: NatalChart,
  userName: string,
  birthInfo: string,
  profection: AnnualProfection
): Promise<string> {
  const chartContext = buildChartContext(chart, userName, birthInfo);

  const transits = getCurrentTransits(chart);
  const transitContext = formatTransitsForPrompt(transits);

  const lordKey = profection.lordOfYear.toLowerCase() as keyof NatalChart;
  const lordPos = chart[lordKey];
  const lordNatalPlacement =
    lordPos && typeof lordPos === "object" && "sign" in lordPos
      ? formatPlacement(profection.lordOfYear, lordPos as Parameters<typeof formatPlacement>[1])
      : `${profection.lordOfYear} (position not available)`;

  const yearStartFormatted = profection.yearStart.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const yearEndFormatted = profection.yearEnd.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const prompt = `Write a comprehensive annual reading for ${userName}.

They are ${profection.age} years old and are currently in a ${profection.houseName} year (${yearStartFormatted} → ${yearEndFormatted}).
This year's themes: ${profection.themes}
Lord of the Year: ${profection.lordOfYear} — ruling ${profection.lordSign} on the ${profection.houseName} cusp.
${profection.lordOfYear} natal placement: ${lordNatalPlacement}

Their natal chart:
${chartContext}

Current planetary transits:
${transitContext}

Write a rich, personal annual reading — 5 to 6 paragraphs. Structure it naturally (no headers):

1. Open with what this ${profection.houseName} year means at its core — connect the house themes to ${userName}'s specific chart. What does activating the ${profection.houseName} cusp mean given what's there natally?

2. Explore the Lord of the Year: ${profection.lordOfYear} is natally in ${lordNatalPlacement}. What does that placement reveal about HOW this year's themes will express — what flavour, what potential friction, what gifts?

3. Look at what current transits to ${profection.lordOfYear} are saying. If ${profection.lordOfYear} is being transited right now, flag it as significant. Connect it to what ${userName} may be feeling or navigating.

4. Offer a practical frame: given this is a ${profection.houseName} year, what should ${userName} lean into? What is the year asking of them? What would be wasting the energy of this year?

5. Close with one or two sentences that feel like a compass for the whole year — something to return to.

Tone: warm, intelligent, direct. Like a trusted astrologer who knows their chart deeply and respects their intelligence. Not a fortune teller — illuminate patterns and tendencies. No bullet points. No section headers. Write in flowing paragraphs. Do not use the word "profection" or "profected." Do not mention house systems or technical jargon.`;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    prompt,
    maxOutputTokens: 1200,
  });

  return text;
}
