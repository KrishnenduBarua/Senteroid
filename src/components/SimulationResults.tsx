import React from "react";
import { SimulationResults } from "../data/simulation";

interface SimulationResultsProps {
  results: SimulationResults | null;
  impactLocation: {
    latitude: number;
    longitude: number;
    cityName?: string;
  } | null;
  onReset: () => void;
}

export default function SimulationResultsPanel({
  results,
  impactLocation,
  onReset,
}: SimulationResultsProps) {
  if (!results || !impactLocation) {
    return null;
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const formatSpeed = (mps: number) => `${(mps / 1000).toFixed(2)} km/s`;
  const formatWind = (mps: number) => `${(mps * 3.6).toFixed(0)} km/h`;
  const formatTnt = (tons: number) => {
    if (tons >= 1e9) return `${(tons / 1e9).toFixed(2)} Gt`;
    if (tons >= 1e6) return `${(tons / 1e6).toFixed(2)} Mt`;
    if (tons >= 1e3) return `${(tons / 1e3).toFixed(2)} kt`;
    return `${Math.round(tons)} t`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur rounded-xl p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header */}
      <div className="text-center border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-red-400 mb-2">
          💥 IMPACT RESULTS
        </h2>
        <div className="text-sm text-slate-300">
          Location: {impactLocation.latitude.toFixed(4)}°,{" "}
          {impactLocation.longitude.toFixed(4)}°
          {impactLocation.cityName && (
            <span className="text-blue-300 ml-2">
              Near {impactLocation.cityName}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition"
        >
          🔄 Run New Simulation
        </button>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Mass"
          value={`${results.massKg.toExponential(2)} kg`}
          color="emerald"
        />
        <MetricCard
          label="Impact Speed"
          value={formatSpeed(results.impactSpeed)}
          color="blue"
        />
        <MetricCard
          label="Energy (J)"
          value={results.impactEnergy.toExponential(2)}
          color="rose"
        />
        <MetricCard
          label="TNT Equivalent"
          value={formatTnt(results.tntEquivalent)}
          color="purple"
        />
        <MetricCard
          label="Seismic Magnitude"
          value={results.seismicMagnitude.toFixed(1)}
          color="yellow"
        />
        <MetricCard
          label="Quake Class"
          value={results.earthquakeComparison.classification}
          color="amber"
        />
      </div>

      {/* Spatial Effects */}
      <Section title="Spatial Effects">
        <Detail
          label="Crater Diameter"
          value={formatDistance(results.craterDiameter)}
          icon="🕳️"
        />
        <Detail
          label="Crater Depth"
          value={formatDistance(results.craterDepth)}
          icon="📏"
        />
        <Detail
          label="Fireball Radius"
          value={formatDistance(results.fireballRadius)}
          icon="🔥"
        />
        <Detail
          label="Thermal Radius"
          value={formatDistance(results.thermalRadius)}
          icon="☢️"
        />
        <Detail
          label="Shockwave 50 kPa"
          value={formatDistance(results.shockwaveRadius50kPa)}
          icon="💥"
        />
        <Detail
          label="Shockwave 20 kPa"
          value={formatDistance(results.shockwaveRadius20kPa)}
          icon="💥"
        />
        <Detail
          label="Shockwave 5 kPa"
          value={formatDistance(results.shockwaveRadius5kPa)}
          icon="💥"
        />
        <Detail
          label="Peak Wind @50kPa"
          value={formatWind(results.peakWindSpeed50kPa)}
          icon="🌬️"
        />
      </Section>

      {/* (Casualty & economic metrics intentionally removed per user request) */}
      <Section title="Earthquake Comparison">
        <Detail
          label="Nearest Historic"
          value={
            results.earthquakeComparison.nearest
              ? `${results.earthquakeComparison.nearest.year} ${
                  results.earthquakeComparison.nearest.name
                } (M${results.earthquakeComparison.nearest.magnitude.toFixed(
                  1
                )})`
              : "N/A"
          }
          icon="🌎"
        />
        <Detail
          label="Context"
          value={
            results.earthquakeComparison.relativeText ||
            results.earthquakeComparison.classification
          }
          icon="📊"
        />
        {results.earthquakeComparison.nearest?.sourceUrl && (
          <Detail
            label="More Info"
            value={
              <a
                href={results.earthquakeComparison.nearest.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                USGS Event Page ↗
              </a>
            }
            icon="🔗"
          />
        )}
        {results.earthquakeComparison.exceedsRecorded && (
          <Detail
            label="Notice"
            value="Exceeds recorded tectonic events"
            icon="⚠️"
          />
        )}
      </Section>
      {results.tsunami && (
        <Section title="Tsunami Estimate (Ocean Impact)">
          <Detail
            label="Source Wave Height"
            value={`${results.tsunami.sourceWaveHeight.toFixed(2)} m`}
            icon="🌊"
          />
          <Detail
            label="Wave Height @100 km"
            value={`${results.tsunami.waveHeightAt100km.toFixed(2)} m`}
            icon="🌐"
          />
          <Detail
            label="Estimated Run-up"
            value={`${results.tsunami.potentialRunup.toFixed(2)} m`}
            icon="🏖️"
          />
          <Detail
            label=">1 m Wave Reach Radius"
            value={formatDistance(results.tsunami.affectedCoastlineRadius)}
            icon="🗺️"
          />
        </Section>
      )}
    </div>
  );
}

/* ---------- Small presentational helpers ---------- */
interface MetricCardProps {
  label: string;
  value: string;
  color: string;
}
function MetricCard({ label, value, color }: MetricCardProps) {
  return (
    <div
      className={`bg-${color}-900/30 rounded-lg p-4 border border-${color}-500/30`}
    >
      <div
        className={`text-${color}-300 text-xs font-semibold uppercase tracking-wide`}
      >
        {label}
      </div>
      <div className="text-white text-lg font-bold mt-1 break-all">{value}</div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}
function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-slate-200 tracking-wide border-b border-slate-700 pb-1">
        {title}
      </h3>
      <div className="bg-slate-800/40 rounded-lg p-3 space-y-2">{children}</div>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
}
function Detail({ label, value, icon }: DetailProps) {
  return (
    <div className="flex justify-between items-center text-xs border-b border-slate-700 last:border-b-0 py-1">
      <span className="text-slate-300 flex items-center gap-1">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span className="text-slate-100 font-semibold">{value}</span>
    </div>
  );
}
