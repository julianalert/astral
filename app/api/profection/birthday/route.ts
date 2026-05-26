import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnnualProfection } from "@/lib/astrology/profections";
import { generateBirthdayReading } from "@/lib/ai/birthdayReading";
import { sendBirthdayReadingEmail } from "@/lib/email/send";
import type { NatalChart } from "@/lib/astrology/chart";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: chartRow } = await supabase
    .from("natal_charts")
    .select("chart_data, birth_date, birth_time, birth_location")
    .eq("user_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "No natal chart found" }, { status: 400 });
  }

  const chart     = chartRow.chart_data as NatalChart;
  const birthDate = new Date(chartRow.birth_date + "T12:00:00");
  const today     = new Date();
  const todayStr  = today.toISOString().slice(0, 10);

  const isBirthday =
    today.getMonth() === birthDate.getMonth() &&
    today.getDate()  === birthDate.getDate();

  if (!isBirthday) {
    return NextResponse.json({ isBirthday: false });
  }

  // Idempotency: only generate once per birthday
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_birthday_reading_sent, name")
    .eq("id", user.id)
    .single();

  if (profile?.last_birthday_reading_sent === todayStr) {
    // Already generated today — fetch from conversations
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .ilike("title", `Birthday reading%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (conv) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", conv.id)
        .eq("role", "assistant")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (msgs?.content) {
        return NextResponse.json({ isBirthday: true, reading: msgs.content, cached: true });
      }
    }
  }

  const userName  = profile?.name ?? user.email?.split("@")[0] ?? "friend";
  const birthInfo = `${chartRow.birth_date} at ${chartRow.birth_time} in ${chartRow.birth_location}`;

  const newProfection = getAnnualProfection(birthDate, chart, today);
  // oldProfection = yesterday's year
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const oldProfection = getAnnualProfection(birthDate, chart, yesterday);

  try {
    const reading = await generateBirthdayReading(
      chart, userName, birthInfo, newProfection, oldProfection
    );

    // Mark as sent + email
    await supabase
      .from("profiles")
      .update({ last_birthday_reading_sent: todayStr })
      .eq("id", user.id);

    if (user.email) {
      sendBirthdayReadingEmail({
        to: user.email,
        userName,
        readingContent: reading,
        newHouseName: newProfection.houseName,
      }).catch(err => console.error("[profection/birthday] email failed:", err));
    }

    // Save as a named conversation
    const title = `Birthday reading — ${today.getFullYear()}`;
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();

    if (conv) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        role: "assistant",
        content: reading,
      });
    }

    return NextResponse.json({ isBirthday: true, reading, cached: false });
  } catch (err) {
    console.error("[profection/birthday]", err);
    return NextResponse.json({ error: "Failed to generate birthday reading" }, { status: 500 });
  }
}
