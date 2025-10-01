import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      cesium: path.resolve(__dirname, "node_modules/cesium"),
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify("/node_modules/cesium/Build/Cesium/"),
  },
  server: {
    proxy: {
      // Proxy live comet data (Socrata dataset). Browser calls /api/comets
      // Vite dev server fetches from NASA, bypassing browser CORS.
      "/api/comets": {
        target: "https://data.nasa.gov",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/comets/, "/resource/b67r-rgxc.json"),
        headers: {
          Accept: "application/json",
        },
      },
      // Proxy JPL SBDB small-body database to bypass CORS in dev
      // Example browser request: /api/sbdb?sstr=101955&phys-par=1
      "/api/sbdb": {
        target: "https://ssd-api.jpl.nasa.gov",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/sbdb/, "/sbdb.api"),
        headers: {
          Accept: "application/json",
        },
      },
      // Batch query endpoint proxy (POST) for multiple objects at once
      "/api/sbdb_query": {
        target: "https://ssd-api.jpl.nasa.gov",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/sbdb_query/, "/sbdb_query.api"),
        headers: {
          Accept: "application/json",
        },
      },
    },
  },
});
