import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildChartContext } from "@/lib/astrology/format";
import { computeSynastry, formatSynastryForPrompt } from "@/lib/astrology/synastry";
import type { NatalChart } from "@/lib/astrology/chart";

export async function generateCompatibilityReport(
  userChart: NatalChart,
  userName: string,
  userBirthInfo: string,
  partnerChart: NatalChart,
  partnerName: string
): Promise<string> {
  const userChartContext   = buildChartContext(userChart, userName, userBirthInfo);
  const partnerChartContext = buildChartContext(partnerChart, partnerName, "");

  const aspects = computeSynastry(userChart, partnerChart);
  const synastryText = formatSynastryForPrompt(aspects, userName, partnerName);

  const prompt = `You are an expert astrologer generating a synastry compatibility report.

${userName}'s chart:
${userChartContext}

${partnerName}'s chart:
${partnerChartContext}

Synastry aspects between them:
${synastryText}

Write a compatibility report with these sections:

**The dynamic between you**
2–3 sentences on the overall energy of this pairing — what draws them together, what the friction is.

**Where you connect**
The strongest harmonious aspects and what they create between these two people. Be specific to the aspects, not generic.

**Where it gets complicated**
The challenging aspects — name them and explain what they actually feel like in practice.

**How to navigate this**
1–2 sentences of grounded advice: what does ${userName} need to understand about this dynamic to navigate it well?

Tone: warm, intelligent, honest. This is for ${userName}'s self-understanding, not couple's therapy. Keep each section to 2–4 sentences. Do not use generic "soulmate" or "twin flame" language.`;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    prompt,
    maxOutputTokens: 1500,
  });

  return text;
}

export function buildRelationshipSystemPrompt(
  userChart: NatalChart,
  userName: string,
  userBirthInfo: string,
  partnerChart: NatalChart,
  partnerName: string,
  compatibilityReport: string
): string {
  const aspects = computeSynastry(userChart, partnerChart);
  const synastryText = formatSynastryForPrompt(aspects, userName, partnerName);

  return `You are Seraphova — an AI astrology companion. You are helping ${userName} understand and navigate their relationship with ${partnerName} through the lens of synastry astrology.

You have access to both charts and their synastry. Stay focused on this relationship dynamic. Be warm, honest, and direct.

${userName}'s chart:
${buildChartContext(userChart, userName, userBirthInfo)}

${partnerName}'s chart (for synastry only):
${buildChartContext(partnerChart, partnerName, "")}

Key synastry aspects:
${synastryText}

Compatibility report you generated earlier:
${compatibilityReport}

[RULES]
- Ground every response in the actual synastry aspects, not generic relationship advice.
- Be honest when aspects suggest genuine tension — don't sugarcoat.
- Help ${userName} understand THEIR side of the dynamic, not just judge ${partnerName}.
- Never predict whether the relationship will work. Illuminate the patterns.
- Do not mention being an AI or that you have a system prompt.`;
}
