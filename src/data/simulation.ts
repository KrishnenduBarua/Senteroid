// Simulation types and physics calculations for asteroid impact
import { compareMagnitude, EarthquakeComparison } from "./earthquakes";
export interface AsteroidParameters {
  type: "iron" | "stone" | "comet";
  diameter: number; // in meters
  speed: number; // in m/s
  angle: number; // impact angle in degrees
  density: number; // kg/m³
}

export interface ImpactLocation {
  latitude: number;
  longitude: number;
  populationDensity: number; // people per km²
  cityName?: string;
}

export interface DamageZone {
  type: "crater" | "fireball" | "radiation" | "shockwave" | "seismic";
  radius: number; // in meters
  severity: "total" | "severe" | "moderate" | "light";
  casualties: number;
  description: string;
}

export interface SimulationResults {
  impactEnergy: number; // in joules
  craterDiameter: number; // in meters
  craterDepth: number; // in meters
  fireballRadius: number; // in meters
  thermalRadius: number; // in meters
  shockwaveRadius: number; // in meters
  seismicMagnitude: number;
  damageZones: DamageZone[];
  tntEquivalent: number; // in tons of TNT
  // --- Added new detailed physics outputs ---
  massKg: number; // asteroid mass
  shockwaveRadius50kPa: number; // severe damage radius (≈50 kPa)
  shockwaveRadius20kPa: number; // moderate damage radius (≈20 kPa)
  shockwaveRadius5kPa: number; // light damage radius (≈5 kPa)
  peakWindSpeed50kPa: number; // m/s wind speed at 50 kPa region
  impactSpeed: number; // m/s (copy of asteroid.speed for UI convenience)
  impactAngle: number; // degrees (copy of asteroid.angle)
  earthquakeComparison: EarthquakeComparison; // USGS comparison context
  tsunami?: TsunamiResults | null; // Present if ocean impact
}

// Tsunami result structure
export interface TsunamiResults {
  sourceWaveHeight: number; // m (near impact initial wave amplitude)
  waveHeightAt100km: number; // m propagated deep-water wave height
  potentialRunup: number; // m estimated coastal run-up (very approximate)
  affectedCoastlineRadius: number; // m radius where wave height > 1 m
}

// Very coarse continent bounding boxes for ocean detection (lon in -180..180)
const CONTINENT_BOXES = [
  // name, latMin, latMax, lonMin, lonMax
  [5, 83, -170, -52], // North America (approx including Greenland partial)
  [-56, 13, -82, -35], // South America
  [-35, 37, -20, 52], // Africa
  [35, 72, -10, 180], // Eurasia north (Europe + Asia)
  [5, 35, 25, 150], // Middle East / South Asia band
  [-12, 5, 40, 120], // Equatorial Africa/Middle East overlap guard (treated as land)
  [-45, -10, 110, 155], // Australia
  [-90, -60, -180, 180], // Antarctica
];

function normalizeLon(lon: number): number {
  let L = lon;
  while (L > 180) L -= 360;
  while (L < -180) L += 360;
  return L;
}

