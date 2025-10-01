import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import HomePage from "./HomePage";
import EarthPage from "./EarthPage";
import SimulationPage from "./SimulationPage";
import SpaceTravelPage from "./SpaceTravelPage";
//import StoryMode from "./storymode/StoryMode";
import Learn from "./learn/Learn";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="earth" element={<EarthPage />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="fact" element={<SpaceTravelPage />} />
          <Route path="space-travel" element={<SpaceTravelPage />} />
          {/* <Route path="storymode" element={<StoryMode />} /> */}
          <Route path="learn" element={<Learn />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
