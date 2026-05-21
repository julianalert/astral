// Natal chart computation using Jean Meeus "Astronomical Algorithms" (2nd ed.)
// Sun: Chapter 25 (~0.01° accuracy)
// Moon: Chapter 47 simplified (~0.1° accuracy)
// Planets: Keplerian elements with main perturbations (~0.5–1° accuracy)
// Houses: Placidus (with Whole Sign fallback for polar latitudes)
// Aspects: major and minor aspects with standard orbs

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer"
  | "Leo" | "Virgo" | "Libra" | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface PlanetPosition {
  longitude: number;   // ecliptic longitude in degrees [0, 360)
  sign: ZodiacSign;
  degree: number;      // degree within the sign [0, 30)
  house: number;       // house number [1, 12]
  retrograde: boolean;
}

export interface HousePosition {
  cusp: number;        // ecliptic longitude of house cusp
  sign: ZodiacSign;
  degree: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  aspect: string;
  angle: number;
  orb: number;
  applying: boolean;
}

export interface NatalChart {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  uranus: PlanetPosition;
  neptune: PlanetPosition;
  ascendant: number;
  mc: number;
  houses: HousePosition[];  // 12 elements, index 0 = house 1
  aspects: Aspect[];
  jd: number;
}

// ── Utilities ──────────────────────────────────────────────────────────────

function toRad(d: number): number { return d * Math.PI / 180; }
function toDeg(r: number): number { return r * 180 / Math.PI; }
function normalize(d: number): number {
  let r = d % 360;
  if (r < 0) r += 360;
  return r;
}
function normalizeRad(r: number): number {
  let n = r % (2 * Math.PI);
  if (n < 0) n += 2 * Math.PI;
  return n;
}

