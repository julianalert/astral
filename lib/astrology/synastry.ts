import type { NatalChart } from "./chart";

export interface SynastryAspect {
  personAPlanet: string;
  personBPlanet: string;
  aspect: string;
  orb: number;
  nature: "harmonious" | "challenging" | "neutral";
}

const ASPECT_ANGLES = [0, 60, 90, 120, 150, 180];
const ASPECT_NAMES  = ["Conjunction", "Sextile", "Square", "Trine", "Quincunx", "Opposition"];
const ASPECT_NATURE: Record<string, "harmonious" | "challenging" | "neutral"> = {
  Conjunction: "neutral",   // depends on planets involved
  Sextile:     "harmonious",
  Square:      "challenging",
  Trine:       "harmonious",
  Quincunx:    "challenging",
  Opposition:  "challenging",
};

// Synastry orbs — slightly tighter than transit orbs
const SYNASTRY_ORB = 6;
const TIGHT_ORB    = 3;

function extractLongitudes(chart: NatalChart): Record<string, number> {
  return {
    Sun:     chart.sun.longitude,
    Moon:    chart.moon.longitude,
    Mercury: chart.mercury.longitude,
    Venus:   chart.venus.longitude,
    Mars:    chart.mars.longitude,
    Jupiter: chart.jupiter.longitude,
    Saturn:  chart.saturn.longitude,
    ASC:     chart.ascendant,
    MC:      chart.mc,
  };
}

export function computeSynastry(
  chartA: NatalChart,
  chartB: NatalChart
): SynastryAspect[] {
  const lonsA = extractLongitudes(chartA);
  const lonsB = extractLongitudes(chartB);

  const aspects: SynastryAspect[] = [];

  for (const [planetA, lonA] of Object.entries(lonsA)) {
    for (const [planetB, lonB] of Object.entries(lonsB)) {
      let diff = Math.abs(lonA - lonB);
      if (diff > 180) diff = 360 - diff;

      for (let i = 0; i < ASPECT_ANGLES.length; i++) {
        const orb = Math.abs(diff - ASPECT_ANGLES[i]);
        if (orb <= SYNASTRY_ORB) {
          aspects.push({
            personAPlanet: planetA,
            personBPlanet: planetB,
            aspect: ASPECT_NAMES[i],
            orb: Math.round(orb * 10) / 10,
            nature: ASPECT_NATURE[ASPECT_NAMES[i]],
          });
          break;
        }
      }
    }
  }

  // Sort: tightest orb first, prioritise luminaries (Sun/Moon)
  return aspects.sort((a, b) => {
    const aIsLuminary = ["Sun", "Moon"].includes(a.personAPlanet) || ["Sun", "Moon"].includes(a.personBPlanet);
    const bIsLuminary = ["Sun", "Moon"].includes(b.personAPlanet) || ["Sun", "Moon"].includes(b.personBPlanet);
    if (aIsLuminary !== bIsLuminary) return aIsLuminary ? -1 : 1;
    return a.orb - b.orb;
  });
}

export function formatSynastryForPrompt(
  aspects: SynastryAspect[],
  nameA: string,
  nameB: string
): string {
  if (!aspects.length) return "No major synastry aspects found.";

  const top = aspects.slice(0, 12);
  return top.map(a => {
    const tight = a.orb <= TIGHT_ORB ? " (tight)" : "";
    return `- ${nameA}'s ${a.personAPlanet ?? a.personAPlanet} ${a.aspect.toLowerCase()} ${nameB}'s ${a.personBPlanet} (orb ${a.orb}°)${tight}`;
  }).join("\n");
}
