import React from "react";
import {
  AsteroidParameters,
  ASTEROID_TYPES,
  DEFAULT_ASTEROID,
} from "../data/simulation";

interface AsteroidControlsProps {
  asteroid: AsteroidParameters;
  onAsteroidChange: (asteroid: AsteroidParameters) => void;
  disabled?: boolean;
}

export default function AsteroidControls({
  asteroid,
  onAsteroidChange,
  disabled = false,
}: AsteroidControlsProps) {
  const updateAsteroid = (updates: Partial<AsteroidParameters>) => {
    const updatedAsteroid = { ...asteroid, ...updates };
    // Update density when type changes
    if (updates.type && ASTEROID_TYPES[updates.type].density) {
      updatedAsteroid.density = ASTEROID_TYPES[updates.type].density!;
    }
    onAsteroidChange(updatedAsteroid);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat().format(Math.round(value));
  };

  const diameterInFeet = Math.round(asteroid.diameter * 3.28084);
  const speedInMph = Math.round(asteroid.speed * 2.237);

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-300 mb-2">
          🚀 ASTEROID LAUNCHER
        </h2>
        <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
      </div>

      {/* Asteroid Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Asteroid Type
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateAsteroid({ type: "stone" })}
            disabled={disabled}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition disabled:opacity-50"
            title="Previous type"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-white capitalize">
              {asteroid.type} Asteroid
            </div>
            <div className="text-sm text-slate-400">
              Density: {formatNumber(asteroid.density)} kg/m³
            </div>
          </div>

          <button
            onClick={() => updateAsteroid({ type: "comet" })}
            disabled={disabled}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition disabled:opacity-50"
            title="Next type"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Diameter Control */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
          <span className="inline-flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="6"
                y1="10"
                x2="14"
                y2="10"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            Diameter
          </span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={asteroid.diameter}
            onChange={(e) =>
              updateAsteroid({ diameter: Number(e.target.value) })
            }
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-center text-white font-bold">
            {formatNumber(diameterInFeet)} ft
            <span className="text-slate-400 text-sm ml-2">
              ({asteroid.diameter}m)
            </span>
          </div>
        </div>
      </div>

      {/* Speed Control */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
          <span className="inline-flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Speed
          </span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="5000"
            max="30000"
            step="500"
            value={asteroid.speed}
            onChange={(e) => updateAsteroid({ speed: Number(e.target.value) })}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-center text-white font-bold">
            {formatNumber(speedInMph)} mph
            <span className="text-slate-400 text-sm ml-2">
              ({formatNumber(asteroid.speed)} m/s)
            </span>
          </div>
        </div>
      </div>

      {/* Impact Angle Control */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
          <span className="inline-flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7l10 10M7 17L17 7"
              />
            </svg>
            Impact Angle
          </span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="15"
            max="90"
            step="5"
            value={asteroid.angle}
            onChange={(e) => updateAsteroid({ angle: Number(e.target.value) })}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-center text-white font-bold">
            {asteroid.angle}°
          </div>
        </div>
      </div>

      {/* Launch Instructions */}
      <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-400/30">
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-1">
            Choose Impact Location
          </div>
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium">TAP IMPACT LOCATION</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              onAsteroidChange({
                type: "stone",
                diameter: 100,
                speed: 15000,
                angle: 45,
                density: ASTEROID_TYPES.stone.density!,
              })
            }
            disabled={disabled}
            className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition disabled:opacity-50 text-slate-200"
          >
            Small Impact
          </button>
          <button
            onClick={() => onAsteroidChange(DEFAULT_ASTEROID)}
            disabled={disabled}
            className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition disabled:opacity-50 text-slate-200"
          >
            Default
          </button>
          <button
            onClick={() =>
              onAsteroidChange({
                type: "iron",
                diameter: 800,
                speed: 25000,
                angle: 60,
                density: ASTEROID_TYPES.iron.density!,
              })
            }
            disabled={disabled}
            className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition disabled:opacity-50 text-slate-200"
          >
            Devastating
          </button>
          <button
            onClick={() =>
              onAsteroidChange({
                type: "iron",
                diameter: 1000,
                speed: 30000,
                angle: 90,
                density: ASTEROID_TYPES.iron.density!,
              })
            }
            disabled={disabled}
            className="px-3 py-2 text-xs bg-red-800/50 hover:bg-red-700/50 rounded-lg transition disabled:opacity-50 text-red-200"
          >
            Extinction
          </button>
        </div>
      </div>
    </div>
  );
}
