import React from "react";
import Navbar from "./components/Navbar";
import { Outlet, useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const contentClass = isHome ? "h-full w-full" : "h-full w-full pt-24";
  // Use transparent background on home so landing page background is visible
  const wrapperBg = isHome ? "bg-transparent" : "bg-black";
  return (
    <div className="relative h-screen w-full overflow-hidden bg-transparent">
      <Navbar />
      <div className="h-full w-full">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
