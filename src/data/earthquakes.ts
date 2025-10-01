// earthquake.ts
// USGS-style earthquake comparison utilities for impact-generated seismic magnitude
// Provides classification bands and notable historical earthquake references.

export interface NotableEarthquake {
  name: string;
  year: number;
  magnitude: number; // Moment magnitude (Mw)
  location?: string;
  summary: string;
  sourceUrl?: string; // Link to USGS (event page or authoritative summary)
}

// Curated list of globally notable earthquakes (instrumental + historic) for comparison.
// Sorted ascending by magnitude.
export const NOTABLE_EARTHQUAKES: NotableEarthquake[] = [
  {
    name: "Northridge",
    year: 1994,
    magnitude: 6.7,
    location: "California, USA",
    summary:
      "Severe urban damage; strong ground acceleration; modern building code test case.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/ci3144585/executive",
  }, // :contentReference[oaicite:0]{index=0}
  {
    name: "Kobe (Great Hanshin)",
    year: 1995,
    magnitude: 6.9,
    location: "Japan",
    summary:
      "Extensive structural collapse; catalyst for seismic retrofit reforms.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/usp0006rew/executive",
  }, // :contentReference[oaicite:1]{index=1}
  {
    name: "Loma Prieta",
    year: 1989,
    magnitude: 6.9,
    location: "California, USA",
    summary:
      "Bay Area damage; freeway and bridge failures; broadcast live on TV.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/nc216859/executive",
  }, // :contentReference[oaicite:2]{index=2}
  {
    name: "Haiti",
    year: 2010,
    magnitude: 7.0,
    location: "Haiti",
    summary:
      "Devastating impact due to vulnerable infrastructure; high casualty count.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/usp000h60h/executive",
  }, // :contentReference[oaicite:3]{index=3}
  {
    name: "Turkey–Syria",
    year: 2023,
    magnitude: 7.8,
    location: "Türkiye / Syria border region",
    summary: "Multiple mainshocks; widespread regional devastation.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/us6000jllz/executive",
  }, // :contentReference[oaicite:4]{index=4}
  {
    name: "San Francisco",
    year: 1906,
    magnitude: 7.9,
    location: "California, USA",
    summary:
      "Fire and rupture destruction; benchmark strike-slip event.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/official19060418131201130_12/executive",
  }, // :contentReference[oaicite:5]{index=5}
  {
    name: "Sichuan (Wenchuan)",
    year: 2008,
    magnitude: 7.9,
    location: "China",
    summary:
      "Mountainous landslides, infrastructure collapse, high casualties.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/usp000g650/executive",
  }, // :contentReference[oaicite:6]{index=6}
  {
    name: "Great Alaska (Prince William Sound)",
    year: 1964,
    magnitude: 9.2,
    location: "Alaska, USA",
    summary:
      "Massive subduction event; generated Pacific-wide tsunami.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/official19640328033616130_30/executive",
  }, // :contentReference[oaicite:7]{index=7}
  {
    name: "Tohoku",
    year: 2011,
    magnitude: 9.1,
    location: "Japan",
    summary:
      "Megathrust rupture + tsunami; nuclear accident cascade.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/official20110311054624120_30/executive",
  }, // :contentReference[oaicite:8]{index=8}
  {
    name: "Sumatra–Andaman",
    year: 2004,
    magnitude: 9.1,
    location: "Indian Ocean",
    summary:
      "Indian Ocean tsunami; multi-plate rupture over ~1300 km.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/official20041226005853450_30/executive",
  }, // :contentReference[oaicite:9]{index=9}
  {
    name: "Valdivia (Great Chilean)",
    year: 1960,
    magnitude: 9.5,
    location: "Chile",
    summary:
      "Largest instrumentally recorded earthquake; Pacific-wide tsunami.",
    sourceUrl:
      "https://earthquake.usgs.gov/earthquakes/eventpage/official19600522191120_30",
  }, // :contentReference[oaicite:10]{index=10}
].sort((a, b) => a.magnitude - b.magnitude);

export interface EarthquakeComparison {
  classification: string; // e.g., "Moderate", "Great"
  nearest: NotableEarthquake | null; // closest historic event
  bracket?: { lower?: NotableEarthquake; upper?: NotableEarthquake }; // surrounding events
  relativeText: string; // human readable comparison
  exceedsRecorded: boolean; // true if larger than largest in list
}

// USGS general magnitude classes
export function classifyMagnitude(m: number): string {
  if (m < 2) return "Micro";
  if (m < 4) return "Minor";
  if (m < 5) return "Light";
  if (m < 6) return "Moderate";
  if (m < 7) return "Strong";
  if (m < 8) return "Major";
  return "Great"; // ≥ 8
}

export function compareMagnitude(m: number): EarthquakeComparison {
  const classification = classifyMagnitude(m);
  const list = NOTABLE_EARTHQUAKES;

  if (m > list[list.length - 1].magnitude) {
    return {
      classification,
      nearest: list[list.length - 1],
      bracket: { lower: list[list.length - 1] },
      relativeText:
        "Larger than any instrumentally recorded tectonic earthquake (impact-generated energy is extreme).",
      exceedsRecorded: true,
    };
  }

  // Find nearest and bracket
  let lower: NotableEarthquake | undefined;
  let upper: NotableEarthquake | undefined;
  for (const eq of list) {
    if (eq.magnitude <= m) lower = eq;
    if (eq.magnitude >= m) {
      upper = eq;
      break;
    }
  }

  // Determine nearest
  let nearest: NotableEarthquake | null = null;
  if (lower && upper) {
    const dLower = Math.abs(m - lower.magnitude);
    const dUpper = Math.abs(upper.magnitude - m);
    nearest = dLower <= dUpper ? lower : upper;
  } else if (lower) nearest = lower;
  else if (upper) nearest = upper;

  let relativeText = "";
  if (lower && upper && lower !== upper) {
    relativeText = `Between the ${lower.year} ${lower.name} (M${lower.magnitude.toFixed(
      1
    )}) and the ${upper.year} ${upper.name} (M${upper.magnitude.toFixed(
      1
    )})`;
  } else if (nearest) {
    if (Math.abs(nearest.magnitude - m) < 0.05) {
      relativeText = `Comparable to the ${nearest.year} ${nearest.name} earthquake (M${nearest.magnitude.toFixed(
        1
      )})`;
    } else if (nearest.magnitude < m) {
      relativeText = `Slightly larger than the ${nearest.year} ${nearest.name} (M${nearest.magnitude.toFixed(
        1
      )})`;
    } else {
      relativeText = `Slightly smaller than the ${nearest.year} ${nearest.name} (M${nearest.magnitude.toFixed(
        1
      )})`;
    }
  }

  return {
    classification,
    nearest,
    bracket: { lower, upper },
    relativeText,
    exceedsRecorded: false,
  };
}
