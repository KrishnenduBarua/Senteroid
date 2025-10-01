import React, { useState } from "react";
import NeoSelector from "./components/NeoSelector";
import BingMap2D from "./components/BingMap2D";
import SimulationResultsPanel from "./components/SimulationResults";
import {
  AsteroidParameters,
  ImpactLocation,
  SimulationResults,
  ImpactPhysics,
} from "./data/simulation";

export default function SimulationPage() {
  // Asteroid is ONLY sourced from SBDB selection now
  const [asteroid, setAsteroid] = useState<AsteroidParameters | null>(null);
  const [selectedNeoId, setSelectedNeoId] = useState<string | null>(null);
  const [selectedNeoName, setSelectedNeoName] = useState<string | null>(null);
  const [impactLocation, setImpactLocation] = useState<ImpactLocation | null>(
    null
  );
  const [simulationResults, setSimulationResults] =
    useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleLocationSelect = (location: ImpactLocation) => {
    setImpactLocation(location);
    setSimulationResults(null); // Clear previous results when location changes
  };

  const handleLaunchSimulation = () => {
    if (!impactLocation || !asteroid || isSimulating) return;

    setIsSimulating(true);
    setSimulationResults(null);

    // Add a small delay to show the simulation is processing
    setTimeout(() => {
      const results = ImpactPhysics.runSimulation(asteroid, impactLocation);
      setSimulationResults(results);
      setIsSimulating(false);
    }, 1000);
  };

  const handleReset = () => {
    setImpactLocation(null);
    setSimulationResults(null);
    setIsSimulating(false);
  };

  const handleNewSimulation = () => {
    setSimulationResults(null);
    setImpactLocation(null);
    // Clear everything to start fresh with parameter setting
  };

  const handleNeoSelect = (realAsteroid: AsteroidParameters, meta: any) => {
    setAsteroid(realAsteroid);
    setSelectedNeoId(meta.id);
    setSelectedNeoName(meta.name);
    // Clear previous results if user picks a new NEO
    setSimulationResults(null);
  };

  // Prepare damage zones for visualization
  const damageZones = simulationResults
    ? [
        {
          radius: simulationResults.craterDiameter / 2,
          type: "crater" as const,
          damage: 100,
        },
        {
          radius: simulationResults.fireballRadius,
          type: "fireball" as const,
          damage: 90,
        },
        {
          radius: simulationResults.shockwaveRadius,
          type: "shockwave" as const,
          damage: 70,
        },
      ]
    : [];

  return (
    <div className="h-full w-full bg-black flex overflow-hidden">
      {/* Map Section */}
      <div className="relative flex-1 h-full">
        <BingMap2D
          onLocationSelect={handleLocationSelect}
          impactLocation={impactLocation}
          damageZones={damageZones}
        />
        {/* Launch Button */}
        {impactLocation && asteroid && !simulationResults && !isSimulating && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[600]">
            <button
              onClick={handleLaunchSimulation}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg border border-red-500 transition-all duration-200 transform hover:scale-105"
            >
              🚀 LAUNCH ASTEROID!
            </button>
          </div>
        )}
        {/* Simulating Overlay */}
        {isSimulating && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[650]">
            <div className="bg-slate-900/90 rounded-xl p-8 text-center border border-blue-400/30 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <div className="text-white text-lg font-semibold">
                Calculating Impact...
              </div>
              <div className="text-slate-400 text-sm mt-2">
                Physics simulation in progress
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <div className="h-full w-[340px] lg:w-[360px] xl:w-[380px] bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-black/85 backdrop-blur-sm border-l border-slate-700/40 flex flex-col z-[700] relative pt-20">
        {simulationResults && impactLocation ? (
          <div className="flex-1 overflow-y-auto p-4">
            <SimulationResultsPanel
              results={simulationResults}
              impactLocation={impactLocation}
              onReset={handleReset}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 pb-10 space-y-4">
            <NeoSelector
              onSelect={handleNeoSelect}
              selectedId={selectedNeoId}
            />
            {selectedNeoName && (
              <div className="text-xs text-blue-300 font-medium tracking-wide">
                Selected Real NEO:{" "}
                <span className="text-white">{selectedNeoName}</span>
              </div>
            )}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/40 text-xs space-y-2">
              <h3 className="text-blue-300 font-semibold tracking-wide text-sm">
                HOW TO RUN A SIMULATION
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Select a real NEO from the catalog above (required)</li>
                <li>Click on the map to choose an impact location</li>
                <li>Press LAUNCH to compute impact effects</li>
              </ol>
              {!asteroid && (
                <div className="text-red-400 pt-1">
                  Select a NEO to enable launch.
                </div>
              )}
              {asteroid && !impactLocation && (
                <div className="text-yellow-400 pt-1">
                  Click the map to set an impact point.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay message */}
      <div className="md:hidden absolute inset-0 bg-black flex items-center justify-center p-4 z-[800]">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-2">Desktop Required</h2>
          <p className="text-slate-300">
            The simulator requires a larger screen for the interactive map.
          </p>
        </div>
      </div>
    </div>
  );
}
