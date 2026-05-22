import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeNatalChart } from "@/lib/astrology/chart";

// Geocode a city name to lat/lng using OpenStreetMap Nominatim (free, no key)
async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Seraphova-App/1.0" },
      next: { revalidate: 86400 }, // cache 24h
    });
    const data = await res.json();
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

// Parse UTC offset string like "UTC+1", "UTC-5", "Europe/Paris (UTC+1)" → number
function parseUtcOffset(timezone: string): number {
  const match = timezone.match(/UTC([+-])(\d+)/i);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * parseInt(match[2], 10);
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { birthDate, birthTime, birthLocation, timezone } = body;

  // Parse birth date and time
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime ? birthTime.split(":").map(Number) : [12, 0];
  const utcOffset = parseUtcOffset(timezone ?? "UTC+0");

  // Geocode
  const coords = await geocode(birthLocation);
  if (!coords) {
    return NextResponse.json({ error: "Could not geocode birth location" }, { status: 400 });
  }

  // Compute chart
  const chart = computeNatalChart(year, month, day, hour, minute, coords.lat, coords.lng, utcOffset);

  // Store in Supabase
  const { error } = await supabase.from("natal_charts").upsert({
    user_id: user.id,
    birth_date: birthDate,
    birth_time: birthTime ?? "12:00",
    birth_location: birthLocation,
    birth_lat: coords.lat,
    birth_lng: coords.lng,
    birth_timezone: timezone ?? "UTC",
    chart_data: chart,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chart, coords });
}
