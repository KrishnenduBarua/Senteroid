// src/Learn.tsx
import React, { useState } from "react";
import learn from "./learn.png";
import c_type from "./C_type.png";
import m_type from "./M_type.png";
import s_type from "./S_type.png";
import pioneer from "./pioneer.png";
import collision from "./COLLIDE.png";
import ceres from "./ceres.png";
import hoverSound from "./hover.mp3";

type Position =
  | { top: string; left?: string; right?: string }
  | { bottom: string; left?: string; right?: string }
  | { top: string; right: string }
  | { bottom: string; right: string }
  | { top?: string; bottom?: string; left?: string; right?: string };

interface ElementItem {
  id: string;
  src: string | null;
  position: Position;
  size: { width: string; height: string };
  title: string;
  description: string;
}

const Learn: React.FC = () => {
  const [hoveredElement, setHoveredElement] = useState<ElementItem | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const playHoverSound = () => {
    const audio = new Audio(hoverSound);
    audio.volume = 1.0; // Adjust volume (0.0 to 1.0)
    audio
      .play()
      .catch((error) => {
        console.log("Audio playback failed:", error);
      });
  };

  const handleMouseEnter = (element: ElementItem) => {
    playHoverSound();
    setHoveredElement(element);
  };

  const elements: ElementItem[] = [
    {
      id: "c_type",
      src: c_type,
      position: { top: "38%", left: "10%" },
      size: { width: "150px", height: "150px" },
      title: "C-Type Asteroid",
      description:
        "C-type asteroids are the most common, making up about 75% of known asteroids. They are very dark and rich in carbon and water-containing minerals, giving them a low reflectivity. They are similar in composition to carbonaceous meteorites. The largest C-type asteroids include 10 Hygiea and sometimes Ceres.",
    },
    {
      id: "m_type",
      src: m_type,
      position: { top: "29%", right: "20%" },
      size: { width: "150px", height: "150px" },
      title: "M-Type Asteroid",
      description:
        "M-type asteroids are metallic, made mostly of iron and nickel, and may be the source of many iron meteorites. They are moderately bright and have higher densities than most asteroids. Many also contain some silicates, sometimes with water, so their composition is a mix of metal and rock. M-types are less common than C- and S-types and are mostly found in the middle part of the asteroid belt.",
    },
    {
      id: "s_type",
      src: s_type,
      position: { bottom: "48%", left: "25%" },
      size: { width: "160px", height: "150px" },
      title: "S-Type Asteroid",
      description:
        "S-type asteroids are the second most common, making up about 17% of asteroids. They are stony and rocky, made mainly of iron- and magnesium-silicates, and have a higher density of around 3.0 g/cm³. Most S-types are found in the inner and central parts of the asteroid belt.",
    },
    {
      id: "pioneer",
      src: pioneer,
      position: { top: "30%", right: "35%" },
      size: { width: "200px", height: "140px" },
      title: "Pioneer Spacecraft",
      description:
        "The first spacecraft to cross the asteroid belt was Pioneer 10, which entered the belt on 16 July 1972. Initially, there were concerns about collisions with debris, but it passed safely. Since then, many spacecraft have traversed the belt without problems.",
    },
    {
      id: "collision",
      src: collision,
      position: { bottom: "27%", right: "44%" },
      size: { width: "250px", height: "250px" },
      title: "Impact Event",
      description:
        "Asteroid collisions happen frequently in the asteroid belt over long time scales. Large impacts can break asteroids into smaller pieces, forming new asteroid families, while low-speed collisions may merge two asteroids. Collisions also produce dust, which contributes a small part of the zodiacal light seen from Earth.",
    },
    {
      id: "ceres",
      src: ceres,
      position: { top: "40%", left: "58%" },
      size: { width: "250px", height: "200px" },
      title: "Ceres",
      description:
        "It is a dwarf planet in the main asteroid belt between Mars and Jupiter. It was the first asteroid discovered in 1801 and is the largest object in the belt without a moon. Its diameter is about a quarter of the Moon, making it too dim to see with the naked eye except under very dark skies.",
    },
    {
      id: "kirkwood_gaps",
      src: null, // Text element, no image
      position: { top: "82%", left: "20%" },
      size: { width: "auto", height: "auto" },
      title: "Kirkwood Gaps",
      description:
        "Kirkwood gaps are regions in the asteroid belt where very few asteroids are found.  Jupiter's gravitational influence over millions of years has cleared out asteroids from these resonant orbits, creating these notable empty zones in the belt.",
    },
  ];

  // Calculate tooltip position to keep it within viewport
  const getTooltipPosition = () => {
    const tooltipWidth = 300;
    const tooltipHeight = 150; // Approximate height
    const padding = 15;

    let left = mousePosition.x + padding;
    let top = mousePosition.y - padding;

    // Right edge
    if (left + tooltipWidth > window.innerWidth) {
      left = mousePosition.x - tooltipWidth - padding;
    }

    // Bottom edge
    if (top + tooltipHeight > window.innerHeight) {
      top = mousePosition.y - tooltipHeight - padding;
    }

    // Top edge
    if (top < 0) {
      top = mousePosition.y + padding;
    }

    // Left edge
    if (left < 0) {
      left = padding;
    }

    return { left, top };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "#11151f",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Background Image */}
      <img
        src={learn}
        alt="Learn"
        style={{
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          objectPosition: "center",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Header Section */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 15,
          color: "#ffffff",
          fontFamily: "'League Spartan', sans-serif",
          maxWidth: "900px",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: 700,
            margin: "0 0 15px 0",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          The Main Asteroid Belt
        </h1>
        <p
          style={{
            fontSize: "18px",
            margin: 0,
            opacity: 0.9,
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
            color: "#ffffff",
            lineHeight: 1.6,
            padding: "15px 20px",
            borderRadius: "10px",
          }}
        >
          The asteroid belt is a ring-shaped area in our Solar System between
          the planets Mars and Jupiter. It has many solid, irregularly shaped
          objects called asteroids or minor planets.
        </p>
      </div>

      {/* Interactive Elements */}
      {elements.map((element) => (
        <div
          key={element.id}
          style={{
            position: "absolute",
            zIndex: 10,
            cursor: "pointer",
            transition: "all 0.3s ease",
            ...(element.position as React.CSSProperties),
          }}
          onMouseEnter={() => handleMouseEnter(element)}
          onMouseLeave={() => setHoveredElement(null)}
        >
          {element.src ? (
            // Image elements
            <img
              src={element.src}
              alt={element.title}
              style={{
                width: element.size.width,
                height: element.size.height,
                objectFit: "contain",
                transform:
                  hoveredElement?.id === element.id
                    ? "scale(1.1)"
                    : "scale(1)",
                filter:
                  hoveredElement?.id === element.id
                    ? "drop-shadow(0 0 15px rgba(100, 200, 255, 0.8)) brightness(1.2)"
                    : "drop-shadow(0 0 8px rgba(100, 200, 255, 0.4))",
              }}
            />
          ) : (
            // Text element for Kirkwood Gaps
            <div
              style={{
                background: "rgba(0, 0, 0, 0.7)",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid rgba(7, 8, 101, 0.6)",
                fontFamily: "'League Spartan', sans-serif",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                transform:
                  hoveredElement?.id === element.id
                    ? "scale(1.05)"
                    : "scale(1)",
                boxShadow:
                  hoveredElement?.id === element.id
                    ? "0 0 20px rgba(5, 2, 48, 0.8)"
                    : "0 0 10px rgba(28, 25, 125, 0.4)",
                backdropFilter: "blur(5px)",
              }}
            >
              Kirkwood Gaps
            </div>
          )}
        </div>
      ))}

      {/* Tooltip */}
      {hoveredElement && (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.9)",
            color: "#ffffff",
            padding: "15px 20px",
            borderRadius: "10px",
            border: "2px solid rgba(100, 200, 255, 0.6)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
            maxWidth: "300px",
            fontFamily: "'League Spartan', sans-serif",
            pointerEvents: "none",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: 700,
              color: "#64C8FF",
            }}
          >
            {hoveredElement.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.4,
              color: "#ffffff",
              opacity: 0.9,
            }}
          >
            {hoveredElement.description}
          </p>
        </div>
      )}

      {/* Attributions - Bottom Right */}
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 20,
          fontSize: "15px",
          color: "#ffffff",
          fontFamily: "'League Spartan', sans-serif",
          textAlign: "right",
          lineHeight: 1.3,
          textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
          maxWidth: "300px",
        }}
      >
        <div style={{ marginBottom: "3px" }}>
          <strong>Sound:</strong>{" "}
          <a
            href="https://pixabay.com/users/lesiakower-25701529/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=399749"
            style={{ color: "#64C8FF", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lesiakower
          </a>{" "}
          from{" "}
          <a
            href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=399749"
            style={{ color: "#64C8FF", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pixabay
          </a>
        </div>
        <div style={{ marginBottom: "3px" }}>
          <strong>Info:</strong>{" "}
          <a
            href="https://en.wikipedia.org/wiki/Asteroid_belt"
            style={{ color: "#64C8FF", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia
          </a>
        </div>
        <div>
          <strong>Images:</strong>{" "}
          <a
            href="https://gemini.google.com"
            style={{ color: "#64C8FF", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Gemini AI
          </a>
        </div>
      </div>
    </div>
  );
};

export default Learn;
