import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";

// NOTE: File header was repaired to remove an accidentally inserted JSX fragment.

const BACKGROUNDS = [
  "space-travel-bg/lower-orbit.png",
  "space-travel-bg/middle-orbit.png",
  "space-travel-bg/deep-space.png",
];

// Ordered bottom -> top (render reversed later to start at bottom)
interface FactSegment {
  id: number;
  factNumber: number;
  text: string;
  image: string;
}
const FACTS: FactSegment[] = [
  {
    id: 0,
    factNumber: 1,
    text: "Asteroids are leftover rocks from the birth of our solar system, floating around for 4.6 billion years!",
    image: "/fact-images/1.png",
  },
  {
    id: 1,
    factNumber: 2,
    text: "Most asteroids can be found orbiting our Sun between Mars and Jupiter within the main asteroid belt.",
    image: "/fact-images/2.png",
  },
  {
    id: 2,
    factNumber: 3,
    text: "Most asteroids are irregularly shaped, though a few are nearly spherical, and they are often pitted or cratered.",
    image: "/fact-images/3.png",
  },
  {
    id: 3,
    factNumber: 4,
    text: "Some are binary (double) asteroids where two rocky bodies of similar size orbit each other; there are also triple systems.",
    image: "/fact-images/4.png",
  },
  {
    id: 4,
    factNumber: 5,
    text: "The total mass of all the asteroids combined is less than that of Earth's Moon.",
    image: "/fact-images/5.png",
  },
  {
    id: 5,
    factNumber: 6,
    text: "Asteroids and comets can be nudged into Earth's neighborhood by the gravity of nearby planets.",
    image: "/fact-images/6.png",
  },
  {
    id: 6,
    factNumber: 7,
    text: "A potentially hazardous asteroid (PHA) comes within 4.6 million miles of Earth's orbit and is at least 140 meters (≈460 ft) wide.",
    image: "/fact-images/7.png",
  },
  {
    id: 7,
    factNumber: 8,
    text: "~10-meter (≈30 ft) asteroids impact Earth about once per decade, producing a bright fireball and a strong sonic boom.",
    image: "/fact-images/8.png",
  },
  {
    id: 8,
    factNumber: 9,
    text: "Large asteroids occasionally strike Earth over long time spans, creating craters like Arizona’s Barringer (Meteor) Crater.",
    image: "/fact-images/9.png",
  },
  {
    id: 9,
    factNumber: 10,
    text: "Asteroid Eros was the first ever orbited by a spacecraft, and also the first to have a successful landing (NEAR Shoemaker mission).",
    image: "/fact-images/10.png",
  },
];

/* =====================  NEW: global opacity knobs  ===================== */
// Make page a bit lighter → lower BG_DARKEN (e.g., 0.20)
// Let image show more → raise LAYER_MAX_OPACITY (max 1.0)
// Tweak cross-fade feel → change EASING_EXPONENT (closer to 1 = more linear)
const BG_DARKEN = 0.4; // global dark overlay strength
const CARD_FOCUS_RADIUS = 260; // px distance from viewport center for max focus
const TRACK_SECTION_VH = 140; // height (in vh) per fact segment
const MIN_CARD_SCALE = 0.7;
const MAX_CARD_SCALE = 1.05;
const MIN_CARD_OPACITY = 0.15;
const MAX_CARD_OPACITY = 1.0;
const SCROLL_END_PADDING_VH = 70; // more space to fit learn-more panel after last fact
const INTRO_SECTION_VH = 120; // height for intro area before Fact 1
/* ====================================================================== */

