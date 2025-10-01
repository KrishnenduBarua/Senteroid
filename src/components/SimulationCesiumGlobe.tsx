import React, { useEffect, useRef, useState } from "react";
import {
  Ion,
  Viewer,
  SceneMode,
  IonImageryProvider,
  createWorldTerrainAsync,
  createOsmBuildingsAsync,
  Cartesian3,
  Color,
  Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Cartographic,
  Math as CesiumMath,
  HeightReference,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

interface SimulationCesiumGlobeProps {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    populationDensity: number;
    cityName?: string;
  }) => void;
  impactLocation?: {
    latitude: number;
    longitude: number;
    cityName?: string;
  } | null;
  damageZones?: Array<{ radius: number; color: string; type: string }>;
}

const SimulationCesiumGlobe: React.FC<SimulationCesiumGlobeProps> = ({
  onLocationSelect,
  impactLocation,
  damageZones = [],
}) => {
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const impactEntityRef = useRef<Entity | null>(null);
  const damageEntitiesRef = useRef<Entity[]>([]);

  useEffect(() => {
    let isMounted = true;
    let viewer: Viewer | undefined;

    if (cesiumContainerRef.current && !viewerRef.current) {
      try {
        // @ts-ignore: Vite provides import.meta.env
        Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

        viewer = new Viewer(cesiumContainerRef.current, {
          sceneMode: SceneMode.SCENE3D,
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          sceneModePicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          navigationHelpButton: false,
          selectionIndicator: false,
          infoBox: false,
        });

        viewerRef.current = viewer;

        // Remove default imagery
        viewer.imageryLayers.removeAll();

        // Add satellite imagery
        IonImageryProvider.fromAssetId(2).then((imageryProvider) => {
          if (isMounted && viewer) {
            viewer.imageryLayers.addImageryProvider(imageryProvider);
          }
        });

        // Set terrain provider
        createWorldTerrainAsync().then((terrainProvider) => {
          if (isMounted && viewer) {
            viewer.terrainProvider = terrainProvider;
          }
        });

        // Enable lighting
        if (viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.enableLighting = true;
        }

        // Add OSM Buildings
        createOsmBuildingsAsync().then((buildings) => {
          if (isMounted && viewer) {
            viewer.scene.primitives.add(buildings);
          }
        });

        // Set up click handler for location selection
        if (onLocationSelect) {
          const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
          handler.setInputAction((event: any) => {
            if (viewer) {
              const pickedPosition = viewer.camera.pickEllipsoid(
                event.position,
                viewer.scene.globe.ellipsoid
              );
              if (defined(pickedPosition)) {
                const cartographic = Cartographic.fromCartesian(pickedPosition);
                const longitude = CesiumMath.toDegrees(cartographic.longitude);
                const latitude = CesiumMath.toDegrees(cartographic.latitude);

                // Get population density (simplified)
                const populationDensity = getPopulationDensityForLocation(
                  latitude,
                  longitude
                );

                onLocationSelect({
                  latitude,
                  longitude,
                  populationDensity: populationDensity.density,
                  cityName: populationDensity.cityName,
                });
              }
            }
          }, ScreenSpaceEventType.LEFT_CLICK);
        }

        setIsReady(true);

        return () => {
          isMounted = false;
          if (viewer) {
            viewer.destroy();
          }
        };
      } catch (error) {
        console.error("Error creating Cesium viewer:", error);
        setIsReady(false);
      }
    }
  }, [onLocationSelect]);

  // Update impact location marker
  useEffect(() => {
    if (!viewerRef.current || !isReady) return;

    const viewer = viewerRef.current;

    // Remove existing impact marker
    if (impactEntityRef.current) {
      viewer.entities.remove(impactEntityRef.current);
      impactEntityRef.current = null;
    }

    // Add new impact marker if location is selected
    if (impactLocation) {
      const position = Cartesian3.fromDegrees(
        impactLocation.longitude,
        impactLocation.latitude,
        1000
      );

      impactEntityRef.current = viewer.entities.add({
        position,
        point: {
          pixelSize: 20,
          color: Color.ORANGE,
          outlineColor: Color.RED,
          outlineWidth: 3,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: "🎯 IMPACT ZONE",
          font: "14px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cartesian3(0, -50, 0),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // Fly to the impact location
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          impactLocation.longitude,
          impactLocation.latitude,
          1000000
        ),
        duration: 2.0,
      });
    }
  }, [impactLocation, isReady]);

  // Update damage zones
  useEffect(() => {
    if (!viewerRef.current || !isReady || !impactLocation) return;

    const viewer = viewerRef.current;

    // Remove existing damage zone entities
    damageEntitiesRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    damageEntitiesRef.current = [];

    // Add damage zone circles
    damageZones.forEach((zone) => {
      const entity = viewer.entities.add({
        position: Cartesian3.fromDegrees(
          impactLocation.longitude,
          impactLocation.latitude
        ),
        ellipse: {
          semiMajorAxis: zone.radius,
          semiMinorAxis: zone.radius,
          material: Color.fromCssColorString(zone.color).withAlpha(0.3),
          outline: true,
          outlineColor: Color.fromCssColorString(zone.color),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });

      damageEntitiesRef.current.push(entity);
    });
  }, [damageZones, impactLocation, isReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={cesiumContainerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading Earth...</div>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {isReady && !impactLocation && onLocationSelect && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur rounded-lg px-6 py-3 border border-blue-400/30">
          <div className="flex items-center space-x-2 text-blue-300">
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
            <span className="font-semibold">
              Click anywhere on Earth to select impact location
            </span>
          </div>
        </div>
      )}

      {/* Impact location info */}
      {impactLocation && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur rounded-lg p-4 border border-blue-400/30 max-w-xs">
          <div className="text-blue-300 font-semibold mb-2">
            📍 Impact Location
          </div>
          <div className="text-white text-sm space-y-1">
            <div>Lat: {impactLocation.latitude.toFixed(4)}°</div>
            <div>Lon: {impactLocation.longitude.toFixed(4)}°</div>
            {impactLocation.cityName && (
              <div className="text-blue-200">
                Near: {impactLocation.cityName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend for damage zones */}
      {damageZones.length > 0 && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur rounded-lg p-4 border border-red-400/30">
          <div className="text-red-300 font-semibold mb-3">🔥 Damage Zones</div>
          <div className="space-y-2">
            {damageZones.map((zone, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full border border-white/30"
                  style={{ backgroundColor: zone.color + "80" }}
                ></div>
                <span className="text-white capitalize">{zone.type}</span>
                <span className="text-slate-400">
                  ({formatDistance(zone.radius)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getPopulationDensityForLocation(
  lat: number,
  lon: number
): { density: number; cityName?: string } {
  const cities = [
    { name: "New York", lat: 40.7128, lon: -74.006, density: 10947 },
    { name: "London", lat: 51.5074, lon: -0.1278, density: 5701 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503, density: 6224 },
    { name: "Paris", lat: 48.8566, lon: 2.3522, density: 20169 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093, density: 433 },
  ];

  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow((lat - city.lat) * 111, 2) +
        Math.pow((lon - city.lon) * 111 * Math.cos((lat * Math.PI) / 180), 2)
    );

    if (distance < 100) {
      return { density: city.density, cityName: city.name };
    }
  }

  if (Math.abs(lat) > 80) {
    return { density: 10 };
  } else if (Math.abs(lat) < 30) {
    return { density: 500 };
  } else {
    return { density: 200 };
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export default SimulationCesiumGlobe;
