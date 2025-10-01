import { JulianDate, Cartesian3, Math as CesiumMath } from "cesium";
import type { NeoLite } from "../data/types";

// Earth gravitational parameter (km^3/s^2)
const MU_EARTH = 398600.4418;

export interface OrbitParams {
  a_km: number; // semi-major axis
  e: number; // eccentricity
  i_rad: number; // inclination
  omega_rad: number; // longitude of ascending node
  w_rad: number; // argument of periapsis
  M0_rad: number; // mean anomaly at epoch
  epoch: JulianDate; // epoch
  // Optional metadata (used for real comet lists)
  name?: string;
  perihelionDate?: string; // ISO date string for UI listing
}

export interface NeoOrbitRuntime extends OrbitParams {
  id: string;
  color: string;
}

// Generate deterministic pseudo-random but stable parameters per NEO id.
export function generateOrbitParams(
  neo: NeoLite,
  index: number,
  now: JulianDate
): OrbitParams {
  const seed = hashString(neo.id) + index * 9973;
  const rand = mulberry32(seed);
  // Spread orbits farther: between 120,000 km and 750,000 km (well outside synchronous orbit, still < ~2 * Earth-Moon distance)
  // Use a bias so more orbits appear further out (reduce clustering near Earth)
  const MIN_A = 120_000;
  const MAX_A = 750_000;
  const biased = Math.pow(rand(), 0.55); // pushes distribution outward
  const a_km = MIN_A + biased * (MAX_A - MIN_A);
  // Increase eccentricity range for visibly non-circular ellipses
  const e = 0.15 + rand() * 0.5; // 0.15 – 0.65
  // Wider inclination variety
  const i_rad = CesiumMath.toRadians(rand() * 70); // up to 70 deg
  const omega_rad = CesiumMath.toRadians(rand() * 360);
  const w_rad = CesiumMath.toRadians(rand() * 360);
  const M0_rad = CesiumMath.toRadians(rand() * 360);
  return { a_km, e, i_rad, omega_rad, w_rad, M0_rad, epoch: now };
}

// Propagate orbit and return Earth-centered Cartesian3 (meters)
export function propagateOrbit(p: OrbitParams, time: JulianDate): Cartesian3 {
  const dt = JulianDate.secondsDifference(time, p.epoch); // seconds
  const a = p.a_km;
  const n = Math.sqrt(MU_EARTH / (a * a * a)); // rad/s
  const M = normalizeAngle(p.M0_rad + n * dt);
  const E = solveKepler(M, p.e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const r = a * (1 - p.e * cosE); // km
  // True anomaly
  const cosNu = (cosE - p.e) / (1 - p.e * cosE);
  const sinNu = (Math.sqrt(1 - p.e * p.e) * sinE) / (1 - p.e * cosE);
  const nu = Math.atan2(sinNu, cosNu);
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  // Rotation sequence: Ω (Z), i (X), ω (Z)
  const cosO = Math.cos(p.omega_rad);
  const sinO = Math.sin(p.omega_rad);
  const cosI = Math.cos(p.i_rad);
  const sinI = Math.sin(p.i_rad);
  const cosw = Math.cos(p.w_rad);
  const sinw = Math.sin(p.w_rad);
  // Precompute rotation of argument of periapsis
  const x1 = xOrb * cosw - yOrb * sinw;
  const y1 = xOrb * sinw + yOrb * cosw;
  // Inclination
  const x2 = x1;
  const y2 = y1 * cosI;
  const z2 = y1 * sinI;
  // Longitude of ascending node
  const x = x2 * cosO - y2 * sinO;
  const y = x2 * sinO + y2 * cosO;
  const z = z2;
  // Return in meters
  return new Cartesian3(x * 1000, y * 1000, z * 1000);
}

export function sampleOrbitPolyline(
  p: OrbitParams,
  segments = 256
): Cartesian3[] {
  const pts: Cartesian3[] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const M = 2 * Math.PI * f;
    const E = solveKepler(M, p.e);
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const r = p.a_km * (1 - p.e * cosE);
    const cosNu = (cosE - p.e) / (1 - p.e * cosE);
    const sinNu = (Math.sqrt(1 - p.e * p.e) * sinE) / (1 - p.e * cosE);
    const nu = Math.atan2(sinNu, cosNu);
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);
    const cosO = Math.cos(p.omega_rad);
    const sinO = Math.sin(p.omega_rad);
    const cosI = Math.cos(p.i_rad);
    const sinI = Math.sin(p.i_rad);
    const cosw = Math.cos(p.w_rad);
    const sinw = Math.sin(p.w_rad);
    const x1 = xOrb * cosw - yOrb * sinw;
    const y1 = xOrb * sinw + yOrb * cosw;
    const x2 = x1;
    const y2 = y1 * cosI;
    const z2 = y1 * sinI;
    const x = x2 * cosO - y2 * sinO;
    const y = x2 * sinO + y2 * cosO;
    const z = z2;
    pts.push(new Cartesian3(x * 1000, y * 1000, z * 1000));
  }
  return pts;
}

// Utilities
function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    E = E - f / fp;
  }
  return E;
}
function normalizeAngle(a: number): number {
  a = a % (2 * Math.PI);
  return a < 0 ? a + 2 * Math.PI : a;
}
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickColor(index: number): string {
  const palette = [
    "#60a5fa",
    "#f87171",
    "#34d399",
    "#fbbf24",
    "#a78bfa",
    "#fb7185",
    "#4ade80",
  ];
  return palette[index % palette.length];
}
