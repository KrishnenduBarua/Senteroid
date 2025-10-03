# Senteroid (Asteroid Impact & Exploration Simulator)

Interactive asteroid impact simulator and educational explorer: visualize impact effects, compare seismic energy, explore tsunami estimates, and scroll a cinematic asteroid facts journey.

**Live Website Link:** https://senteroid.vercel.app/

---


## ✨ Features

| Domain              | Highlights                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Impact Physics      | Kinetic energy, TNT equivalent, crater diameter & depth scaling, airburst effects                     |
| Atmospheric Effects | Fireball radius, thermal radius, overpressure shockwave radii (50 / 20 / 5 kPa), wind speed at 50 kPa |
| Seismic Estimate    | Effective seismic magnitude + nearest historic earthquake comparison (USGS links)                     |
| Ocean Impacts       | Land/ocean heuristic + simplified tsunami wave + run-up estimation                                    |
| Educational Mode    | Cinematic bottom-up "Asteroid Facts Journey" (10 curated facts + resource links)                      |
| UI/UX               | Bottom-origin scroll, sticky HUD, smooth animations, lazy images                                      |
| Accessibility       | Semantic grouping, alt text, keyboard-friendly layout                                                 |
| Deployment Ready    | Vite + React + TypeScript + Tailwind                                                                  |

---

## 🧠 Tech Stack

- React + TypeScript (Vite)
- TailwindCSS utilities + custom animations
- Custom physics (no external heavy physics libs)
- Optional map/globe components

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Create a `.env` file (root) for required API tokens:
```
VITE_CESIUM_ION_TOKEN=<your_cesium_ion_token>
VITE_NASA_API_KEY=<your_nasa_api_key>
```

It will open at: http://localhost:5173 (default)

---

## 🔬 Key Simulation Outputs

| Metric                    | Meaning                                          |
| ------------------------- | ------------------------------------------------ |
| Energy (J)                | Kinetic energy from mass & velocity              |
| TNT Equivalent            | Energy in tons / kt / Mt / Gt TNT                |
| Crater Diameter / Depth   | Estimated transient crater size                  |
| Fireball & Thermal Radius | Radiative/thermal effect extents                 |
| Shockwave Radii           | Overpressure zones (50 / 20 / 5 kPa)             |
| Peak Wind @50kPa          | Estimated wind speed in blast region             |
| Seismic Magnitude         | Approximate equivalent earthquake magnitude      |
| Tsunami Metrics           | Source wave, 100 km height, run-up, reach radius |

---


## 🔗 Resources

- NASA NeoWs: https://api.nasa.gov/neo/rest/v1/neo/browse – live NEO list for upcoming close approaches.
- Comet Dataset: https://data.nasa.gov/dataset/near-earth-comets-orbital-elements-api – scaled comet orbits for visualization.
- USGS Earthquakes: https://earthquake.usgs.gov/ – historic event pages used for magnitude comparison context.
- Cesium World Imagery: https://cesium.com/platform/cesium-ion/ – for global base map & globe imagery.
- JPL SBDB API: https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html – authoritative orbital & physical element query reference (future direct enrichment / validation).

---

