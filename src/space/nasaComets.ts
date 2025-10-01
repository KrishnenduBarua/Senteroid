import { JulianDate } from "cesium";
import { OrbitParams } from "./neoOrbits";

// Simple in-memory cache
let cached: OrbitParams[] | null = null;
let loadingPromise: Promise<OrbitParams[] | null> | null = null;

// Use only static file (user requirement) for performance & determinism
const STATIC_URL = "/data/near_earth_comets_static.json";

// Fallback legacy doc JSON (the documentation page you provided is not a direct clean JSON array endpoint)
// We try the dataset endpoint first; if CORS or format issues, we reject.

// Astronomical constants
const AU_KM = 149_597_870.7;
const MIN_A_SCALED = 120_000; // km (same as synthetic lower bound)
const MAX_A_SCALED = 750_000; // km

interface RawComet {
  object?: string; // sometimes
  object_name?: string;
  epoch_tdb?: string; // MJD or JD
  tp_tdb?: string; // JD of perihelion
  e?: string;
  i_deg?: string;
  w_deg?: string; // argument of perihelion
  node_deg?: string; // longitude ascending node
  q_au_1?: string; // perihelion distance
  q_au_2?: string; // aphelion distance
  p_yr?: string; // orbital period in years
}

function parseNumber(v?: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(/\s+/g, ""));
  return isFinite(n) ? n : undefined;
}

function toJulianDate(jd: number): JulianDate {
  const dayNumber = Math.floor(jd);
  const dayFraction = jd - dayNumber;
  const secondsOfDay = dayFraction * 86400;
  return new JulianDate(dayNumber, secondsOfDay);
}

export async function fetchScaledNASACometOrbits(): Promise<
  OrbitParams[] | null
> {
  if (cached) return cached;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const local = await fetch(STATIC_URL, { cache: "no-cache" });
      if (!local.ok) throw new Error("Failed to load static comet dataset");
      const raw: RawComet[] | null = await local.json();
      if (!raw) return null; // final guard

      // First pass: collect semi-major axes to define scaling range (filtering extreme long-period objects)
      const elements: {
        raw: RawComet;
        a_AU: number;
        e: number;
        sortKey: number;
      }[] = [];
      for (const r of raw) {
        const q = parseNumber(r.q_au_1);
        const Q = parseNumber(r.q_au_2);
        const e = parseNumber(r.e);
        if (q == null || Q == null || e == null) continue;
        // Derive a
        const a = (q + Q) / 2;
        if (!isFinite(a) || a <= 0) continue;
        // Exclude hyperbolic or ridiculous values (some long period may inflate scale)
        if (a > 50) continue; // ignore >50 AU to keep scale reasonable near Earth
        // Use perihelion passage (tp_tdb) or epoch as a future-sort key (smaller = sooner)
        const tpRaw = parseNumber(r.tp_tdb);
        let tpJD = tpRaw != null ? tpRaw : parseNumber(r.epoch_tdb);
        if (tpJD != null && tpJD < 1_000_000) tpJD += 2400000.5; // convert MJD
        const sortKey = tpJD ?? Number.POSITIVE_INFINITY;
        elements.push({ raw: r, a_AU: a, e, sortKey });
      }
      if (!elements.length) return null;

      // Sort by upcoming perihelion/epoch and pick top 5 (updated requirement)
      elements.sort((a, b) => a.sortKey - b.sortKey);
      const limited = elements.slice(0, 5);

      const minA = Math.min(...limited.map((e) => e.a_AU));
      const maxA = Math.max(...limited.map((e) => e.a_AU));

      const now = JulianDate.now();

      const scaled: OrbitParams[] = limited.map(({ raw, a_AU, e }) => {
        const i = parseNumber(raw.i_deg) ?? 0;
        const omega = parseNumber(raw.node_deg) ?? 0; // Ω
        const w = parseNumber(raw.w_deg) ?? 0; // ω
        const periodYears = parseNumber(raw.p_yr) ?? Math.sqrt(a_AU ** 3); // Kepler approximation P^2 = a^3 (a in AU)
        // Time conversions
        const epochRaw = parseNumber(raw.epoch_tdb);
        const tpJD = parseNumber(raw.tp_tdb);
        let epochJD: number;
        if (epochRaw == null) {
          // fallback: use tpJD or now
          epochJD = tpJD ?? 0;
        } else {
          epochJD = epochRaw < 1_000_000 ? epochRaw + 2400000.5 : epochRaw; // assume MJD if small
        }
        const epochJulian = toJulianDate(epochJD);
        let perihelionDate: string | undefined;
        if (tpJD) {
          const dayNumber = Math.floor(tpJD);
          const dayFraction = tpJD - dayNumber;
          const date = new Date((tpJD - 2440587.5) * 86400000); // JD -> ms
          perihelionDate = date.toISOString().slice(0, 10);
        }
        // Semi-major axis scaling (linear)
        const clampedA = Math.min(Math.max(a_AU, minA), maxA);
        const norm = (clampedA - minA) / (maxA - minA || 1);
        const a_km_scaled = MIN_A_SCALED + norm * (MAX_A_SCALED - MIN_A_SCALED);

        // Compute mean anomaly at epoch from perihelion JD (tpJD) if available
        let M0_rad = Math.random() * 2 * Math.PI; // fallback
        if (tpJD && periodYears && periodYears > 0) {
          const periodSeconds = periodYears * 365.25 * 86400;
          const n = (2 * Math.PI) / periodSeconds; // rad/s (since Kepler's third law normalized for Earth ~1 AU ~1 year; scaling anyway)
          const dtDays = epochJD - tpJD; // days
          const dtSeconds = dtDays * 86400;
          M0_rad =
            (((n * dtSeconds) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        }

        // Clamp eccentricity for aesthetics (avoid extremely elongated shapes dominating screen)
        const eClamped = Math.min(e, 0.85);

        return {
          a_km: a_km_scaled,
          e: eClamped < 0 ? 0 : eClamped,
          i_rad: (i * Math.PI) / 180,
          omega_rad: (omega * Math.PI) / 180,
          w_rad: (w * Math.PI) / 180,
          M0_rad,
          epoch: epochJulian,
          name: raw.object_name || raw.object || "Comet",
          perihelionDate,
        } as OrbitParams;
      });

      cached = scaled;
      return scaled;
    } catch (e) {
      console.warn("Failed to load NASA comet data", e);
      return null;
    }
  })();

  return loadingPromise;
}
