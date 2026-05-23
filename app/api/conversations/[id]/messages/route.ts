import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { buildSystemPrompt, type MemoryEntry } from "@/lib/ai/systemPrompt";
import { extractAndStoreMemories } from "@/lib/ai/memoryExtract";
import type { NatalChart } from "@/lib/astrology/chart";

const PAGE_SIZE = 30;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  // `before` is an ISO timestamp — load messages older than this (for pagination)
  const before = url.searchParams.get("before");

  let query = supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: false }) // newest first so we can slice
    .limit(PAGE_SIZE);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reverse to chronological order before returning
  const ordered = (messages ?? []).reverse();
  return NextResponse.json({
    messages: ordered,
    hasMore: (messages?.length ?? 0) === PAGE_SIZE,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify conversation belongs to user
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Paywall check
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  if (profile) {
    const trialExpired =
      profile.subscription_status === "trial" &&
      profile.trial_ends_at &&
      new Date(profile.trial_ends_at) < new Date();
    if (trialExpired && profile.subscription_status !== "active") {
      return NextResponse.json({ error: "trial_expired" }, { status: 402 });
    }
  }

  // Parse request: messages is a simple array of { id, role, content }
  const { messages: incomingMessages } = await request.json() as {
    messages: { id: string; role: string; content: string }[];
  };

  const lastMessage = incomingMessages[incomingMessages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  // Count existing messages to determine auto-title and memory trigger
  const { count: existingCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", params.id);

  // Auto-title: if only the initial AI greeting exists (count === 1), use the first user message as title
  if ((existingCount ?? 0) === 1) {
    const words = lastMessage.content.trim().split(/\s+/).slice(0, 8).join(" ");
    const title = words.length < lastMessage.content.trim().length ? `${words}…` : words;
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", params.id);
  }

  // Save user message to Supabase
  await supabase.from("messages").insert({
    conversation_id: params.id,
    role: "user",
    content: lastMessage.content,
  });

  // Load natal chart
  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "No natal chart found" }, { status: 400 });
  }

  const chart = chartRow.chart_data as NatalChart;
  const userName = user.email?.split("@")[0] ?? "friend";
  const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;

  // Load memories
  const { data: memoryRows } = await supabase
    .from("memories")
    .select("content, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const memories: MemoryEntry[] = memoryRows ?? [];

  // Build system prompt
  const systemPrompt = buildSystemPrompt(chart, userName, birthInfo, memories);

  // Build message history for Claude
  const aiMessages = incomingMessages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Stream from Claude
  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: aiMessages,
    maxOutputTokens: 600,
    onFinish: async ({ text }) => {
      await supabase.from("messages").insert({
        conversation_id: params.id,
        role: "assistant",
        content: text,
      });

      // Trigger memory extraction on every turn once there are 5+ messages.
      // Because conversations start with 1 AI greeting, message counts are always
      // odd (1→3→5→7…) — a "% 5 === 0" check would almost never fire.
      // Deduplication inside extractAndStoreMemories prevents duplicate inserts.
      const { count: totalCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", params.id);

      if (totalCount && totalCount >= 5) {
        const { data: allMsgs } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", params.id)
          .order("created_at", { ascending: true });

        if (allMsgs) {
          void extractAndStoreMemories(params.id, user.id, allMsgs).catch(
            err => console.error("[memoryExtract] failed:", err)
          );
        }
      }
    },
  });

  return result.toTextStreamResponse();
}
