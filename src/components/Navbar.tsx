// Navbar.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const STORYMODE_URL =
    import.meta.env.VITE_STORYMODE_URL || "https://senterroid.vercel.app/storymode";

  const playClickSound = React.useCallback(() => {
    const audio = new Audio("/sound/click.mp3");
    audio.play().catch((error) => console.log("Audio playback failed:", error));
  }, []);

  // Updated: supports internal paths *and* absolute URLs
  const handleNav = (path?: string) => {
    playClickSound();
    if (!path) return;

    // If it's an absolute URL (different origin), use a full-page navigation
    if (/^https?:\/\//i.test(path)) {
      window.location.href = path; // or window.location.assign(path)
      return;
    }

    // Otherwise, use client-side routing
    navigate(path);
  };

  const baseItemClass =
    "font-league font-bold text-white text-sm md:text-lg lg:text-xl py-2 px-3 md:px-4 border-2 border-transparent rounded-lg transition-all duration-300 hover:border-white hover:bg-white/10 active:scale-95 active:bg-white/20";
  const activeClass = "border-white/60 bg-white/10";

  const needsContrast = location.pathname.startsWith("/simulation");
  const wrapExtra = needsContrast ? "bg-black/40 backdrop-blur-sm" : "";

  return (
    <nav
      className={`absolute top-0 left-0 w-full flex items-center px-4 md:px-6 py-4 z-[1000] transition-colors ${wrapExtra}`}
      aria-label="Main navigation"
    >
      <div
        className="font-bungee text-white text-2xl md:text-3xl mr-auto cursor-pointer select-none tracking-wide drop-shadow"
        onClick={() => handleNav("/")}
      >
        SENTEROID
      </div>
      <ul className="flex space-x-3 md:space-x-6 lg:space-x-8 pr-2 md:pr-4">
        <li
          className={`${baseItemClass} ${
            location.pathname === "/" ? activeClass : ""
          }`}
          onClick={() => handleNav("/")}
        >
          HOME
        </li>
        <li
          className={`${baseItemClass} ${
            location.pathname === "/earth" ? activeClass : ""
          }`}
          onClick={() => handleNav("/earth")}
        >
          EARTH
        </li>
        <li
          className={`${baseItemClass} ${
            location.pathname === "/simulation" ? activeClass : ""
          }`}
          onClick={() => handleNav("/simulation")}
        >
          SIMULATE
        </li>
        <li
          className={`${baseItemClass} ${
            location.pathname === "/fact" || location.pathname === "/space-travel"
              ? activeClass
              : ""
          }`}
          onClick={() => handleNav("/fact")}
        >
          FACT
        </li>

        {/* STORYMODE: navigate to a different origin */}
        <li
          className={baseItemClass}
          onClick={() => handleNav(STORYMODE_URL)}
          title={STORYMODE_URL}
        >
          STORYMODE
        </li>

        <li className={baseItemClass} onClick={() => handleNav("/learn")}>
          LEARN
        </li>
      </ul>
    </nav>
  );
}
