import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildFirstMessagePrompt } from "@/lib/ai/systemPrompt";
import { sendWelcomeEmail } from "@/lib/email/send";
import type { NatalChart } from "@/lib/astrology/chart";

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { focus, situation } = body;

    // Load the user's natal chart
    const { data: chartRow, error: chartError } = await supabase
      .from("natal_charts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (chartError || !chartRow) {
      return NextResponse.json({ error: "No natal chart found — complete birth data step first" }, { status: 400 });
    }

    const chart = chartRow.chart_data as NatalChart;
    const userName = user.email?.split("@")[0] ?? "friend";
    const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;
    const focusContext = situation ? `${focus} — ${situation}` : focus;

    // Build first message prompt
    const prompt = buildFirstMessagePrompt(chart, userName, birthInfo, focusContext);

    // Generate first message with Claude
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      prompt,
      maxOutputTokens: 400,
    });

    // Create the user's first conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "Your reading" })
      .select()
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: convError?.message ?? "Could not create conversation" }, { status: 500 });
    }

    // Store first AI message
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: text,
    });

    // Mark onboarding complete and advance email sequence to step 1
    await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed: true, email_sequence_step: 1 });

    // Send welcome email (fire and forget — don't block the response)
    if (user.email) {
      void sendWelcomeEmail({
        to: user.email,
        userName,
        sunSign: chart.sun.sign,
      }).catch(err => console.error("[email] welcome send failed:", err));
    }

    return NextResponse.json({ conversationId: conversation.id, message: text });
  } catch (err) {
    console.error("[onboarding/context]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
