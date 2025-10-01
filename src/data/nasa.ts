// src/data/nasa.ts
import type { NeoLite } from "./types";

// Cast import.meta to any to avoid TS env typing complaints in some configs
const API_KEY = (import.meta as any).env?.VITE_NASA_API_KEY || "DEMO_KEY";

export async function fetchNEOs(limit = 10): Promise<NeoLite[]> {
  try {
    const url = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NASA NeoWs ${res.status}`);
    const json = await res.json();
    const objects: any[] = json?.near_earth_objects || [];
    const modelFiles = [
      "asteroid.glb",
      "osiris_rex_asteroid_bennu_3d_model.glb",
      "Alinda.glb",
    ];
    const enriched = objects.map((o, i) => {
      const diam = o.estimated_diameter?.meters;
      const est =
        (diam?.estimated_diameter_min + diam?.estimated_diameter_max) / 2;
      const ca = (o.close_approach_data || [])[0] || {};
      const relv = Number(ca?.relative_velocity?.kilometers_per_second) || NaN;
      const miss = Number(ca?.miss_distance?.kilometers) || undefined;
      return {
        id: String(o.id),
        name: o.name,
        diameter_m: Number.isFinite(est) ? est : 100,
        velocity_kms: Number.isFinite(relv) ? relv : 15,
        approach_date: ca?.close_approach_date || "—",
        close_approach: ca?.orbiting_body || "—",
        est_miss_km: miss,
        model: i < 3 ? modelFiles[i] : "asteroid.glb",
      } as NeoLite;
    });
    const upcoming = enriched
      .filter((n) => /\d{4}-\d{2}-\d{2}/.test(n.approach_date))
      .sort(
        (a, b) =>
          new Date(a.approach_date).getTime() -
          new Date(b.approach_date).getTime()
      )
      .slice(0, limit);
    return upcoming;
  } catch (e) {
    console.warn("NEO fetch failed, using fallback", e);
    return [];
  }
}
