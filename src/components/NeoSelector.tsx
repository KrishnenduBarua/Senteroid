import React, { useEffect, useState } from "react";
import {
  fetchCuratedSmallBodies,
  smallBodyToAsteroidParams,
  SmallBodyNormalized,
} from "../data/sbdb";
import { AsteroidParameters } from "../data/simulation";

interface NeoSelectorProps {
  onSelect: (asteroid: AsteroidParameters, meta: SmallBodyNormalized) => void;
  selectedId?: string | null;
}

export default function NeoSelector({
  onSelect,
  selectedId,
}: NeoSelectorProps) {
  const [neos, setNeos] = useState<SmallBodyNormalized[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCuratedSmallBodies()
      .then((data) => {
        if (mounted) setNeos(data);
      })
      .catch((e) => {
        console.warn(e);
        if (mounted) setError("Failed to load NEO list");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl p-4 mb-6 border border-blue-500/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wide">
          Real NEO Catalog
        </h3>
        {loading && (
          <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
        )}
      </div>
      {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scroll">
        {neos.map((neo) => {
          const selected = neo.id === selectedId;
          return (
            <div
              key={neo.id}
              className={`p-3 rounded-lg border transition cursor-pointer group ${
                selected
                  ? "border-blue-400 bg-blue-600/20"
                  : "border-slate-600/40 bg-slate-800/40 hover:border-blue-400/60"
              }`}
              onClick={() => onSelect(smallBodyToAsteroidParams(neo), neo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {neo.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    D ~ {(neo.diameter_m / 1000).toFixed(2)} km • ρ{" "}
                    {neo.density_kg_m3.toLocaleString()} kg/m³
                  </div>
                </div>
                <button
                  className={`text-xs px-2 py-1 rounded bg-blue-600/70 hover:bg-blue-600 text-white ml-2 ${
                    selected ? "ring-2 ring-blue-400" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(smallBodyToAsteroidParams(neo), neo);
                  }}
                >
                  {selected ? "Selected" : "Use"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-slate-300">
                <div>
                  <span className="text-slate-500">a:</span>{" "}
                  {neo.semi_major_axis_AU?.toFixed(2) ?? "—"} AU
                </div>
                <div>
                  <span className="text-slate-500">e:</span>{" "}
                  {neo.eccentricity?.toFixed(2) ?? "—"}
                </div>
                <div>
                  <span className="text-slate-500">i:</span>{" "}
                  {neo.inclination_deg?.toFixed(1) ?? "—"}°
                </div>
              </div>
            </div>
          );
        })}
        {!loading && neos.length === 0 && !error && (
          <div className="text-xs text-slate-400">No NEOs available.</div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        Selecting a real NEO seeds the simulator with its diameter & estimated
        density from spectral type. Impact speed & angle are randomized within
        typical ranges (12–30 km/s, 10–80°). You can still fine‑tune after
        selection.
      </p>
    </div>
  );
}
