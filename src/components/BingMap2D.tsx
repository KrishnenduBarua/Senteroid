import React, { useCallback, useRef, useEffect } from "react";
import { getPopulationDensity } from "../data/simulation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ImpactLocation {
  latitude: number;
  longitude: number;
  populationDensity: number;
  cityName?: string;
}

interface DamageZone {
  type: "crater" | "fireball" | "shockwave";
  radius: number;
  damage: number;
}

interface BingMap2DProps {
  onLocationSelect?: (location: ImpactLocation) => void;
  impactLocation?: ImpactLocation | null;
  damageZones?: DamageZone[];
}

// Custom component to handle map clicks
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (location: ImpactLocation) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        const { lat, lng } = e.latlng;

        // Use shared population density heuristic + city matching
        const { density, cityName } = getPopulationDensity(lat, lng);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          populationDensity: density,
          cityName, // may be undefined if ocean / remote
        });
      }
    },
  });

  return null;
}

const BingMap2D: React.FC<BingMap2DProps> = ({
  onLocationSelect,
  impactLocation,
  damageZones = [],
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Constrain view to a single copy of the world (avoid repeating tiles horizontally)
  const WORLD_BOUNDS: L.LatLngBoundsExpression = [
    [-85, -180],
    [85, 180],
  ];

  // Bing Maps Aerial URL template (no API key required for basic usage)
  const bingAerialUrl =
    "https://ecn.{s}.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1&mkt=en-US&shading=hill";

  // Helper function to convert tile coordinates to quadkey (required for Bing Maps)
  const tileToQuadKey = (x: number, y: number, z: number): string => {
    let quadKey = "";
    for (let i = z; i > 0; i--) {
      let digit = 0;
      const mask = 1 << (i - 1);
      if ((x & mask) !== 0) {
        digit++;
      }
      if ((y & mask) !== 0) {
        digit += 2;
      }
      quadKey += digit.toString();
    }
    return quadKey;
  };

  // Custom Bing Maps layer component
  const BingMapsLayer = () => {
    return (
      <>
        {/* Bing Maps Aerial */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.microsoft.com/maps/">Microsoft</a> &mdash; &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          maxZoom={19}
          noWrap={true}
        />

        {/* Labels overlay for roads, cities, and places */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={19}
          noWrap={true}
        />

        {/* Place names and boundaries overlay */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={19}
          noWrap={true}
        />
      </>
    );
  };

  // Create custom impact marker icon
  const impactIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="#ff4444" stroke="#fff" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  // Get damage zone colors
  const getDamageZoneColor = (type: string): string => {
    switch (type) {
      case "crater":
        return "#ff4444";
      case "fireball":
        return "#ff8800";
      case "shockwave":
        return "#ffff00";
      default:
        return "#888888";
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <MapContainer
        center={[20, 0]}
        zoom={3}
        minZoom={3}
        maxZoom={18}
        style={{
          height: "100%",
          width: "100%",
        }}
        ref={mapRef}
        zoomControl={true}
        worldCopyJump={false}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        {/* Bing Maps Aerial with Labels */}
        <BingMapsLayer />

        {/* Map click handler */}
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Impact location marker */}
        {impactLocation && (
          <Marker
            position={[impactLocation.latitude, impactLocation.longitude]}
            icon={impactIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>🎯 Impact Point</strong>
                <br />
                Lat: {impactLocation.latitude.toFixed(4)}°<br />
                Lng: {impactLocation.longitude.toFixed(4)}°<br />
                Population: {Math.round(impactLocation.populationDensity)} per
                km²
              </div>
            </Popup>
          </Marker>
        )}

        {/* Damage zones */}
        {impactLocation &&
          damageZones.map((zone, index) => (
            <Circle
              key={index}
              center={[impactLocation.latitude, impactLocation.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: getDamageZoneColor(zone.type),
                fillColor: getDamageZoneColor(zone.type),
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>
                    {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}{" "}
                    Zone
                  </strong>
                  <br />
                  Radius: {(zone.radius / 1000).toFixed(1)} km
                  <br />
                  Damage: {zone.damage}%
                </div>
              </Popup>
            </Circle>
          ))}
      </MapContainer>

      {/* Instructions overlay */}
      {!impactLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-4 py-2 rounded text-sm z-[1000] text-white shadow-md border border-white/10">
          Click anywhere on Earth to select impact location
        </div>
      )}

      {/* Impact location info */}
      {impactLocation && (
        <div className="absolute top-4 right-4 bg-red-900/90 text-red-200 px-3 py-2 rounded text-sm z-[1000]">
          🎯 Impact: {impactLocation.latitude.toFixed(2)}°,{" "}
          {impactLocation.longitude.toFixed(2)}°
        </div>
      )}
    </div>
  );
};

export default BingMap2D;
