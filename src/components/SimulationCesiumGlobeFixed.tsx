import React, { useEffect, useRef, useState } from "react";
import {
  Ion,
  Viewer,
  SceneMode,
  IonImageryProvider,
  createWorldTerrainAsync,
  createOsmBuildingsAsync,
  Color,
  Entity,
  Cartesian3,
  ScreenSpaceEventType,
  defined,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

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

interface SimulationCesiumGlobeProps {
  onLocationSelect?: (location: ImpactLocation) => void;
  impactLocation?: ImpactLocation | null;
  damageZones?: DamageZone[];
}

const SimulationCesiumGlobe: React.FC<SimulationCesiumGlobeProps> = ({
  onLocationSelect,
  impactLocation,
  damageZones = [],
}) => {
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("Loading globe...");
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    let isMounted = true;
    let viewer: Viewer | undefined;

    if (cesiumContainerRef.current) {
      try {
        setStatus("Initializing Cesium...");

        // @ts-ignore: Vite provides import.meta.env
        const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
        if (token) {
          Ion.defaultAccessToken = token;
        }

        viewer = new Viewer(cesiumContainerRef.current, {
          sceneMode: SceneMode.SCENE3D,
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          sceneModePicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          selectionIndicator: false,
          navigationHelpButton: false,
        });

        viewerRef.current = viewer;
        setStatus("Loading imagery...");

        // Remove default imagery and add Ion imagery
        viewer.imageryLayers.removeAll();
        IonImageryProvider.fromAssetId(2).then((imageryProvider) => {
          if (isMounted && viewer) {
            viewer.imageryLayers.addImageryProvider(imageryProvider);
            setStatus("Loading terrain...");
          }
        });

        // Set terrain provider
        createWorldTerrainAsync().then((terrainProvider) => {
          if (isMounted && viewer) {
            viewer.terrainProvider = terrainProvider;
            setStatus("Loading buildings...");
          }
        });

        if (viewer && viewer.scene && viewer.scene.globe) {
          viewer.scene.globe.enableLighting = true;
        }

        // Add OSM Buildings
        createOsmBuildingsAsync().then((buildings) => {
          if (isMounted && viewer) {
            viewer.scene.primitives.add(buildings);
            setStatus("Globe ready - Click to select impact location");
          }
        });

        // Add click handler for location selection
        if (onLocationSelect) {
          viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
            (click: any) => {
              const cartesian = viewer!.camera.pickEllipsoid(
                click.position,
                viewer!.scene.globe.ellipsoid
              );
              if (cartesian) {
                const cartographic =
                  viewer!.scene.globe.ellipsoid.cartesianToCartographic(
                    cartesian
                  );
                const longitude = (cartographic.longitude * 180.0) / Math.PI;
                const latitude = (cartographic.latitude * 180.0) / Math.PI;

                // Estimate population density (simplified)
                const populationDensity = Math.max(100, Math.random() * 5000);

                onLocationSelect({
                  latitude,
                  longitude,
                  populationDensity,
                  cityName: `Location (${latitude.toFixed(
                    2
                  )}°, ${longitude.toFixed(2)}°)`,
                });
              }
            },
            ScreenSpaceEventType.LEFT_CLICK
          );
        }

        return () => {
          isMounted = false;
          if (viewer) {
            viewer.destroy();
          }
          viewerRef.current = null;
        };
      } catch (error) {
        console.error("Error initializing Cesium:", error);
        setStatus("Failed to load globe");
      }
    }
  }, [onLocationSelect]);

  // Effect to update impact location marker
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && impactLocation) {
      // Remove existing impact markers
      viewer.entities.removeAll();

      // Add impact location marker
      viewer.entities.add({
        position: Cartesian3.fromDegrees(
          impactLocation.longitude,
          impactLocation.latitude
        ),
        point: {
          pixelSize: 20,
          color: Color.RED,
          outlineColor: Color.WHITE,
          outlineWidth: 3,
          heightReference: 0, // CLAMP_TO_GROUND
        },
        label: {
          text: "🎯 Impact Point",
          font: "12pt sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cartesian3(0, -50, 0),
          heightReference: 0, // CLAMP_TO_GROUND
        },
      });

      // Add damage zones
      damageZones.forEach((zone, index) => {
        const colors = {
          crater: Color.RED.withAlpha(0.3),
          fireball: Color.ORANGE.withAlpha(0.2),
          shockwave: Color.YELLOW.withAlpha(0.1),
        };

        viewer.entities.add({
          position: Cartesian3.fromDegrees(
            impactLocation.longitude,
            impactLocation.latitude
          ),
          ellipse: {
            semiMajorAxis: zone.radius * 1000, // Convert km to meters
            semiMinorAxis: zone.radius * 1000,
            material: colors[zone.type],
            outline: true,
            outlineColor: colors[zone.type].withAlpha(0.8),
            heightReference: 0, // CLAMP_TO_GROUND
          },
        });
      });

      // Only fly to impact location when it's first selected (no damage zones yet)
      // This prevents camera jerking when simulation results are added
      if (damageZones.length === 0) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            impactLocation.longitude,
            impactLocation.latitude,
            5000000 // 5000 km altitude
          ),
          duration: 2.0,
        });
      }
    }
  }, [impactLocation, damageZones]);

  return (
    <div className="relative w-full h-full">
      <div ref={cesiumContainerRef} className="absolute inset-0" />

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-slate-900/90 text-slate-200 px-3 py-2 rounded text-sm z-10">
        {status}
      </div>

      {/* Instructions */}
      {status.includes("ready") && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-900/90 text-blue-200 px-4 py-2 rounded text-sm z-10">
          Click anywhere on Earth to select impact location
        </div>
      )}

      {/* Impact location info */}
      {impactLocation && (
        <div className="absolute top-4 right-4 bg-red-900/90 text-red-200 px-3 py-2 rounded text-sm z-10">
          🎯 Impact: {impactLocation.latitude.toFixed(2)}°,{" "}
          {impactLocation.longitude.toFixed(2)}°
        </div>
      )}
    </div>
  );
};

export default SimulationCesiumGlobe;
