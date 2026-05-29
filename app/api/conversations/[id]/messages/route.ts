import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { buildSystemPrompt, type MemoryEntry } from "@/lib/ai/systemPrompt";
import { buildRelationshipSystemPrompt } from "@/lib/ai/compatibilityReport";
import { extractAndStoreMemories } from "@/lib/ai/memoryExtract";
import { detectMode } from "@/lib/ai/modeDetect";
import {
  getRecurringPatterns,
  shouldSurfacePattern,
  markPatternSurfaced,
  buildPatternDescription,
} from "@/lib/ai/patternDetect";
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

  // Verify conversation belongs to user — also fetch relationship_profile_id
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, relationship_profile_id")
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

  // Auto-title: fires on the first user message, whether or not an AI greeting exists first
  if ((existingCount ?? 0) <= 1) {
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
  const birthDate = chartRow.birth_date
    ? new Date(chartRow.birth_date + "T12:00:00")
    : undefined;

  // Load memories
  const { data: memoryRows } = await supabase
    .from("memories")
    .select("content, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const memories: MemoryEntry[] = memoryRows ?? [];

  // ── Mode detection ──────────────────────────────────────────────────────────
  // Count conversations to determine if user has hit pattern-mode threshold
  const { count: sessionCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Pull the last 3 user messages for impatience detection (excluding current)
  const recentUserMessages = incomingMessages
    .filter(m => m.role === "user")
    .slice(-4, -1)   // 3 messages before the current one
    .map(m => m.content);

  let hasRecurringPattern = false;
  let patternDescription: string | undefined;

  if ((sessionCount ?? 0) >= 10) {
    const canSurface = await shouldSurfacePattern(user.id);
    if (canSurface) {
      const patterns = await getRecurringPatterns(user.id);
      if (patterns.length > 0) {
        hasRecurringPattern = true;
        patternDescription = buildPatternDescription(patterns[0]);
      }
    }
  }

  const wordCount = lastMessage.content.trim().split(/\s+/).length;
  const mode = detectMode({
    messageText: lastMessage.content,
    wordCount,
    sessionCount: sessionCount ?? 0,
    recentUserMessages,
    hasRecurringPattern,
    patternDescription,
  });

  // Build system prompt — use relationship-scoped prompt if this is a synastry conversation
  let systemPrompt: string;

  if (conv.relationship_profile_id) {
    const { data: relProfile } = await supabase
      .from("relationship_profiles")
      .select("name, chart_data")
      .eq("id", conv.relationship_profile_id)
      .single();

    if (relProfile) {
      const partnerChart = (relProfile.chart_data as { chart: NatalChart }).chart;
      const report = (relProfile.chart_data as { compatibility_report?: string }).compatibility_report ?? "";
      systemPrompt = buildRelationshipSystemPrompt(
        chart, userName, birthInfo,
        partnerChart, relProfile.name,
        report
      );
    } else {
      systemPrompt = buildSystemPrompt(chart, userName, birthInfo, memories, birthDate, mode, patternDescription);
    }
  } else {
    systemPrompt = buildSystemPrompt(chart, userName, birthInfo, memories, birthDate, mode, patternDescription);
  }

  // If pattern mode triggered, record it so it doesn't fire again for 2 weeks
  if (mode === 'pattern') {
    void markPatternSurfaced(user.id).catch(
      err => console.error("[patternDetect] markPatternSurfaced failed:", err)
    );
  }

  // Cap history to the last 12 messages to bound input token cost on long conversations
  const recentMessages = incomingMessages.slice(-12);

  const aiMessages = recentMessages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Stream from Claude — system passed separately (not in messages array) so the
  // AI SDK can safely cache it and avoids the prompt-injection warning.
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

      // Fire memory extraction after the 2nd user message, then every 3 user
      // messages (i.e. every ~3 turns). Counting user messages avoids parity
      // issues that arise with or without an AI greeting at the start.
      const { count: userMsgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", params.id)
        .eq("role", "user");

      if (userMsgCount && userMsgCount >= 2 && (userMsgCount - 2) % 3 === 0) {
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
