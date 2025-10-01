export type Orbit = { a_AU: number; e: number; i_deg: number };
export type NeoLite = {
  id: string;
  name: string;
  diameter_m: number;
  velocity_kms: number;
  approach_date: string;
  orbit?: Orbit;
  close_approach?: string;
  est_miss_km?: number;
  impactLat?: number;
  impactLon?: number;
  model: string; // 3D Model path
};

export const FALLBACK_NEOS: NeoLite[] = [
  {
    id: "2025-AX12",
    name: "2025 AX12",
    diameter_m: 120,
    velocity_kms: 18,
    approach_date: "2025-10-03",
    model: "asteroid.glb",
  },
  {
    id: "1999-RQ36",
    name: "Bennu-like",
    diameter_m: 490,
    velocity_kms: 12.7,
    approach_date: "2026-02-11",
    model: "osiris_rex_asteroid_bennu_3d_model.glb",
  },
  {
    id: "2024-CP5",
    name: "2024 CP5",
    diameter_m: 45,
    velocity_kms: 20.5,
    approach_date: "2025-12-20",
    model: "Alinda.glb",
  },
];