export default function SpaceTravelPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const [currentFactIdx, setCurrentFactIdx] = useState(0); // relative to FACTS (0 = bottom / fact 1)
  const [progress, setProgress] = useState(0); // 0..1 overall vertical progress (bottom=0 top=1)
  const [initialized, setInitialized] = useState(false);

  // Total scrollable height (vh units converted later): facts * section + padding top
  const totalSections = FACTS.length;
  const totalHeightVH =
    INTRO_SECTION_VH + totalSections * TRACK_SECTION_VH + SCROLL_END_PADDING_VH;

  const update = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const rawScrollTop = container.scrollTop;
    // Inverted progress: bottom = 0, top = 1
    const inv = 1 - rawScrollTop / (maxScroll || 1);
    setProgress(inv);

    // Determine which card is closest to center
    const viewportCenter = container.clientHeight / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Because card is inside scroll container, rect top relative to viewport works
      const cardCenter = rect.top + rect.height / 2;
      const dist = Math.abs(cardCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    setCurrentFactIdx(closestIdx);
  }, []);

  // Scroll listener (RAF throttled)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => el.removeEventListener("scroll", onScroll);
  }, [update]);

  // Initial scroll to bottom
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && !initialized) {
      el.scrollTop = el.scrollHeight;
      setInitialized(true);
      // After jump, compute states
      requestAnimationFrame(update);
    }
  }, [initialized, update]);

  // Compute background layer opacities from progress (3 layers)
  function backgroundOpacities(p: number): [number, number, number] {
    // Segment progress into thirds 0-0.33-0.66-1
    const seg = 1 / (BACKGROUNDS.length - 1); // 0.5 for 3 backgrounds
    const a = Math.min(1, 1 - p / seg); // first fades out early
    const midStart = seg * 0.3;
    const midEnd = seg * 1.7; // overlap region for middle
    const b =
      p < midStart
        ? 0
        : p > midEnd
        ? 0
        : 1 -
          Math.abs((p - (midStart + midEnd) / 2) / ((midEnd - midStart) / 2));
    const c = Math.max(0, (p - seg) / (1 - seg)); // last fades in second half
    // Normalize mid (b) not to exceed 1
    return [
      Math.max(0, Math.min(1, a)),
      Math.max(0, Math.min(1, b)),
      Math.max(0, Math.min(1, c)),
    ];
  }
  const [bg1, bg2, bg3] = backgroundOpacities(progress);

  // Helper to compute card transform based on distance from center
  const computeCardStyle = (el: HTMLDivElement | null): React.CSSProperties => {
    if (!el || !scrollRef.current) return {};
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight; // acceptable approximation inside container
    const center = viewportH / 2;
    const cardCenter = rect.top + rect.height / 2;
    const dist = Math.abs(cardCenter - center);
    const t = Math.max(0, 1 - dist / CARD_FOCUS_RADIUS); // 1 at center to 0 outside radius
    const scale = MIN_CARD_SCALE + (MAX_CARD_SCALE - MIN_CARD_SCALE) * t;
    const opacity =
      MIN_CARD_OPACITY + (MAX_CARD_OPACITY - MIN_CARD_OPACITY) * t;
    const yTranslate = (1 - t) * 40; // subtle rise when unfocused
    return {
      transform: `translateY(${yTranslate}px) scale(${scale})`,
      opacity,
      filter: `blur(${(1 - t) * 2.2}px)`,
    };
  };

  return (
    <div
      ref={scrollRef}
      className="relative h-screen w-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600/40 scrollbar-track-transparent"
      aria-label="Asteroid facts vertical journey"
    >
      {/* Background layers */}
      <div className="fixed inset-0 -z-50">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${BACKGROUNDS[0]})`, opacity: bg1 }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${BACKGROUNDS[1]})`, opacity: bg2 }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${BACKGROUNDS[2]})`, opacity: bg3 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${BG_DARKEN})` }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.08),transparent_60%)] mix-blend-screen" />
      </div>

      {/* Sticky HUD */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex flex-col items-center mt-4 gap-3">
        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg text-xs tracking-wide text-slate-200 flex items-center gap-3">
          <span className="font-semibold text-white/90">
            ASTEROID FACTS JOURNEY
          </span>
          <span className="opacity-60">•</span>
          <span className="font-mono">
            Fact {FACTS[currentFactIdx].factNumber}/{FACTS.length}
          </span>
        </div>
        <div className="w-[60%] h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 transition-all duration-300"
            style={{ width: `${((currentFactIdx + 1) / FACTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main vertical track container */}
      <div style={{ height: `${totalHeightVH}vh` }} className="relative w-full">
        {/* Central track (sticky) */}
        <div className="pointer-events-none sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-px h-[80vh] bg-gradient-to-b from-transparent via-white/40 to-transparent" />
        </div>

        {/* Fact cards absolutely positioned from bottom upward (fact 1 just above intro) */}
        <div className="absolute inset-0">
          {/* Intro zone at the very bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${INTRO_SECTION_VH}vh`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-10 px-8 md:px-16 py-14 max-w-5xl w-full">
              <div className="flex-1 flex flex-col items-center md:items-start gap-6">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg text-center md:text-left">
                  Do you know some facts about asteroids?
                </h1>
                <p className="text-slate-200/90 text-base md:text-lg leading-relaxed max-w-xl text-center md:text-left">
                  Scroll upward to uncover a stacked journey of 10 curated
                  asteroid facts. Each panel will animate into focus as you
                  ascend. Ready to explore? Start scrolling up — Fact 1 awaits
                  just above!
                </p>
                <div className="mt-4 flex items-center gap-3 text-slate-300/80 text-sm md:text-base">
                  <span className="inline-flex h-9 px-4 items-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow hover:bg-white/15 transition">
                    Scroll Up
                  </span>
                  <span className="opacity-60">to begin the ascent</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <img
                  src="/fact-images/spaceman.png"
                  alt="Spaceman introducing asteroid facts"
                  className="animate-float-medium max-h-[50vh] w-auto object-contain drop-shadow-2xl select-none"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          </div>
          {FACTS.map((fact, i) => {
            const bottomOffset = INTRO_SECTION_VH + i * TRACK_SECTION_VH; // push above intro
            return (
              <div
                key={fact.id}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: `${bottomOffset}vh`,
                  height: `${TRACK_SECTION_VH}vh`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none", // card handles its own interactions
                }}
              >
                <div
                  ref={(el) => {
                    if (el) cardRefs.current[i] = el;
                  }}
                  className="will-change-transform transition-transform duration-300 ease-out select-none pointer-events-auto"
                  style={computeCardStyle(cardRefs.current[i])}
                >
                  <div className="relative group">
                    <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-cyan-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 blur-xl transition duration-500" />
                    <div className="relative z-10 w-[min(78vw,900px)] max-w-[900px] mx-auto rounded-2xl border border-white/15 bg-white/6 backdrop-blur-xl shadow-[0_8px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-8 p-10 md:p-12 items-center">
                        <div className="flex flex-col items-center md:items-start md:w-1/2 gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-sky-400/40 to-cyan-300/40 border border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-inner shadow-black/40 backdrop-blur-sm">
                              {fact.factNumber}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-md">
                              Asteroid Fact
                            </h2>
                          </div>
                          <p className="text-slate-200/90 text-base md:text-lg leading-relaxed font-medium">
                            {fact.text}
                          </p>
                        </div>
                        <div className="md:w-1/2 flex items-center justify-center">
                          <img
                            src={fact.image}
                            alt={`Asteroid fact ${fact.factNumber}`}
                            loading="lazy"
                            className="max-h-[42vh] w-auto object-contain drop-shadow-2xl rounded-xl border border-white/10 bg-black/30 p-3 backdrop-blur-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Learn more panel sits above the last fact (top area) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${SCROLL_END_PADDING_VH}vh`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "20vh", // lowered so it no longer hugs navbar
            }}
          >
            <div className="w-[min(80vw,880px)] mx-auto text-center space-y-6 px-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl">
                Want to Explore Even More About Asteroids?
              </h2>
              <p className="text-slate-200/80 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                Dive deeper into composition, missions, discovery techniques,
                and planetary defense. Continue your journey with trusted
                external science resources curated for curious minds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button
                  onClick={() => {
                    window.open(
                      "https://science.nasa.gov/solar-system/asteroids/",
                      "_blank"
                    );
                  }}
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 shadow-lg shadow-black/40 hover:shadow-cyan-500/30 hover:from-sky-400 hover:to-emerald-300 transition-all duration-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                >
                  <span className="relative z-10 tracking-wide">
                    NASA Asteroid Portal
                  </span>
                  <span className="relative z-10 text-lg">↗</span>
                  <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition" />
                </button>
                <button
                  onClick={() => {
                    window.open("https://cneos.jpl.nasa.gov/", "_blank");
                  }}
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/15 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <span className="relative z-10 tracking-wide">
                    JPL CNEOS Center
                  </span>
                  <span className="relative z-10 text-lg">↗</span>
                </button>
              </div>
              <p className="text-xs tracking-wide uppercase text-slate-400 pt-4">
                External links open in a new tab
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint badge */}
      {!initialized && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-slate-200/90 tracking-wide animate-pulse">
          Scroll Up to Begin ↑
        </div>
      )}
    </div>
  );
}