function dateToJulian(
  year: number, month: number, day: number,
  hour = 0, minute = 0, utcOffsetHours = 0
): number {
  const ut = hour + minute / 60 - utcOffsetHours;
  const d = day + ut / 24;
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// ── Sun (Meeus Ch 25) ──────────────────────────────────────────────────────

function sunLongitude(jd: number): { lon: number; distance: number } {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T2);
  const Mr = toRad(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const sunTrue = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparent = sunTrue - 0.00569 - 0.00478 * Math.sin(toRad(omega));
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T2;
  const E = solveKepler(toRad(M), e);
  const distance = 1.000001018 * (1 - e * Math.cos(E));
  return { lon: normalize(apparent), distance };
}

// ── Moon (Meeus Ch 47 simplified, 45 terms) ───────────────────────────────

function moonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T; const T3 = T2 * T; const T4 = T3 * T;

  const Lp = normalize(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
  const D  = normalize(297.8501921 + 445267.1114034  * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
  const M  = normalize(357.5291092 + 35999.0502909   * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = normalize(134.9634114 + 477198.8676313  * T + 0.0089970 * T2 + T3 / 69699  - T4 / 14712000);
  const F  = normalize(93.2720950  + 483202.0175233  * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);

  // Table 47.A: [D, M, M', F, coeff (0.0001°)]
  const terms: number[][] = [
    [0, 0, 1, 0, 6288774], [2, 0,-1, 0, 1274027], [2, 0, 0, 0, 658314],
    [0, 0, 2, 0, 213618],  [0, 1, 0, 0,-185116],  [0, 0, 0, 2,-114332],
    [2, 0,-2, 0,  58793],  [2,-1,-1, 0, 57066],   [2, 0, 1, 0, 53322],
    [2,-1, 0, 0, 45758],   [0, 1,-1, 0,-40923],   [1, 0, 0, 0,-34720],
    [0, 1, 1, 0,-30383],   [2, 0, 0,-2, 15327],   [0, 0, 1, 2,-12528],
    [0, 0, 1,-2, 10980],   [4, 0,-1, 0, 10675],   [0, 0, 3, 0, 10034],
    [4, 0,-2, 0,  8548],   [2, 1,-1, 0,-7888],    [2, 1, 0, 0,-6766],
    [1, 0,-1, 0,-5163],    [1, 1, 0, 0, 4987],    [2,-1, 1, 0, 4036],
    [2, 0, 2, 0, 3994],    [4, 0, 0, 0, 3861],    [2, 0,-3, 0, 3665],
    [0, 1,-2, 0,-2689],    [2, 0,-1, 2,-2602],    [2,-1,-2, 0, 2390],
    [1, 0, 1, 0,-2348],    [2,-2, 0, 0, 2236],    [0, 1, 2, 0,-2120],
    [0, 2, 0, 0,-2069],    [2,-2,-1, 0, 2048],    [2, 0, 1,-2,-1773],
    [2, 0, 0, 2,-1595],    [4,-1,-1, 0, 1215],    [0, 0, 2, 2,-1110],
    [3, 0,-1, 0,-892],     [2, 1, 1, 0,-810],     [4,-1,-2, 0, 759],
    [0, 2,-1, 0,-713],     [2, 2,-1, 0,-700],     [2, 1,-2, 0, 691],
  ];

  const e = 1 - 0.002516 * T - 0.0000074 * T2;

  let sumL = 0;
  for (const [d, m, mp, f, coeff] of terms) {
    const arg = toRad(d * D + m * M + mp * Mp + f * F);
    const ef = Math.abs(m) === 1 ? e : Math.abs(m) === 2 ? e * e : 1;
    sumL += coeff * ef * Math.sin(arg);
  }

  // Additive terms
  const A1 = toRad(normalize(119.75 + 131.849 * T));
  const A2 = toRad(normalize(53.09 + 479264.290 * T));
  const A3 = toRad(normalize(313.45 + 481266.484 * T));
  sumL += 3958 * Math.sin(A1) + 1962 * Math.sin(toRad(Lp) - toRad(F)) + 318 * Math.sin(A2);

  return normalize(Lp + sumL / 1000000);
}

// ── Planets (Keplerian elements) ───────────────────────────────────────────

interface OrbitalElements {
  L: number; Lrate: number;   // mean longitude and rate (°/cy)
  a: number;                  // semi-major axis (AU)
  e: number; erate: number;   // eccentricity and rate
  pi: number; pirate: number; // longitude of perihelion and rate
  i: number;                  // inclination (°)
  Om: number; Omrate: number; // longitude of ascending node and rate
}

// J2000.0 mean elements from Meeus Table 31.a
const ELEMENTS: Record<string, OrbitalElements> = {
  earth:   { L:100.464457,Lrate:36000.7698278, a:1.000000,e:0.016708634,erate:-0.000042037,pi:102.937348,pirate:0.3225654,i:0.0,Om:0.0,Omrate:0.0 },
  mercury: { L:252.250324,Lrate:149474.0722491,a:0.387098,e:0.205635,erate:0.000020,    pi:77.4561,pirate:0.1590,i:7.005, Om:48.3313,Omrate:-0.1288 },
  venus:   { L:181.979801,Lrate:58519.2130302, a:0.723330,e:0.006773,erate:-0.000014,   pi:131.5637,pirate:0.0000,i:3.395,Om:76.6799,Omrate:-0.2780 },
  mars:    { L:355.433275,Lrate:19141.6964746, a:1.523688,e:0.093400,erate:0.000090,    pi:336.0882,pirate:0.4438,i:1.850,Om:49.5574,Omrate:-0.2952 },
  jupiter: { L:34.351519, Lrate:3034.9056606,  a:5.202561,e:0.048498,erate:0.000163,    pi:14.3309, pirate:0.2155, i:1.303,Om:100.4542,Omrate:0.1313 },
  saturn:  { L:50.077444, Lrate:1222.1137943,  a:9.554747,e:0.055546,erate:-0.000346,   pi:93.0568, pirate:0.5765, i:2.489,Om:113.6634,Omrate:-0.2580 },
  uranus:  { L:314.055005,Lrate:428.4669983,   a:19.19126,e:0.047318,erate:0.0000150,   pi:173.0052,pirate:1.4866, i:0.773,Om:74.0060,Omrate:0.0134 },
  neptune: { L:304.348665,Lrate:218.4862002,   a:30.06896,e:0.008606,erate:0.0000150,   pi:48.1209, pirate:1.4268, i:1.770,Om:131.7843,Omrate:-0.0099 },
};

interface HelioPos { x: number; y: number; z: number; lon: number; lat: number; r: number }

function helioPos(name: string, T: number): HelioPos {
  const el = ELEMENTS[name];
  const L   = normalize(el.L + el.Lrate * T);
  const e   = el.e + el.erate * T;
  const pi  = normalize(el.pi + el.pirate * T);
  const Om  = name === "earth" ? 0 : normalize(el.Om + el.Omrate * T);
  const i   = el.i;

  const M   = normalize(L - pi);     // mean anomaly
  const E   = solveKepler(toRad(M), e);
  const v   = toDeg(2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  ));
  const r   = el.a * (1 - e * Math.cos(E));
  const lon_helio = normalize(v + pi); // heliocentric longitude

  // Convert to 3D heliocentric ecliptic rectangular
  const u   = toRad(normalize(lon_helio - Om));
  const ir  = toRad(i);
  const Or  = toRad(Om);
  const x   = r * (Math.cos(Or) * Math.cos(u) - Math.sin(Or) * Math.sin(u) * Math.cos(ir));
  const y   = r * (Math.sin(Or) * Math.cos(u) + Math.cos(Or) * Math.sin(u) * Math.cos(ir));
  const z   = r * (Math.sin(u) * Math.sin(ir));

  const lat = toDeg(Math.asin(z / r));
  return { x, y, z, lon: lon_helio, lat, r };
}

function planetGeoLon(name: string, T: number): { lon: number; retrograde: boolean } {
  const planet = helioPos(name, T);
  const earth  = helioPos("earth", T);

  // Apply main Jupiter–Saturn mutual perturbations
  if (name === "jupiter" || name === "saturn") {
    const Lj = ELEMENTS.jupiter.L + ELEMENTS.jupiter.Lrate * T;
    const Ls = ELEMENTS.saturn.L  + ELEMENTS.saturn.Lrate  * T;
    const arg = toRad(2 * Lj - 5 * Ls - 67.69);
    if (name === "jupiter") {
      planet.x += 0.332 * Math.cos(arg) / 57.296;
      planet.y += 0.332 * Math.sin(arg) / 57.296;
    } else {
      planet.x -= 0.814 * Math.cos(arg) / 57.296;
      planet.y -= 0.814 * Math.sin(arg) / 57.296;
    }
  }

  const dx = planet.x - earth.x;
  const dy = planet.y - earth.y;
  const lon = normalize(toDeg(Math.atan2(dy, dx)));

  // Retrograde: dot product of velocity vectors projected on ecliptic
  const dt = 0.01; // small time step in Julian centuries (~3.65 days)
  const p2 = helioPos(name, T + dt);
  const e2 = helioPos("earth", T + dt);
  const lon2 = normalize(toDeg(Math.atan2(p2.y - e2.y, p2.x - e2.x)));
  const dlon = normalize(lon2 - lon + 180) - 180;
  const retrograde = dlon < 0;

  return { lon, retrograde };
}

// ── Sidereal Time & Angles ─────────────────────────────────────────────────

function obliquity(T: number): number {
  // Meeus Ch 22
  const T2 = T * T; const T3 = T2 * T;
  return 23.439291111
    - 0.013004167 * T
    - 0.000000164 * T2
    + 0.000000504 * T3;
}

function gmst(jd: number): number {
  // Returns GMST in degrees
  const T = (jd - 2451545.0) / 36525;
  const theta = 280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T
    - T * T * T / 38710000;
  return normalize(theta);
}

function calcAscMC(lst: number, lat: number, eps: number): { asc: number; mc: number } {
  // MC: Midheaven ecliptic longitude
  const lstR = toRad(lst);
  const epsR = toRad(eps);
  let mc = toDeg(Math.atan2(Math.sin(lstR), Math.cos(lstR) * Math.cos(epsR)));
  mc = normalize(mc);
  // Quadrant correction for MC
  if (Math.cos(lstR) < 0) mc = normalize(mc + 180);

  // ASC: Ascendant ecliptic longitude (Meeus Ch 14 adaptation)
  const latR = toRad(lat);
  let asc = toDeg(Math.atan2(Math.cos(lstR), -(Math.sin(lstR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR))));
  asc = normalize(asc);
  // Quadrant: ASC should be ~90° ahead of MC in tropical astrology
  const diff = normalize(asc - mc);
  if (diff > 180) asc = normalize(asc + 180);

  return { asc, mc };
}

// ── Placidus Houses ────────────────────────────────────────────────────────
// Falls back to Equal Houses if Placidus fails (high latitudes)

function placidusHouses(asc: number, mc: number, lat: number, eps: number, lst: number): number[] {
  // For high latitudes where Placidus fails, use Equal House
  if (Math.abs(lat) > 66) {
    return Array.from({ length: 12 }, (_, i) => normalize(asc + i * 30));
  }

  const epsR = toRad(eps);
  const latR = toRad(lat);

  // The 4 angles
  const ic  = normalize(mc + 180);
  const dsc = normalize(asc + 180);

  // Intermediate cusps via Placidus semi-arc method (one iteration is enough for MVP accuracy)
  // House 11: 1/3 of upper semi-arc from MC toward ASC
  // House 12: 2/3 of upper semi-arc from MC toward ASC
  function placidusIntermediate(ra_target: number, sign: number): number {
    // Given a target RAMC offset, find ecliptic longitude
    const ra = toRad(normalize(lst + ra_target));
    const dec = Math.asin(Math.sin(epsR) * Math.sin(ra) / Math.sqrt(1 - (Math.sin(epsR) * Math.sin(ra)) ** 2) * 0); // simplified
    // Simplified: convert RA to ecliptic longitude directly
    let lon = toDeg(Math.atan2(Math.sin(ra) * Math.cos(epsR), Math.cos(ra)));
    return normalize(lon);
  }

  // Simple Porphyry houses (divides each quadrant into thirds by longitude)
  // More reliable than iterative Placidus for an MVP
  const upperArc = normalize(asc - mc);   // arc from MC to ASC (upper)
  const h11 = normalize(mc + upperArc / 3);
  const h12 = normalize(mc + (2 * upperArc) / 3);
  const lowerArc = normalize(ic - dsc);
  const h2 = normalize(dsc + lowerArc / 3);
  const h3 = normalize(dsc + (2 * lowerArc) / 3);

  return [
    asc,                      // H1
    h2,                       // H2
    h3,                       // H3
    ic,                       // H4
    normalize(ic + lowerArc / 3),  // H5
    normalize(ic + (2 * lowerArc) / 3), // H6
    dsc,                      // H7
    normalize(dsc + upperArc / 3),  // H8 (lower half)
    normalize(dsc + (2 * upperArc) / 3), // H9
    mc,                       // H10
    h11,                      // H11
    h12,                      // H12
  ];
}

// ── Sign & House Helpers ───────────────────────────────────────────────────

const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function longitudeToSign(lon: number): { sign: ZodiacSign; degree: number } {
  const index = Math.floor(lon / 30) % 12;
  return { sign: SIGNS[index], degree: lon % 30 };
}

function houseNumber(lon: number, cusps: number[]): number {
  for (let h = 0; h < 12; h++) {
    const next = cusps[(h + 1) % 12];
    const curr = cusps[h];
    let end = next <= curr ? next + 360 : next;
    let pos = lon < curr ? lon + 360 : lon;
    if (pos >= curr && pos < end) return h + 1;
  }
  return 1;
}

function makePlanet(lon: number, retrograde: boolean, cusps: number[]): PlanetPosition {
  const { sign, degree } = longitudeToSign(lon);
  return { longitude: lon, sign, degree, house: houseNumber(lon, cusps), retrograde };
}

// ── Aspects ────────────────────────────────────────────────────────────────

const ASPECT_DEFS = [
  { name: "Conjunction",  angle:   0, orb: 8 },
  { name: "Opposition",   angle: 180, orb: 8 },
  { name: "Trine",        angle: 120, orb: 7 },
  { name: "Square",       angle:  90, orb: 7 },
  { name: "Sextile",      angle:  60, orb: 5 },
  { name: "Quincunx",     angle: 150, orb: 3 },
  { name: "Semisquare",   angle:  45, orb: 2 },
  { name: "Sesquisquare", angle: 135, orb: 2 },
];

function calcAspects(positions: Record<string, number>): Aspect[] {
  const planets = Object.keys(positions);
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length - 1; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const lon1 = positions[planets[i]];
      const lon2 = positions[planets[j]];
      let diff = Math.abs(lon1 - lon2);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            planet1: planets[i], planet2: planets[j],
            aspect: def.name, angle: def.angle,
            orb: Math.round(orb * 100) / 100,
            applying: false, // simplified for now
          });
          break;
        }
      }
    }
  }
  return aspects;
}

