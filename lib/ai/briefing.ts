import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildChartContext } from "@/lib/astrology/format";
import { getCurrentTransits, formatTransitsForPrompt } from "@/lib/astrology/transits";
import type { NatalChart } from "@/lib/astrology/chart";
import type { MemoryEntry } from "./systemPrompt";

export async function generateDailyBriefing(
  chart: NatalChart,
  userName: string,
  birthInfo: string,
  memories: MemoryEntry[] = []
): Promise<string> {
  const chartContext = buildChartContext(chart, userName, birthInfo);

  const transits = getCurrentTransits(chart);
  const transitContext = formatTransitsForPrompt(transits);

  const recentMemories = memories
    .slice(0, 5)
    .map(m => `- ${m.content}`)
    .join("\n");

  const prompt = `Generate a personalized daily astrological briefing for ${userName}.

Their chart:
${chartContext}

Today's transits:
${transitContext}

${recentMemories ? `Recent memories:\n${recentMemories}` : ""}

Write 3–5 sentences. Be specific to their chart — not generic. Identify the most significant transit active today and what it means for them personally. End with one grounding thought or gentle invitation to reflect.

Tone: warm, intelligent, like a trusted friend who happens to know your chart by heart. Not a horoscope. Not a fortune cookie. No greeting — start directly with the insight.`;

  const { text } = await generateText({
    model: anthropic("claude-haiku-3-5"),
    prompt,
    maxOutputTokens: 1024,
  });

  return text;
}
