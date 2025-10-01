// src/data/sbdb.ts
// Back-compat shim around the new SBDB client so existing components keep working.

import {
  fetchCuratedForSim,
  fetchSmallBodyForSim,
  fetchBySpkidsForSim,
  fetchByDesignationsForSim,
  type SmallBodyForSim,
} from "./sbdbClient"; // <-- make sure this file exists (the one you pasted earlier)

/** Old type expected by NeoSelector/etc. */
export interface SmallBodyNormalized {
  id: string;
  name: string;
  diameter_m: number;              // meters
  absolute_magnitude?: number;
  spectral_type?: string;
  semi_major_axis_AU?: number;     // a (AU)
  eccentricity?: number;           // e
  inclination_deg?: number;        // i (deg)
  moid_AU?: number;                // keep AU here for UI parity (optional)
  density_kg_m3: number;
  nasa_jpl_url?: string;
}

/** Convert SmallBodyForSim -> SmallBodyNormalized */
function toNormalized(row: SmallBodyForSim): SmallBodyNormalized {
  const moid_AU =
    typeof row.moid_km === "number" ? row.moid_km / 149_597_870.7 : undefined;

  return {
    id: row.id,
    name: row.name,
    diameter_m: typeof row.diameter_m === "number"
      ? row.diameter_m
      : (typeof row.absolute_magnitude === "number" ? 0 : 0), // fallback to 0 if undefined; adjust as needed
    absolute_magnitude: row.absolute_magnitude,
    spectral_type: row.spectral_type,
    semi_major_axis_AU: row.a_AU,
    eccentricity: row.e,
    inclination_deg: row.i_deg,
    moid_AU,
    density_kg_m3: row.density_kg_m3,
    nasa_jpl_url: row.nasa_jpl_url,
  };
}

/** === Back-compat functions expected by your code === */

/** fetchCuratedSmallBodies: returns SmallBodyNormalized[] */
export async function fetchCuratedSmallBodies(
  ids?: string[]
): Promise<SmallBodyNormalized[]> {
  const rows = await fetchCuratedForSim(ids);
  return rows
    .map(toNormalized)
    .filter((r: SmallBodyNormalized) => !!r.diameter_m || !!r.absolute_magnitude);
}

/** Optional helpers you might want available under the old module: */
export async function fetchSmallBodyNormalized(
  sstr: string
): Promise<SmallBodyNormalized | null> {
  const r = await fetchSmallBodyForSim(sstr);
  return r ? toNormalized(r) : null;
}
export async function fetchBySpkidsNormalized(
  spkids: (string | number)[]
): Promise<SmallBodyNormalized[]> {
  const rows = await fetchBySpkidsForSim(spkids);
  return rows.map(toNormalized);
}
export async function fetchByDesignationsNormalized(
  desList: string[]
): Promise<SmallBodyNormalized[]> {
  const rows = await fetchByDesignationsForSim(desList);
  return rows.map(toNormalized);
}

/** Your existing simulator expects this helper to seed AsteroidParameters */
export function smallBodyToAsteroidParams(sb: SmallBodyNormalized) {
  // Randomize within typical ranges (12–30 km/s, 10–80°)
  const speedMs = (Math.random() * (30 - 12) + 12) * 1000;
  const angle = Math.round(Math.random() * 70 + 10);
  return {
    type: "stone" as const,        // baseline; you override density separately
    diameter: sb.diameter_m,       // meters
    speed: speedMs,                // m/s
    angle,                         // degrees
    density: sb.density_kg_m3,     // kg/m^3
  };
}
