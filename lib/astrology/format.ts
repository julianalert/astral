import type { NatalChart, PlanetPosition, Aspect } from "./chart";

// Degree/minute format: "14°32'"
export function formatDegree(deg: number): string {
  const d = Math.floor(deg % 30);
  const m = Math.floor((deg % 1) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

// "Sun in Scorpio 14°" → brief
export function formatPlacement(name: string, p: PlanetPosition): string {
  const retro = p.retrograde ? " ℞" : "";
  return `${name} in ${p.sign} ${Math.floor(p.degree)}°${retro} (${ordinal(p.house)} house)`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatAspect(a: Aspect): string {
  return `${a.planet1} ${a.aspect.toLowerCase()} ${a.planet2} (orb ${a.orb.toFixed(1)}°)`;
}

// Generate the compact chart summary injected into every AI system prompt
export function buildChartContext(chart: NatalChart, userName: string, birthInfo: string): string {
  const planets = [
    ["Sun",     chart.sun],
    ["Moon",    chart.moon],
    ["Mercury", chart.mercury],
    ["Venus",   chart.venus],
    ["Mars",    chart.mars],
    ["Jupiter", chart.jupiter],
    ["Saturn",  chart.saturn],
    ["Uranus",  chart.uranus],
    ["Neptune", chart.neptune],
  ] as [string, PlanetPosition][];

  const planetLines = planets.map(([name, p]) => {
    const retro = p.retrograde ? " ℞" : "";
    return `- ${name} in ${p.sign} ${Math.floor(p.degree)}°${retro}, ${ordinal(p.house)} house`;
  }).join("\n");

  const { sign: ascSign } = chart.houses[0];
  const { sign: mcSign  } = chart.houses[9];

  const topAspects = chart.aspects
    .filter(a => ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(a.planet1) ||
                 ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(a.planet2))
    .slice(0, 6)
    .map(formatAspect)
    .join(", ");

  return `[USER'S NATAL CHART]

${userName}'s chart: ${birthInfo}

Core placements:
${planetLines}
- Rising: ${ascSign} (ASC ${Math.floor(chart.ascendant)}°)
- Midheaven: ${mcSign} (MC ${Math.floor(chart.mc)}°)

Key aspects: ${topAspects || "none within standard orbs"}`;
}
