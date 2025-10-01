import React from "react";
import {
  SimulationResults,
  ImpactLocation,
  AsteroidParameters,
} from "../data/simulation";

// Import images using Vite's import syntax
import craterImg from "/simulation/crater.jpg?url";
import fireballImg from "/simulation/fireball.jpg?url";
import pressureImg from "/simulation/pressure.jpg?url";
import windImg from "/simulation/wind.jpg?url";
import earthquakeImg from "/simulation/earthquake.jpg?url";

interface DetailedSimulationResultsProps {
  results: SimulationResults;
  impactLocation: ImpactLocation;
  asteroid: AsteroidParameters;
  onReset: () => void;
}

export default function DetailedSimulationResults({
  results,
  impactLocation,
  asteroid,
  onReset,
}: DetailedSimulationResultsProps) {
  const formatNumber = (value: number): string => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)} billion`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)} million`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)} thousand`;
    }
    return Math.round(value).toLocaleString();
  };

  const formatDistance = (
    meters: number,
    unit: "mile" | "km" = "mile"
  ): string => {
    if (unit === "mile") {
      const miles = meters * 0.000621371;
      return miles < 1
        ? `${(miles * 5280).toFixed(0)} ft`
        : `${miles.toFixed(1)} mile${miles !== 1 ? "s" : ""}`;
    } else {
      return meters < 1000
        ? `${Math.round(meters)} m`
        : `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const formatSpeed = (asteroidSpeed: number): string => {
    // Convert m/s to mph properly
    const mph = asteroidSpeed * 2.237;
    return `${Math.round(mph).toLocaleString()} mph`;
  };

  const formatEnergy = (joules: number): string => {
    const tntEquivalent = joules / 4.184e9; // Convert to tons of TNT
    if (tntEquivalent >= 1e9) {
      return `${(tntEquivalent / 1e9).toFixed(1)} Gigatons of TNT`;
    } else if (tntEquivalent >= 1e6) {
      return `${(tntEquivalent / 1e6).toFixed(1)} Megatons of TNT`;
    } else if (tntEquivalent >= 1e3) {
      return `${(tntEquivalent / 1e3).toFixed(1)} Kilotons of TNT`;
    }
    return `${Math.round(tntEquivalent)} tons of TNT`;
  };

  // Calculate realistic wind speeds based on shock wave
  const getWindSpeed = (shockwaveRadius: number, energy: number): string => {
    // Wind speed decreases with distance, peak speeds near impact
    const windSpeedMps = Math.sqrt(energy / 1e14) * 100; // Simplified calculation
    const windSpeedMph = windSpeedMps * 2.237;
    return `${Math.round(windSpeedMph).toLocaleString()} mph`;
  };

  // Calculate more accurate shock wave pressure
  const getShockWaveDecibels = (energy: number): number => {
    // Sound pressure level calculation based on energy
    const tntEquivalent = energy / 4.184e9; // tons of TNT
    const decibels = 60 + 20 * Math.log10(tntEquivalent); // Simplified
    return Math.min(300, Math.max(120, decibels)); // Realistic range
  };

  const getImpactFrequency = (energy: number): string => {
    const tntEquivalent = energy / 4.184e9;
    if (tntEquivalent >= 1e9) {
      return "several million years";
    } else if (tntEquivalent >= 1e6) {
      return "100,000 - 1 million years";
    } else if (tntEquivalent >= 1e3) {
      return "1,000 - 100,000 years";
    }
    return "100 - 1,000 years";
  };

  // Calculate casualties from damage zones
  const calculateCasualties = () => {
    const casualties = {
      immediate: 0,
      fireball: 0,
      thermal: 0,
      shockwave: 0,
      wind: 0,
      seismic: 0,
    };

    results.damageZones.forEach((zone) => {
      switch (zone.type) {
        case "crater":
          casualties.immediate += zone.casualties;
          break;
        case "fireball":
          casualties.fireball += zone.casualties;
          break;
        case "radiation":
          casualties.thermal += zone.casualties;
          break;
        case "shockwave":
          casualties.shockwave += zone.casualties;
          casualties.wind += zone.casualties * 0.3; // Estimate wind casualties
          break;
        case "seismic":
          casualties.seismic += zone.casualties;
          break;
      }
    });

    return casualties;
  };

  const casualties = calculateCasualties();

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Header */}
      <div className="text-center py-8 bg-black">
        <h2 className="text-4xl font-bold text-white mb-2">Results</h2>
      </div>

      {/* Crater Section */}
      <div className="relative">
        {/* Crater Background Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${craterImg})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Crater Content */}
        <div className="bg-black p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">🌋</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {formatDistance(results.craterDiameter)} wide crater
            </h3>
          </div>
          <div className="space-y-3 text-lg text-gray-300 max-w-4xl">
            <p>
              An estimated{" "}
              <span className="text-red-400 font-semibold">
                {formatNumber(casualties.immediate)}
              </span>{" "}
              people would be vaporized in the crater
            </p>
            <p>
              The crater is{" "}
              <span className="text-orange-400 font-semibold">
                {formatDistance(results.craterDepth)}
              </span>{" "}
              deep
            </p>
            <p>
              Your asteroid impacted the ground at{" "}
              <span className="text-blue-400 font-semibold">
                {formatSpeed(asteroid.speed)}
              </span>
            </p>
            <p>
              The impact is equivalent to{" "}
              <span className="text-yellow-400 font-semibold">
                {formatEnergy(results.impactEnergy)}
              </span>
            </p>
            <p>More energy was released than a hurricane releases in a day</p>
            <p>
              An impact this size happens on average every{" "}
              <span className="text-purple-400 font-semibold">
                {getImpactFrequency(results.impactEnergy)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Fireball Section */}
      <div className="relative">
        {/* Fireball Background Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${fireballImg})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Fireball Content */}
        <div className="bg-black p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔥</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {formatDistance(results.fireballRadius * 2)} wide fireball
            </h3>
          </div>
          <div className="space-y-3 text-lg text-gray-300 max-w-4xl">
            <p>
              An estimated{" "}
              <span className="text-red-400 font-semibold">
                {formatNumber(casualties.fireball)}
              </span>{" "}
              people would die from the fireball
            </p>
            <p>
              An estimated{" "}
              <span className="text-orange-400 font-semibold">
                {formatNumber(casualties.thermal * 0.3)}
              </span>{" "}
              people would receive 3rd degree burns
            </p>
            <p>
              An estimated{" "}
              <span className="text-yellow-400 font-semibold">
                {formatNumber(casualties.thermal * 0.7)}
              </span>{" "}
              people would receive 2nd degree burns
            </p>
            <p>
              Trees would catch on fire within{" "}
              <span className="text-green-400 font-semibold">
                {formatDistance(results.thermalRadius)}
              </span>{" "}
              of the impact
            </p>
          </div>
        </div>
      </div>

      {/* Shock Wave Section */}
      <div className="relative">
        {/* Pressure Background Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${pressureImg})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Shock Wave Content */}
        <div className="bg-black p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">💥</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {Math.round(getShockWaveDecibels(results.impactEnergy))} decibel
              shock wave
            </h3>
          </div>
          <div className="space-y-3 text-lg text-gray-300 max-w-4xl">
            <p>
              An estimated{" "}
              <span className="text-red-400 font-semibold">
                {formatNumber(casualties.shockwave)}
              </span>{" "}
              people would die from the shock wave
            </p>
            <p>
              Anyone within{" "}
              <span className="text-blue-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.4)}
              </span>{" "}
              would likely receive lung damage
            </p>
            <p>
              Anyone within{" "}
              <span className="text-cyan-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.5)}
              </span>{" "}
              would likely have ruptured eardrums
            </p>
            <p>
              Buildings within{" "}
              <span className="text-purple-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.7)}
              </span>{" "}
              would collapse
            </p>
            <p>
              Homes within{" "}
              <span className="text-pink-400 font-semibold">
                {formatDistance(results.shockwaveRadius)}
              </span>{" "}
              would collapse
            </p>
          </div>
        </div>
      </div>

      {/* Wind Blast Section */}
      <div className="relative">
        {/* Wind Background Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${windImg})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Wind Content */}
        <div className="bg-black p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">💨</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {getWindSpeed(results.shockwaveRadius, results.impactEnergy)} peak
              wind speed
            </h3>
          </div>
          <div className="space-y-3 text-lg text-gray-300 max-w-4xl">
            <p>
              An estimated{" "}
              <span className="text-red-400 font-semibold">
                {formatNumber(casualties.wind)}
              </span>{" "}
              people would die from the wind blast
            </p>
            <p>
              Wind within{" "}
              <span className="text-cyan-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.3)}
              </span>{" "}
              would be faster than storms on Jupiter
            </p>
            <p>
              Homes within{" "}
              <span className="text-blue-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.5)}
              </span>{" "}
              would be completely leveled
            </p>
            <p>
              Within{" "}
              <span className="text-purple-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 0.8)}
              </span>{" "}
              it would feel like being inside an EF5 tornado
            </p>
            <p>
              Nearly all trees within{" "}
              <span className="text-green-400 font-semibold">
                {formatDistance(results.shockwaveRadius)}
              </span>{" "}
              would be knocked down
            </p>
          </div>
        </div>
      </div>

      {/* Earthquake Section */}
      <div className="relative">
        {/* Earthquake Background Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${earthquakeImg})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Earthquake Content */}
        <div className="bg-black p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">🌍</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {results.seismicMagnitude.toFixed(1)} magnitude earthquake
            </h3>
          </div>
          <div className="space-y-3 text-lg text-gray-300 max-w-4xl">
            <p>
              An estimated{" "}
              <span className="text-red-400 font-semibold">
                {formatNumber(casualties.seismic)}
              </span>{" "}
              people would die from the earthquake.
            </p>
            <p>
              The earthquake would be felt{" "}
              <span className="text-yellow-400 font-semibold">
                {formatDistance(results.shockwaveRadius * 2)}
              </span>{" "}
              away
            </p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="bg-black p-8">
        <button
          onClick={onReset}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-200 text-xl"
        >
          🔄 Reset Simulation
        </button>
      </div>
    </div>
  );
}
