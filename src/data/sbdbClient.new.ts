// Clean rebuilt sbdbClient.ts (static catalog focused)
import { STATIC_ASTEROID_ROWS } from "./staticCatalog";

export interface SmallBodyForSim {
  id: string;
  name: string;
  nasa_jpl_url?: string;
  diameter_m?: number;
  absolute_magnitude?: number;
  spectral_type?: string;
  density_kg_m3: number;
  moid_km?: number;
  a_AU?: number;
  e?: number;
  i_deg?: number;
}

const KM_PER_AU = 149_597_870.7;

const SPECTRAL_DENSITY: Record<string, number> = {
  S: 3000,
  Q: 3000,
  V: 3000,
  C: 1400,
  B: 1400,
  G: 1400,
  F: 1400,
  D: 1500,
  P: 1500,
  M: 7800,
  X: 3500,
};
function densityFromSpectral(spec?: string): number {
  if (!spec) return 2600;
  const k = spec.trim().toUpperCase()[0];
  return SPECTRAL_DENSITY[k] ?? 2600;
}

function normalizeStaticRow(r: any): SmallBodyForSim | null {
  if (!r) return null;
  const diameterKm = r.diameter_km != null ? Number(r.diameter_km) : undefined;
  const spec = r.spec_B || r.spec_T || undefined;
  return {
    id: String(r.spkid),
    name: String(r.full_name).trim(),
    diameter_m: diameterKm != null ? diameterKm * 1000 : undefined,
    absolute_magnitude: r.H != null ? Number(r.H) : undefined,
    spectral_type: spec,
    density_kg_m3: densityFromSpectral(spec),
    moid_km: r.moid != null ? Number(r.moid) * KM_PER_AU : undefined,
    a_AU: r.a != null ? Number(r.a) : undefined,
    e: r.e != null ? Number(r.e) : undefined,
    i_deg: r.i != null ? Number(r.i) : undefined,
  };
}

export async function fetchSmallBodyForSim(
  id: string
): Promise<SmallBodyForSim | null> {
  const row = STATIC_ASTEROID_ROWS.find(
    (r) => String(r.spkid) === id || r.full_name.includes(id)
  );
  return normalizeStaticRow(row);
}

export async function fetchNeoCatalogForSim(
  limit = 15
): Promise<SmallBodyForSim[]> {
  return STATIC_ASTEROID_ROWS.slice(0, limit)
    .map(normalizeStaticRow)
    .filter((x): x is SmallBodyForSim => !!x)
    .sort((a, b) => {
      const da = a.diameter_m ?? -1;
      const db = b.diameter_m ?? -1;
      if (db !== da) return db - da;
      const ha = a.absolute_magnitude ?? 99;
      const hb = b.absolute_magnitude ?? 99;
      return ha - hb;
    });
}

export async function fetchCuratedForSim(): Promise<SmallBodyForSim[]> {
  return fetchNeoCatalogForSim();
}

export async function fetchBySpkidsForSim(): Promise<SmallBodyForSim[]> {
  return [];
}
export async function fetchByDesignationsForSim(): Promise<SmallBodyForSim[]> {
  return [];
}
