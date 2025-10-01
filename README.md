# Asteroid Impact & Exploration Simulator

Interactive asteroid impact simulator and educational explorer: visualize impact effects, compare seismic energy, explore tsunami estimates, and scroll a cinematic asteroid facts journey.

Live Demo: (add your deployed URL once available)

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

## 🗂 Structure (excerpt)

```
src/
  components/
  data/
  styles/
  HomePage.tsx
  SpaceTravelPage.tsx
public/
  fact-images/
  sound/
```

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# build
npm run build
# preview production
npm run preview
```

Open: http://localhost:5173 (default Vite port)

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

Tsunami + seismic models are simplified and educational only.

---

## 🌐 Deploy (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Build: `npm run build` | Output: `dist`
4. (If route refresh fails) add `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 🔗 Resources

- NASA Solar System – Asteroids: https://science.nasa.gov/solar-system/asteroids/
- JPL CNEOS: https://cneos.jpl.nasa.gov/
- USGS Earthquake Hazards: https://earthquake.usgs.gov/

---

## 🧩 Future Ideas

- 3D rotating asteroid viewer
- Perma-links to simulations
- Export results (CSV / JSON)
- i18n
- Better bathymetry-aware tsunami model

---

## 🔐 Environment Variables

Create `.env` (not committed) for future APIs:

```
VITE_NASA_API_KEY=your_key_here
```

Use via `import.meta.env.VITE_NASA_API_KEY`.

---

## 🛡️ License

(Choose a license: MIT / Apache-2.0 / etc.)

---

## 🤝 Contributing

1. Fork
2. `git checkout -b feature/thing`
3. Commit & push
4. Open PR

---

## 📣 Disclaimer

This project is for educational visualization only—not for real impact hazard assessment.
