import type { NatalChart, ZodiacSign } from "./chart";
import { ordinal } from "./format";

export type TraditionalPlanet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export interface AnnualProfection {
  house: number;
  houseName: string;       // "10th house"
  themes: string;          // "Career, reputation, public life…"
  lordOfYear: TraditionalPlanet;
  lordSign: ZodiacSign;
  age: number;
  yearStart: Date;         // Last birthday
  yearEnd: Date;           // Next birthday
  daysRemaining: number;   // Days until next profection year
  isBirthday: boolean;     // Today is the birthday
  daysUntilBirthday: number;
}

// Traditional (Hellenistic) sign rulerships — no outer planets
const SIGN_RULERS: Record<ZodiacSign, TraditionalPlanet> = {
  Aries:       "Mars",
  Taurus:      "Venus",
  Gemini:      "Mercury",
  Cancer:      "Moon",
  Leo:         "Sun",
  Virgo:       "Mercury",
  Libra:       "Venus",
  Scorpio:     "Mars",
  Sagittarius: "Jupiter",
  Capricorn:   "Saturn",
  Aquarius:    "Saturn",
  Pisces:      "Jupiter",
};

const HOUSE_THEMES: Record<number, string> = {
  1:  "Identity, self, new beginnings — a year to redefine yourself",
  2:  "Money, values, what you're building — financial and material focus",
  3:  "Communication, ideas, learning — a year of information and movement",
  4:  "Home, family, roots — private life and foundations take center stage",
  5:  "Creativity, romance, pleasure — a year of expression and play",
  6:  "Health, work, daily life — routines and service are amplified",
  7:  "Partnership, contracts, others — relationships are the main story",
  8:  "Transformation, depth, shared resources — a year of change and intensity",
  9:  "Belief, travel, expansion — seeking meaning and new horizons",
  10: "Career, reputation, public life — a year of visible achievement or reckoning",
  11: "Community, friendships, the future — collective and vision-oriented",
  12: "Rest, solitude, the unconscious — a quieter, more internal year",
};

// Concise theme labels for UI (comma-separated keywords)
const HOUSE_THEME_LABELS: Record<number, string> = {
  1:  "Identity · Self · New beginnings",
  2:  "Money · Values · Building",
  3:  "Communication · Ideas · Learning",
  4:  "Home · Family · Roots",
  5:  "Creativity · Romance · Pleasure",
  6:  "Health · Work · Routines",
  7:  "Partnership · Contracts · Others",
  8:  "Transformation · Depth · Change",
  9:  "Belief · Travel · Expansion",
  10: "Career · Reputation · Public life",
  11: "Community · Friendships · Vision",
  12: "Rest · Solitude · Inner world",
};

function getAge(birthDate: Date, today: Date): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getLastBirthday(birthDate: Date, today: Date): Date {
  const year = today.getFullYear();
  const candidate = new Date(year, birthDate.getMonth(), birthDate.getDate());
  if (candidate > today) {
    return new Date(year - 1, birthDate.getMonth(), birthDate.getDate());
  }
  return candidate;
}

function getNextBirthday(birthDate: Date, today: Date): Date {
  const year = today.getFullYear();
  const candidate = new Date(year, birthDate.getMonth(), birthDate.getDate());
  if (candidate <= today) {
    return new Date(year + 1, birthDate.getMonth(), birthDate.getDate());
  }
  return candidate;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function getAnnualProfection(
  birthDate: Date,
  natalChart: NatalChart,
  today: Date = new Date()
): AnnualProfection {
  const age = getAge(birthDate, today);
  const house = (age % 12) + 1;

  const housePos = natalChart.houses[house - 1];
  const lordSign = housePos.sign;
  const lordOfYear = SIGN_RULERS[lordSign];

  const yearStart = getLastBirthday(birthDate, today);
  const yearEnd   = getNextBirthday(birthDate, today);

  const daysRemaining     = daysBetween(today, yearEnd);
  const daysUntilBirthday = daysBetween(today, yearEnd);

  const isBirthday =
    today.getMonth() === birthDate.getMonth() &&
    today.getDate()  === birthDate.getDate();

  return {
    house,
    houseName: `${ordinal(house)} house`,
    themes: HOUSE_THEMES[house],
    lordOfYear,
    lordSign,
    age,
    yearStart,
    yearEnd,
    daysRemaining,
    isBirthday,
    daysUntilBirthday,
  };
}

/** Year-period progress 0–1 (for the progress bar) */
export function getProfectionProgress(profection: AnnualProfection): number {
  const total = daysBetween(profection.yearStart, profection.yearEnd);
  const elapsed = total - profection.daysRemaining;
  return Math.min(1, Math.max(0, elapsed / total));
}

/** Next profection year — used for birthday transition banner / upcoming endpoint */
export function getNextAnnualProfection(
  birthDate: Date,
  natalChart: NatalChart,
  today: Date = new Date()
): AnnualProfection {
  const nextBirthday = getNextBirthday(birthDate, today);
  // Move one day past next birthday to compute next year's profection
  const dayAfter = new Date(nextBirthday.getTime() + 24 * 60 * 60 * 1000);
  return getAnnualProfection(birthDate, natalChart, dayAfter);
}

export { HOUSE_THEMES, HOUSE_THEME_LABELS, SIGN_RULERS };