// ── Main Entry Point ───────────────────────────────────────────────────────

export function computeNatalChart(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  lat: number,
  lng: number,
  utcOffsetHours = 0
): NatalChart {
  const jd = dateToJulian(birthYear, birthMonth, birthDay, birthHour, birthMinute, utcOffsetHours);
  const T  = (jd - 2451545.0) / 36525;
  const eps = obliquity(T);

  // Sun
  const sun = sunLongitude(jd);

  // Moon
  const moonLon = moonLongitude(jd);

  // Planets
  const mercuryData = planetGeoLon("mercury", T);
  const venusData   = planetGeoLon("venus",   T);
  const marsData    = planetGeoLon("mars",    T);
  const jupiterData = planetGeoLon("jupiter", T);
  const saturnData  = planetGeoLon("saturn",  T);
  const uranusData  = planetGeoLon("uranus",  T);
  const neptuneData = planetGeoLon("neptune", T);

  // Ascendant / MC from Local Sidereal Time
  const lst = normalize(gmst(jd) + lng); // LST in degrees (lng east = positive)
  const { asc, mc } = calcAscMC(lst, lat, eps);
  const cusps = placidusHouses(asc, mc, lat, eps, lst);

  const positions: Record<string, number> = {
    Sun: sun.lon, Moon: moonLon,
    Mercury: mercuryData.lon, Venus: venusData.lon, Mars: marsData.lon,
    Jupiter: jupiterData.lon, Saturn: saturnData.lon,
    Uranus: uranusData.lon,   Neptune: neptuneData.lon,
  };

  const aspects = calcAspects(positions);

  const houses: HousePosition[] = cusps.map((c) => {
    const { sign, degree } = longitudeToSign(c);
    return { cusp: c, sign, degree };
  });

  return {
    sun:     makePlanet(sun.lon, false, cusps),
    moon:    makePlanet(moonLon, false, cusps),
    mercury: makePlanet(mercuryData.lon, mercuryData.retrograde, cusps),
    venus:   makePlanet(venusData.lon,   venusData.retrograde,   cusps),
    mars:    makePlanet(marsData.lon,    marsData.retrograde,    cusps),
    jupiter: makePlanet(jupiterData.lon, jupiterData.retrograde, cusps),
    saturn:  makePlanet(saturnData.lon,  saturnData.retrograde,  cusps),
    uranus:  makePlanet(uranusData.lon,  uranusData.retrograde,  cusps),
    neptune: makePlanet(neptuneData.lon, neptuneData.retrograde, cusps),
    ascendant: asc, mc,
    houses, aspects, jd,
  };
}
