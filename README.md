# Senteroid (Asteroid Impact & Exploration Simulator)

Interactive asteroid impact simulator and educational explorer: visualize impact effects, compare seismic energy, explore tsunami estimates, and scroll a cinematic asteroid facts journey.

**Live Website Link:** https://senteroid.vercel.app/

---

## **High-Level Project Summary**

Understanding asteroid threats is critical for planetary defense, but raw NASA data remains inaccessible to the general public. The "Impactor-2025" scenario highlighted a crucial gap: people struggle to comprehend what asteroid parameters actually mean for Earth's safety. Existing datasets from NASA NeoWs, JPL SBDB, and USGS are fragmented and require expertise to interpret.
Hence, we developed **SENTEROID** - an interactive web platform that transforms complex NASA near-Earth object data into intuitive visualizations and simulations. Users can explore real asteroids and comets in orbit, simulate hypothetical impacts with scientifically-grounded calculations, learn mitigation strategies through interactive storytelling, and compare impact magnitudes with historical earthquakes. SENTEROID makes planetary defense education accessible to students, educators, and curious minds worldwide, turning intimidating numbers into understandable experiences.

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
- JPL SBDB API: https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html – authoritative orbital & physical element query reference.

---

## What Exactly Does It Do?

SENTEROID allows users to:

- **Visualize asteroid/comet orbits** using live NASA NeoWs and comet datasets.
- **Simulate asteroid impacts** by adjusting characteristics (size, speed, density, impact angle, and location).
- **Observe results instantly** (crater size, blast radius, fireball, seismic magnitude, tsunami potential).
- **Compare with real-world events**, such as USGS-recorded earthquakes.
- **Engage in guided learning** via Story Mode and Fact Pages that explain key planetary defense strategies.

---

## How Does It Work?

- The platform **fetches live data** from NASA NeoWs and comet datasets.
- Users set impact parameters, and the **TypeScript-based physics engine** runs simplified scaling laws to compute effects.
- Results are displayed via **CesiumJS (3D globe)** and **Leaflet (2D maps)** for intuitive visualization.
- The system links outputs to **curated seismic events from USGS**, helping users contextualize impact severity.
- Narrative features walk learners through **impact scenarios and mitigation strategies**, reinforcing planetary defense awareness.

---

## What Benefits Does It Have?

- **Accessibility** – Makes complex asteroid science approachable for students, educators, and the public.
- **Interactivity** – Users experiment with impact parameters in real time.
- **Awareness** – Connects space science with everyday analogs like earthquakes, building planetary defense literacy.
- **Engagement** – Blends simulations, guided storytelling, and educational resources to spark curiosity.

---

## What Do We Hope to Achieve?

Our vision is to build a **global awareness tool** where everyone can understand what asteroid impacts mean for Earth. By combining real NASA datasets with simplified but meaningful impact modeling, SENTEROID aspires to:

- Encourage **public engagement in planetary defense**.
- Inspire **future scientists and innovators** to work in space safety.
- Provide educators with a **ready-made interactive resource** for classrooms