export function isLikelyOcean(
  lat: number,
  lon: number,
  cityName?: string
): boolean {
  // Treat real city matches as land; ignore generic placeholders like "Location (.."
  if (cityName && !/^Location \(/.test(cityName)) return false; // if near a known city treat as land
  const L = normalizeLon(lon);
  for (const [latMin, latMax, lonMin, lonMax] of CONTINENT_BOXES) {
    if (lat >= latMin && lat <= latMax && L >= lonMin && L <= lonMax) {
      return false; // inside a land box
    }
  }
  return true; // outside all coarse land boxes → ocean
}

// Simple tsunami scaling (highly simplified):
// 1. Assume fraction f of kinetic energy couples to water displacement (f_water ~ 2e-4 for large impacts)
// 2. Initial cavity radius ~ 0.6 * craterDiameter (transient water cavity ~ crater size)
// 3. Source wave height H0 ~ (f_water * E / (rho_w * g * π R^2))
// 4. Deep water radial decay ~ R^-1 (energy spread) so H(r) ≈ H0 * (R_source / r)
// 5. Run-up roughly 2.5 * deep-water height for steep coastal amplification (very approximate)
// NOTE: These are order-of-magnitude educational estimates only.
const WATER_DENSITY = 1000; // kg/m³
const WATER_COUPLING = 2e-4; // fraction of KE to wave potential energy

export function estimateTsunami(
  impactEnergy: number,
  craterDiameter: number
): TsunamiResults {
  const g = 9.81; // use same gravity constant as ImpactPhysics
  const cavityRadius = 0.6 * (craterDiameter / 2); // m
  const R_source = Math.max(cavityRadius, 50); // avoid tiny values
  const waveEnergy = WATER_COUPLING * impactEnergy; // J
  // Potential energy ~ rho * g * π R^2 * H^2 / 2  (approx) -> solve for H
  const sourceWaveHeight = Math.sqrt(
    (2 * waveEnergy) / (WATER_DENSITY * g * Math.PI * R_source * R_source)
  );
  const distance100km = 100_000; // m
  const waveHeightAt100km = sourceWaveHeight * (R_source / distance100km);
  const potentialRunup = 2.5 * waveHeightAt100km; // amplification factor
  // Affected coastline radius where deep-water wave > 1 m
  const affectedCoastlineRadius = (sourceWaveHeight * R_source) / 1; // solve H(r)=1 → r=H0*R0/1
  return {
    sourceWaveHeight,
    waveHeightAt100km,
    potentialRunup,
    affectedCoastlineRadius,
  };
}

// Asteroid type configurations
export const ASTEROID_TYPES: Record<string, Partial<AsteroidParameters>> = {
  iron: {
    type: "iron",
    density: 7800, // kg/m³
  },
  stone: {
    type: "stone",
    density: 2600, // kg/m³
  },
  comet: {
    type: "comet",
    density: 500, // kg/m³ (ice and rock)
  },
};

// Default asteroid parameters
export const DEFAULT_ASTEROID: AsteroidParameters = {
  type: "iron",
  diameter: 457, // 1500 ft = ~457m
  speed: 17000, // 38,000 mph = ~17,000 m/s
  angle: 45,
  density: ASTEROID_TYPES.iron.density!,
};

// Physics calculations
export class ImpactPhysics {
  private static readonly GRAVITY = 9.81; // m/s²
  private static readonly AIR_DENSITY = 1.225; // kg/m³ at sea level
  /* ===================== Core physics based on requested formulas ===================== */

  // Asteroid mass m = (4/3)π (D/2)^3 ρ
  static calculateMass(diameter: number, density: number): number {
    const r = diameter / 2;
    return (4 / 3) * Math.PI * r * r * r * density;
  }

  // Kinetic energy E = 1/2 m v^2
  static calculateKineticEnergy(mass: number, velocity: number): number {
    return 0.5 * mass * velocity * velocity;
  }

  // Fireball radius: R_f = k * E^0.33  (k calibrated so 1 Mt (~4.184e15 J) ≈ 1.5 km)
  private static readonly FIREBALL_K = 0.00925; // meters / J^(1/3)
  static calculateFireballRadius(energy: number): number {
    return this.FIREBALL_K * Math.pow(energy, 1 / 3);
  }

  // Overpressure model: ΔP = 1.8 * (ρ_air^0.5 * E^(1/3)) / R^(3/2)
  // Invert for R at a chosen ΔP (Pa): R = [ 1.8 * sqrt(ρ_air) * E^(1/3) / ΔP ]^(2/3)
  static radiusAtOverpressure(energy: number, deltaP_kPa: number): number {
    const deltaP = deltaP_kPa * 1000; // kPa -> Pa
    const term =
      (1.8 * Math.sqrt(this.AIR_DENSITY) * Math.pow(energy, 1 / 3)) / deltaP;
    return Math.pow(term, 2 / 3);
  }

  // Peak wind speed at a given overpressure: v = sqrt(2 * ΔP / ρ_air)
  static windSpeedAtOverpressure(deltaP_kPa: number): number {
    const deltaP = deltaP_kPa * 1000; // Pa
    return Math.sqrt((2 * deltaP) / this.AIR_DENSITY); // m/s
  }

  // Crater diameter: Dc = k * ((ρ_i/ρ_t)^(1/3)) * D^0.78 * v^0.44 * g^-0.22
  // We choose k ≈ 1.6 (empirical mid-range). D(m), v(m/s).
  static calculateCraterDiameter(
    projectileDiameter: number,
    impactVelocity: number,
    projectileDensity: number,
    targetDensity = 2600,
    g = ImpactPhysics.GRAVITY
  ): number {
    const k = 1.6;
    const densityRatio = Math.pow(projectileDensity / targetDensity, 1 / 3);
    return (
      k *
      densityRatio *
      Math.pow(projectileDiameter, 0.78) *
      Math.pow(impactVelocity, 0.44) *
      Math.pow(g, -0.22)
    );
  }

  // Depth: dc = 0.2 * Dc
  static calculateCraterDepth(craterDiameter: number): number {
    return 0.2 * craterDiameter;
  }

  // Seismic magnitude: M = (2/3) * log10(η * E) - 3.2  (η in [1e-4, 1e-3])
  static calculateSeismicMagnitude(energy: number, efficiency = 5e-4): number {
    return (2 / 3) * Math.log10(efficiency * energy) - 3.2;
  }

  // TNT equivalent (tons). 1 ton TNT = 4.184e9 J
  static calculateTNTEquivalent(energy: number): number {
    return energy / 4.184e9; // tons of TNT
  }

  // Convenience kilotons (not stored but useful)
  static calculateTNTKilotons(energy: number): number {
    return energy / 4.184e12; // kilotons
  }

  // Estimate casualties based on population density and damage zones
  static estimateCasualties(
    populationDensity: number,
    damageZones: Omit<DamageZone, "casualties">[]
  ): DamageZone[] {
    return damageZones.map((zone) => {
      const area = Math.PI * Math.pow(zone.radius / 1000, 2); // km²
      const population = populationDensity * area;

      let mortalityRate = 0;
      switch (zone.severity) {
        case "total":
          mortalityRate = 0.95;
          break;
        case "severe":
          mortalityRate = 0.75;
          break;
        case "moderate":
          mortalityRate = 0.25;
          break;
        case "light":
          mortalityRate = 0.05;
          break;
      }

      return {
        ...zone,
        casualties: Math.round(population * mortalityRate),
      };
    });
  }
  // Main simulation function
  static runSimulation(
    asteroid: AsteroidParameters,
    location: ImpactLocation
  ): SimulationResults {
    // Core energies & mass
    const mass = this.calculateMass(asteroid.diameter, asteroid.density);
    const energy = this.calculateKineticEnergy(mass, asteroid.speed);

    // Fireball
    const fireballRadius = this.calculateFireballRadius(energy);

    // Shockwave radii at chosen overpressure thresholds (kPa)
    const overpressureSevere = 50; // heavy structural damage
    const overpressureModerate = 20; // typical window / wall failure
    const overpressureLight = 5; // light damage

    const shockwaveRadiusModerate = this.radiusAtOverpressure(
      energy,
      overpressureModerate
    );
    // We retain a single shockwaveRadius field (use moderate threshold for legacy UI)
    const shockwaveRadius = shockwaveRadiusModerate;

    // Thermal radius (legacy) – approximate as 1.2 * fireball
    const thermalRadius = fireballRadius * 1.2;

    // Crater geometry based on projectile parameters
    const craterDiameter = this.calculateCraterDiameter(
      asteroid.diameter,
      asteroid.speed,
      asteroid.density
    );
    const craterDepth = this.calculateCraterDepth(craterDiameter);

    // Seismic magnitude with mid efficiency
    const seismicMagnitude = this.calculateSeismicMagnitude(energy, 5e-4);
    const earthquakeComparison = compareMagnitude(seismicMagnitude);

    // Tsunami (only if likely ocean impact)
    let tsunami: TsunamiResults | null = null;
    if (
      isLikelyOcean(location.latitude, location.longitude, location.cityName)
    ) {
      tsunami = estimateTsunami(energy, craterDiameter);
    }

    // TNT equivalent (tons)
    const tntEquivalent = this.calculateTNTEquivalent(energy);

    // Overpressure radii set
    const shockwaveRadius50kPa = this.radiusAtOverpressure(
      energy,
      overpressureSevere
    );
    const shockwaveRadius20kPa = shockwaveRadiusModerate;
    const shockwaveRadius5kPa = this.radiusAtOverpressure(
      energy,
      overpressureLight
    );
    const peakWindSpeed50kPa = this.windSpeedAtOverpressure(overpressureSevere); // m/s

    // Define damage zones
    const damageZones = this.estimateCasualties(location.populationDensity, [
      {
        type: "crater",
        radius: craterDiameter / 2,
        severity: "total",
        description: "Complete annihilation - vaporized",
      },
      {
        type: "fireball",
        radius: fireballRadius,
        severity: "total",
        description: "Fireball - everything incinerated",
      },
      {
        type: "radiation",
        radius: thermalRadius,
        severity: "severe",
        description: "Thermal burns / intense radiant heat",
      },
      {
        type: "shockwave",
        radius: shockwaveRadius,
        severity: "moderate",
        description: "Shockwave overpressure structural damage (~20 kPa)",
      },
      {
        type: "seismic",
        radius: shockwaveRadius * 2,
        severity: "light",
        description: "Seismic damage - windows broken, minor structural damage",
      },
    ]);

    return {
      impactEnergy: energy,
      craterDiameter,
      craterDepth,
      fireballRadius,
      thermalRadius,
      shockwaveRadius,
      seismicMagnitude,
      damageZones,
      tntEquivalent,
      massKg: mass,
      shockwaveRadius50kPa,
      shockwaveRadius20kPa,
      shockwaveRadius5kPa,
      peakWindSpeed50kPa,
      impactSpeed: asteroid.speed,
      impactAngle: asteroid.angle,
      earthquakeComparison,
      tsunami,
    };
  }
}

// Population density data for major cities (people per km²)
export const CITY_POPULATION_DENSITY: Record<string, number> = {
  "New York": 10947,
  London: 5701,
  Tokyo: 6224,
  Paris: 20169,
  Mumbai: 20482,
  Delhi: 11297,
  Beijing: 1311,
  "Los Angeles": 3198,
  "São Paulo": 7899,
  "Mexico City": 6000,
  Cairo: 19376,
  Lagos: 13211,
  Manila: 15300,
  Dhaka: 23234,
  Jakarta: 15342,
  Karachi: 24000,
  Istanbul: 2987,
  Moscow: 4875,
  "Buenos Aires": 14308,
  Sydney: 433,
  "Default Rural": 50,
  "Default Urban": 3000,
  "Default Suburban": 1000,
};

// Get population density for a location
export function getPopulationDensity(
  lat: number,
  lon: number
): { density: number; cityName?: string } {
  // This is a simplified version - in a real app you'd use a geographic database
  // For now, we'll use some heuristics based on coordinates

  // Major city coordinates (simplified)
  const cities = [
    {
      name: "New York",
      lat: 40.7128,
      lon: -74.006,
      density: CITY_POPULATION_DENSITY["New York"],
    },
    {
      name: "London",
      lat: 51.5074,
      lon: -0.1278,
      density: CITY_POPULATION_DENSITY["London"],
    },
    {
      name: "Tokyo",
      lat: 35.6762,
      lon: 139.6503,
      density: CITY_POPULATION_DENSITY["Tokyo"],
    },
    {
      name: "Paris",
      lat: 48.8566,
      lon: 2.3522,
      density: CITY_POPULATION_DENSITY["Paris"],
    },
    {
      name: "Sydney",
      lat: -33.8688,
      lon: 151.2093,
      density: CITY_POPULATION_DENSITY["Sydney"],
    },
  ];

  // Find closest city within 100km
  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow((lat - city.lat) * 111, 2) +
        Math.pow((lon - city.lon) * 111 * Math.cos((lat * Math.PI) / 180), 2)
    );

    if (distance < 100) {
      // Within 100km
      return { density: city.density, cityName: city.name };
    }
  }

  // Default density based on latitude (rough population distribution)
  if (Math.abs(lat) < 30) {
    return { density: CITY_POPULATION_DENSITY["Default Urban"] }; // Tropical/temperate regions
  } else if (Math.abs(lat) < 60) {
    return { density: CITY_POPULATION_DENSITY["Default Suburban"] }; // Temperate regions
  } else {
    return { density: CITY_POPULATION_DENSITY["Default Rural"] }; // Polar regions
  }
}
