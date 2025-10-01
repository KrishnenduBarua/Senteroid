import React, { useEffect, useRef, useState } from "react";
import { Ion, Viewer } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

interface SimpleGlobeProps {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    populationDensity: number;
    cityName?: string;
  }) => void;
}

const SimpleGlobe: React.FC<SimpleGlobeProps> = ({ onLocationSelect }) => {
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cesiumContainerRef.current) {
      try {
        console.log("Attempting to create Cesium viewer...");
        setStatus("Loading Cesium...");

        // @ts-ignore: Vite provides import.meta.env
        const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
        console.log("Cesium Ion Token available:", !!token);

        if (token) {
          Ion.defaultAccessToken = token;
        }

        const viewer = new Viewer(cesiumContainerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          navigationHelpButton: false,
        });

        console.log("Cesium viewer created successfully");
        setStatus("Globe loaded successfully!");

        // Add click handler if onLocationSelect is provided
        if (onLocationSelect) {
          viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
            (click: any) => {
              const cartesian = viewer.camera.pickEllipsoid(
                click.position,
                viewer.scene.globe.ellipsoid
              );
              if (cartesian) {
                const cartographic =
                  viewer.scene.globe.ellipsoid.cartesianToCartographic(
                    cartesian
                  );
                const longitude = (cartographic.longitude * 180.0) / Math.PI;
                const latitude = (cartographic.latitude * 180.0) / Math.PI;

                console.log("Location selected:", { latitude, longitude });
                onLocationSelect({
                  latitude,
                  longitude,
                  populationDensity: 1000, // Default density
                  cityName: "Selected Location",
                });
              }
            },
            1
          ); // LEFT_CLICK
        }

        return () => {
          console.log("Destroying Cesium viewer");
          viewer.destroy();
        };
      } catch (err) {
        console.error("Error creating Cesium viewer:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("Failed to load");
      }
    }
  }, [onLocationSelect]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 border border-red-500">
        <div className="text-center text-red-300 p-8">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl font-semibold mb-2">Globe Loading Error</div>
          <div className="text-sm">{error}</div>
          <div className="text-xs mt-4 text-red-400">
            Check browser console for more details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={cesiumContainerRef} className="absolute inset-0" />

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/90 text-slate-200 px-3 py-2 rounded text-sm">
        Status: {status}
      </div>

      {/* Instructions */}
      {status.includes("successfully") && onLocationSelect && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-900/90 text-blue-200 px-4 py-2 rounded text-sm">
          Click anywhere on Earth to select impact location
        </div>
      )}
    </div>
  );
};

export default SimpleGlobe;
