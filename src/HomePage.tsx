import React from "react";
import { useNavigate } from "react-router-dom";

// New landing home page
export default function HomePage() {
  const navigate = useNavigate();
  const playClickSound = React.useCallback(() => {
    const audio = new Audio("/sound/click.mp3");
    audio.play().catch((err) => console.log("Audio playback failed", err));
  }, []);

  // Preload image to avoid flash of gradient-only if slow network
  const [bgLoaded, setBgLoaded] = React.useState(false);
  const imgSrc = "/home-bg/bg.jpg";
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.onerror = () => {
      console.warn("Background image failed to load:", imgSrc);
      setBgLoaded(false);
    };
    img.src = imgSrc;
  }, [imgSrc]);

  return (
    <div className="w-full h-full min-h-screen relative overflow-hidden">
      {/* Background image with fallback gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050315] via-[#090235] to-black" />
        {bgLoaded && (
          <img
            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none opacity-90 animate-fadeIn"
            src={imgSrc}
            alt="Background"
          />
        )}
      </div>
      <div className="absolute w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white z-10 px-4">
        <h1 className="font-bungee text-4xl md:text-5xl tracking-wide drop-shadow-xl">
          DISCOVER NEAR EARTH OBJECTS (NEO)
        </h1>
        <p className="font-league font-bold text-lg mt-6 bg-black/30 backdrop-blur-sm p-4 rounded-lg max-w-2xl mx-auto leading-relaxed">
          Explore real asteroid orbits, simulate potential impacts, and uncover
          fascinating space facts.
        </p>
        <button
          className="mt-10 px-10 py-4 text-xl font-league font-bold text-white bg-[#090235]/90 border-2 border-white rounded-xl cursor-pointer hover:bg-[#120a5a] hover:shadow-lg active:scale-95 active:bg-[#0b072d]/70 transition-all duration-200"
          onClick={() => {
            playClickSound();
            // Small delay to let the click sound start before navigation
            setTimeout(() => navigate("/earth"), 120);
          }}
        >
          Start Exploring
        </button>
      </div>
      {/* Removed 'LEARN MORE ABOUT ASTEROIDS' button per request */}
    </div>
  );
}
