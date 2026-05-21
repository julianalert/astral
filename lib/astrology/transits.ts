import { computeNatalChart, type NatalChart, type PlanetPosition } from "./chart";

interface TransitHit {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean; // orb < 0.5°
}

const TRANSIT_ORBS: Record<string, number> = {
  Sun: 1.5, Moon: 2, Mercury: 1.5, Venus: 1.5, Mars: 2,
  Jupiter: 4, Saturn: 5, Uranus: 5, Neptune: 5,
};

const ASPECT_ANGLES = [0, 60, 90, 120, 150, 180];
const ASPECT_NAMES  = ["Conjunction", "Sextile", "Square", "Trine", "Quincunx", "Opposition"];

function planetLon(chart: NatalChart, name: string): number {
  const map: Record<string, PlanetPosition> = {
    sun: chart.sun, moon: chart.moon, mercury: chart.mercury, venus: chart.venus,
    mars: chart.mars, jupiter: chart.jupiter, saturn: chart.saturn,
    uranus: chart.uranus, neptune: chart.neptune,
  };
  return map[name.toLowerCase()]?.longitude ?? 0;
}

export function getCurrentTransits(natalChart: NatalChart, now = new Date()): TransitHit[] {
  // Compute transit chart for today (noon UTC)
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const transitChart = computeNatalChart(y, m, d, 12, 0, 0, 0, 0);

  const transitPlanets: [string, number][] = [
    ["Sun",     transitChart.sun.longitude],
    ["Moon",    transitChart.moon.longitude],
    ["Mercury", transitChart.mercury.longitude],
    ["Venus",   transitChart.venus.longitude],
    ["Mars",    transitChart.mars.longitude],
    ["Jupiter", transitChart.jupiter.longitude],
    ["Saturn",  transitChart.saturn.longitude],
    ["Uranus",  transitChart.uranus.longitude],
    ["Neptune", transitChart.neptune.longitude],
  ];

  const natalPlanets: [string, number][] = [
    ["Sun",     natalChart.sun.longitude],
    ["Moon",    natalChart.moon.longitude],
    ["Mercury", natalChart.mercury.longitude],
    ["Venus",   natalChart.venus.longitude],
    ["Mars",    natalChart.mars.longitude],
    ["Jupiter", natalChart.jupiter.longitude],
    ["Saturn",  natalChart.saturn.longitude],
    ["ASC",     natalChart.ascendant],
    ["MC",      natalChart.mc],
  ];

  const hits: TransitHit[] = [];

  for (const [tName, tLon] of transitPlanets) {
    const maxOrb = TRANSIT_ORBS[tName] ?? 2;
    for (const [nName, nLon] of natalPlanets) {
      let diff = Math.abs(tLon - nLon);
      if (diff > 180) diff = 360 - diff;
      for (let i = 0; i < ASPECT_ANGLES.length; i++) {
        const orb = Math.abs(diff - ASPECT_ANGLES[i]);
        if (orb <= maxOrb) {
          hits.push({
            transitPlanet: tName,
            natalPlanet: nName,
            aspect: ASPECT_NAMES[i],
            orb: Math.round(orb * 10) / 10,
            exact: orb < 0.5,
          });
          break;
        }
      }
    }
  }

  return hits.sort((a, b) => a.orb - b.orb);
}

export function formatTransitsForPrompt(hits: TransitHit[]): string {
  if (!hits.length) return "No major transits active today.";
  return hits.slice(0, 8).map(h =>
    `- Transit ${h.transitPlanet} ${h.aspect.toLowerCase()} natal ${h.natalPlanet} (orb ${h.orb}°)${h.exact ? " — exact today" : ""}`
  ).join("\n");
}
