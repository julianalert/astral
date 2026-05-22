import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";

interface RawMemory {
  content: string;
  category: "life_event" | "relationship" | "theme" | "trait";
  confidence: "high" | "medium" | "low";
}

const EXTRACTION_PROMPT = `You are extracting structured memories from a conversation between a user and an AI astrology companion.

Review the conversation below and extract facts worth remembering long-term:
- Life events (job changes, moves, relationships starting/ending, loss)
- Named people in their life and the nature of those relationships
- Recurring emotional themes or patterns they mention
- Personal goals, fears, or values they express
- Anything they explicitly say they want to be remembered

Return a JSON array. Each memory:
{
  "content": "one sentence, written as a factual note about the user",
  "category": "life_event | relationship | theme | trait",
  "confidence": "high | medium | low"
}

Only extract high and medium confidence memories. Skip small talk, questions, and anything that seems transient. Max 5 memories per conversation. If there is nothing worth extracting, return an empty array [].

Return ONLY the JSON array, no markdown, no explanation.`;

export async function extractAndStoreMemories(
  conversationId: string,
  userId: string,
  messages: { role: string; content: string }[]
): Promise<void> {
  // Only process user messages (skip assistant ones for the prompt text)
  const userMessages = messages.filter(m => m.role === "user");
  if (userMessages.length < 2) return; // Not enough for meaningful extraction

  const conversationText = messages
    .map(m => `${m.role === "user" ? "User" : "Astral"}: ${m.content}`)
    .join("\n\n");

  let extracted: RawMemory[] = [];

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: EXTRACTION_PROMPT,
      prompt: `Conversation:\n\n${conversationText}`,
      maxOutputTokens: 500,
    });

    // Strip markdown code fences if present
    const clean = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) {
      extracted = parsed.filter(
        (m): m is RawMemory =>
          m &&
          typeof m.content === "string" &&
          ["life_event", "relationship", "theme", "trait"].includes(m.category) &&
          (m.confidence === "high" || m.confidence === "medium")
      );
    }
  } catch (err) {
    console.error("[memoryExtract] parse error:", err);
    return;
  }

  if (!extracted.length) return;

  // Load existing memories to avoid near-duplicates (simple content dedup)
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("memories")
    .select("content")
    .eq("user_id", userId);

  const existingTexts = new Set((existing ?? []).map(m => m.content.toLowerCase()));

  const toInsert = extracted
    .filter(m => !existingTexts.has(m.content.toLowerCase()))
    .map(m => ({
      user_id: userId,
      content: m.content,
      category: m.category,
      source_conversation_id: conversationId,
    }));

  if (toInsert.length) {
    await supabase.from("memories").insert(toInsert);
    console.log(`[memoryExtract] Stored ${toInsert.length} new memories for user ${userId}`);
  }
}
