import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeNatalChart } from "@/lib/astrology/chart";
import { generateCompatibilityReport } from "@/lib/ai/compatibilityReport";
import type { NatalChart } from "@/lib/astrology/chart";

const FREE_LIMIT = 1;
const PAID_LIMIT = 3;

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "Seraphova-App/1.0" } });
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profiles, error } = await supabase
    .from("relationship_profiles")
    .select("id, name, birth_date, birth_location, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: profiles ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Paywall: check profile limit
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const { count: existing } = await supabase
    .from("relationship_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const limit = profileRow?.subscription_status === "active" ? PAID_LIMIT : FREE_LIMIT;
  if ((existing ?? 0) >= limit) {
    return NextResponse.json({ error: "profile_limit_reached" }, { status: 402 });
  }

  const { name, birthDate, birthTime, birthLocation } = await request.json() as {
    name: string;
    birthDate: string;
    birthTime?: string;
    birthLocation?: string;
  };

  if (!name || !birthDate) {
    return NextResponse.json({ error: "name and birthDate are required" }, { status: 400 });
  }

  // Geocode (optional — if no location, use 0,0 and noon birth time)
  let coords = { lat: 0, lng: 0 };
  if (birthLocation) {
    const geocoded = await geocode(birthLocation);
    if (geocoded) coords = geocoded;
  }

  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime ? birthTime.split(":").map(Number) : [12, 0];

  const partnerChart = computeNatalChart(year, month, day, hour, minute, coords.lat, coords.lng, 0);

  // Load user's natal chart for synastry
  const { data: userChartRow } = await supabase
    .from("natal_charts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userChartRow) {
    return NextResponse.json({ error: "No natal chart found for user" }, { status: 400 });
  }

  const userChart = userChartRow.chart_data as NatalChart;
  const userName = user.email?.split("@")[0] ?? "friend";
  const userBirthInfo = `${userChartRow.birth_date} at ${userChartRow.birth_time} in ${userChartRow.birth_location}`;

  // Generate compatibility report
  let report = "";
  try {
    report = await generateCompatibilityReport(
      userChart, userName, userBirthInfo,
      partnerChart, name
    );
  } catch (err) {
    console.error("[relationships] report generation failed:", err);
    report = "Report generation failed — you can still chat about this relationship.";
  }

  // Store relationship profile
  const { data: profile, error: profileError } = await supabase
    .from("relationship_profiles")
    .insert({
      user_id: user.id,
      name,
      birth_date: birthDate,
      birth_time: birthTime ?? null,
      birth_location: birthLocation ?? null,
      chart_data: { chart: partnerChart, compatibility_report: report },
    })
    .select()
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Could not save profile" }, { status: 500 });
  }

  // Create a scoped conversation for this relationship
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title: `${name} — synastry`,
      relationship_profile_id: profile.id,
    })
    .select()
    .single();

  return NextResponse.json({
    profile,
    report,
    conversationId: conversation?.id ?? null,
  });
}
