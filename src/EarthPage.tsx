import React from "react";
import CesiumGlobe from "./components/CesiumGlobe";
import { fetchNEOs } from "./data/nasa";
import { fetchScaledNASACometOrbits } from "./space/nasaComets";
import type { OrbitParams } from "./space/neoOrbits";
import type { NeoLite } from "./data/types";
import AsteroidViewer from "./components/AsteroidViewer";

// Previous HomePage content moved here under /earth
export default function EarthPage() {
  const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
  }) => (
    <div className="text-xs text-slate-300 flex justify-between border-b border-slate-700/40 last:border-none pb-1 last:pb-0">
      <span className="pr-2 text-slate-400">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );

  const [neos, setNeos] = React.useState<NeoLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedAsteroid, setSelectedAsteroid] =
    React.useState<NeoLite | null>(null);

  const [scaledComets, setScaledComets] = React.useState<OrbitParams[] | null>(
    null
  );
  const [cometLoading, setCometLoading] = React.useState(true);
  const [cometError, setCometError] = React.useState<string | null>(null);
  const [selectedCometIndex, setSelectedCometIndex] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    fetchNEOs()
      .then((data) => {
        setNeos(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch NEOs");
        setLoading(false);
      });
  }, []);

  // Load comet orbits immediately (single mode now)
  React.useEffect(() => {
    fetchScaledNASACometOrbits()
      .then((data) => {
        setScaledComets(data);
        setCometLoading(false);
      })
      .catch((e) => {
        console.warn(e);
        setCometError("Failed to load comet orbits");
        setCometLoading(false);
      });
  }, []);

  // Selection callbacks from globe entity picking
  const handleSelectAsteroid = React.useCallback(
    (neo: NeoLite, _index: number) => {
      setSelectedCometIndex(null);
      setSelectedAsteroid(neo);
    },
    []
  );
  const handleSelectComet = React.useCallback(
    (_orbit: OrbitParams, index: number) => {
      setSelectedAsteroid(null);
      setSelectedCometIndex(index);
    },
    []
  );

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      <CesiumGlobe
        neos={neos}
        mode="nasa-scaled"
        scaledCometOrbits={scaledComets}
        onSelectAsteroid={handleSelectAsteroid}
        onSelectComet={handleSelectComet}
      />

      {/* Loading indicators */}
      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium tracking-wide space-x-4 flex">
        {loading && <span>Loading asteroids…</span>}
        {cometLoading && <span>Loading comets…</span>}
      </div>

      {/* Detail Modal (shifted down below navbar + higher z-index) */}
      {(selectedAsteroid || selectedCometIndex != null) && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-[100] flex items-start justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-slate-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-slate-700/70 overflow-y-auto max-h-[calc(100vh-5rem)] pointer-events-auto">
            <button
              className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-red-400"
              onClick={() => {
                setSelectedAsteroid(null);
                setSelectedCometIndex(null);
              }}
              aria-label="Close"
            >
              ×
            </button>

            {selectedAsteroid && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  Asteroid Details: {selectedAsteroid.name}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-800/60 rounded p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-indigo-300 tracking-wide">
                      Physical
                    </h3>
                    <div className="text-xs text-slate-300 flex justify-between">
                      <span>Estimated Diameter</span>
                      <span>{selectedAsteroid.diameter_m.toFixed(1)} m</span>
                    </div>
                    <div className="text-xs text-slate-300 flex justify-between">
                      <span>Velocity</span>
                      <span>
                        {selectedAsteroid.velocity_kms.toFixed(2)} km/s
                      </span>
                    </div>
                    {selectedAsteroid.est_miss_km && (
                      <div className="text-xs text-slate-300 flex justify-between">
                        <span>Est. Miss Dist.</span>
                        <span>
                          {selectedAsteroid.est_miss_km.toLocaleString()} km
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800/60 rounded p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
                      Encounter
                    </h3>
                    <div className="text-xs text-slate-300 flex justify-between">
                      <span>Close Approach Date</span>
                      <span>{selectedAsteroid.approach_date}</span>
                    </div>
                    <div className="text-xs text-slate-300 flex justify-between">
                      <span>Orbiting Body</span>
                      <span>{selectedAsteroid.close_approach || "—"}</span>
                    </div>
                  </div>
                </div>

                {selectedAsteroid.model && (
                  <div className="bg-slate-800/60 rounded p-3">
                    <h3 className="text-sm font-semibold text-fuchsia-300 mb-2 tracking-wide">
                      3D Model Preview
                    </h3>
                    <div className="w-full aspect-square max-w-sm mx-auto">
                      <AsteroidViewer modelPath={selectedAsteroid.model} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedCometIndex != null &&
              scaledComets &&
              scaledComets[selectedCometIndex] && (
                <div className="space-y-4">
                  {selectedAsteroid && <div className="h-px bg-slate-700" />}
                  <h2 className="text-lg font-semibold text-white">
                    Comet Details: {scaledComets[selectedCometIndex].name}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-slate-800/60 rounded p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-indigo-300 tracking-wide">
                        Orbital (Scaled)
                      </h3>
                      <DetailRow
                        label="Semi-Major Axis"
                        value={
                          scaledComets[selectedCometIndex].a_km.toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 }
                          ) + " km"
                        }
                      />
                      <DetailRow
                        label="Eccentricity"
                        value={scaledComets[selectedCometIndex].e.toFixed(3)}
                      />
                      <DetailRow
                        label="Inclination"
                        value={
                          (
                            (scaledComets[selectedCometIndex].i_rad * 180) /
                            Math.PI
                          ).toFixed(2) + "°"
                        }
                      />
                    </div>
                    <div className="bg-slate-800/60 rounded p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
                        Key Epochs
                      </h3>
                      {scaledComets[selectedCometIndex].perihelionDate && (
                        <DetailRow
                          label="Perihelion Date"
                          value={
                            scaledComets[selectedCometIndex].perihelionDate!
                          }
                        />
                      )}
                      <DetailRow
                        label="Epoch (relative)"
                        value={
                          scaledComets[selectedCometIndex].epoch
                            .toString()
                            .slice(0, 25) + "…"
                        }
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Orbit distances are visually compressed into a local band
                    (not heliocentric scale) so Earth and all five selected
                    comets remain in view simultaneously.
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
