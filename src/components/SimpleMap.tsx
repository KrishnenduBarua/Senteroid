import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SimpleMap: React.FC = () => {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />
      </MapContainer>
    </div>
  );
};

export default SimpleMap;
