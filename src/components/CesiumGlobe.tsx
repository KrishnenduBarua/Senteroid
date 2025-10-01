// src/components/CesiumGlobe.tsx
import React, { useEffect, useRef } from "react";
import {
  Ion,
  Viewer,
  SceneMode,
  IonImageryProvider,
  Cartesian3,
  Cartesian2,
  JulianDate,
  Color,
  Entity,
  Matrix4,
  SampledPositionProperty,
  HermitePolynomialApproximation,
  PolylineGlowMaterialProperty,
  ArcType,
  EllipsoidTerrainProvider,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  NearFarScalar,
  HorizontalOrigin,
  VerticalOrigin,
} from "cesium";
import {
  sampleOrbitPolyline,
  propagateOrbit,
  pickColor,
  generateOrbitParams,
} from "../space/neoOrbits";
import type { NeoLite } from "../data/types";
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { OrbitParams } from "../space/neoOrbits";

interface CesiumGlobeProps {
  neos?: NeoLite[]; // synthetic
  scaledCometOrbits?: OrbitParams[] | null; // scaled NASA data already converted to Earth-centric visual scale
  mode?: "synthetic" | "nasa-scaled";
  onSelectAsteroid?: (neo: NeoLite, index: number) => void;
  onSelectComet?: (orbit: OrbitParams, index: number) => void;
}

const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  neos = [],
  scaledCometOrbits = null,
  mode = "synthetic",
  onSelectAsteroid,
  onSelectComet,
}) => {
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const orbitEntitiesRef = useRef<Entity[]>([]); // all orbit polylines
  const pointEntitiesRef = useRef<Entity[]>([]); // all moving point entities
  const orbitParamsRef = useRef<any[]>([]); // generic storage (comets currently)
  const asteroidEntitiesRef = useRef<{ point: Entity; neo: NeoLite }[]>([]);
  const cometEntitiesRef = useRef<
    { point: Entity; orbit: OrbitParams; index: number }[]
  >([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);

  // ---------- CRISP LABELS: Canvas billboard generator (+cache) ----------
  type LabelCanvasOpts = {
    fontPx?: number;         // CSS pixels (pre-DPR)
    fontWeight?: string;     // "700" | "800"
    textColor?: string;      // CSS
    outlineColor?: string;   // CSS
    outlineWidthPx?: number; // CSS px
    bgColor?: string;        // CSS with alpha
    paddingPx?: number;      // padding around text in CSS px
    cornerRadiusPx?: number; // rounded backplate
    maxChars?: number;       // truncate long names
  };

  const labelCanvasCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  function makeKey(text: string, o: LabelCanvasOpts) {
    return [
      text,
      o.fontPx, o.fontWeight,
      o.textColor, o.outlineColor, o.outlineWidthPx,
      o.bgColor, o.paddingPx, o.cornerRadiusPx, o.maxChars
    ].join("|");
  }

  // Draw rounded rect
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function createLabelCanvas(textRaw: string, opts?: LabelCanvasOpts): HTMLCanvasElement {
    const o: Required<LabelCanvasOpts> = {
      fontPx: 16,                 // integer px to avoid fractional blur
      fontWeight: "800",          // heavy, NASA-style
      textColor: "#FFFFFF",
      outlineColor: "#0A0F1C",    // deep navy outline
      outlineWidthPx: 4,          // thick outline for pop
      bgColor: "rgba(11,18,32,0.95)", // dark backplate
      paddingPx: 10,
      cornerRadiusPx: 8,
      maxChars: 28,
      ...(opts || {})
    };
    const text = (textRaw || "").slice(0, o.maxChars);

    const key = makeKey(text, o);
    const cached = labelCanvasCache.current.get(key);
    if (cached) return cached;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap to keep perf sane
    const font = `${o.fontWeight} ${o.fontPx * dpr}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;

    // Create a measuring canvas
    const m = document.createElement("canvas");
    const mctx = m.getContext("2d")!;
    mctx.font = font;
    const metrics = mctx.measureText(text);
    // conservative ascent/descent
    const ascent = Math.abs(metrics.actualBoundingBoxAscent || o.fontPx * dpr * 0.8);
    const descent = Math.abs(metrics.actualBoundingBoxDescent || o.fontPx * dpr * 0.2);
    const textW = Math.ceil(metrics.width);
    const textH = Math.ceil(ascent + descent);

    const pad = o.paddingPx * dpr;
    const w = Math.ceil(textW + pad * 2);
    const h = Math.ceil(textH + pad * 2);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${Math.round(w / dpr)}px`; // not required, but helps dev tools
    canvas.style.height = `${Math.round(h / dpr)}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Backplate
    ctx.fillStyle = o.bgColor;
    roundRect(ctx, 0, 0, w, h, o.cornerRadiusPx * dpr);
    ctx.fill();

    // Text baseline position
    const x = pad;
    const y = pad + ascent;

    // Outline first (thick)
    ctx.strokeStyle = o.outlineColor;
    ctx.lineWidth = o.outlineWidthPx * dpr;
    ctx.strokeText(text, x, y);

    // Fill on top
    ctx.fillStyle = o.textColor;
    ctx.fillText(text, x, y);

    labelCanvasCache.current.set(key, canvas);
    return canvas;
  }
  // ----------------------------------------------------------------------

  // Smooth, clock-driven position property (no manual rAF)
  const makeSampledOrbitPosition = (
    orbitParams: any,
    start: JulianDate,
    durationSeconds = 6 * 3600,
    samples = 180
  ) => {
    const prop = new SampledPositionProperty();
    prop.setInterpolationOptions({
      interpolationDegree: 2,
      interpolationAlgorithm: HermitePolynomialApproximation,
    });
    const step = durationSeconds / samples;
    for (let i = 0; i <= samples; i++) {
      const t = JulianDate.addSeconds(start, i * step, new JulianDate());
      const pos = propagateOrbit(orbitParams, t);
      prop.addSample(t, pos);
    }
    return prop;
  };

  // Recenter helper (press 'O')
  const recenterOrbits = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const EARTH_RADIUS = 6378137;
    const distance = 18 * EARTH_RADIUS;
    const offset = new Cartesian3(0, -distance, distance * 0.55);
    viewer.camera.lookAt(Cartesian3.ZERO, offset);
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  };

  // Init viewer once
  useEffect(() => {
    let isMounted = true;
    if (!cesiumContainerRef.current) return;

    // @ts-ignore – your env var for Cesium token
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

    const viewer = new Viewer(cesiumContainerRef.current, {
      sceneMode: SceneMode.SCENE3D,
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      sceneModePicker: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });
    viewerRef.current = viewer;

    // 🔧 CRISP SETTINGS
    // 1) Disable FXAA to avoid softening glyphs
    try {
      viewer.scene.postProcessStages.fxaa.enabled = false;
    } catch {}
    // 2) Raise render resolution toward devicePixelRatio
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
    // 3) WebGL2 MSAA (if supported) mainly helps lines/points
    if ("msaaSamples" in viewer.scene) {
      // @ts-ignore
      viewer.scene.msaaSamples = 4;
    }

    // Faster terrain for initial load
    viewer.terrainProvider = new EllipsoidTerrainProvider();

    // Imagery (Bing / Ion) – async
    viewer.imageryLayers.removeAll();
    IonImageryProvider.fromAssetId(2).then((ip) => {
      if (isMounted && viewerRef.current) {
        viewerRef.current.imageryLayers.addImageryProvider(ip);
      }
    });

    if (viewer.scene?.globe) viewer.scene.globe.enableLighting = true;

    // Camera: pull back a bit so Earth is smaller & centered
    {
      const EARTH_RADIUS = 6378137;
      const distance = 18 * EARTH_RADIUS;
      const offset = new Cartesian3(0, -distance, distance * 0.55);
      viewer.camera.lookAt(Cartesian3.ZERO, offset);
      viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    }

    // Let Cesium drive the clock + interpolation (no manual rAF)
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = (6 * 3600) / 60;

    // Keyboard shortcut to recenter
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "o" || e.key === "O") recenterOrbits();
    };
    window.addEventListener("keydown", keyHandler);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", keyHandler);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Build or rebuild orbits when data changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear previous entities if any
    orbitEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    pointEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    orbitEntitiesRef.current.length = 0;
    pointEntitiesRef.current.length = 0;
    orbitParamsRef.current.length = 0;
    asteroidEntitiesRef.current.length = 0;
    cometEntitiesRef.current.length = 0;

    // Rebuild (cap count for perf if needed)
    const now = JulianDate.now();
    const ORBIT_SEGMENTS = 384; // looks smooth with glow
    const ORBIT_COLOR = Color.fromCssColorString("#9ca3af").withAlpha(0.65);

    // Helper to attach billboard label next to a moving point
    function addCrispBillboardLabel(entity: Entity, text: string, colorHex: string) {
      const canvas = createLabelCanvas(text, {
        fontPx: 16,
        fontWeight: "800",
        textColor: "#FFFFFF",
        outlineColor: "#0A0F1C",
        outlineWidthPx: 4,
        bgColor: "rgba(11,18,32,0.95)",
        paddingPx: 10,
        cornerRadiusPx: 8,
        maxChars: 30,
      });
      // Billboard placed to the right of the point
      (entity as any).billboard = {
        image: canvas as any,
        verticalOrigin: VerticalOrigin.CENTER,
        horizontalOrigin: HorizontalOrigin.LEFT,
        pixelOffset: new Cartesian2(18, 0),
        // Keep label crisp near; gently shrink when far
        scaleByDistance: new NearFarScalar(1.0e6, 1.0, 3.0e7, 0.75),
        translucencyByDistance: new NearFarScalar(1.0e6, 1.0, 3.0e7, 0.92),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      };
    }

    // 1) Asteroids (synthetic, show top 5)
    if (neos.length) {
      const nowLocal = JulianDate.now();
      neos.slice(0, 5).forEach((neo, idx) => {
        const params = generateOrbitParams(neo, idx, nowLocal);
        const positions = sampleOrbitPolyline(params, ORBIT_SEGMENTS);

        const orbitEntity = viewer.entities.add({
          id: `asteroid-orbit-${idx}`,
          polyline: {
            positions,
            width: 1.8,
            arcType: ArcType.NONE,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.14,
              color: Color.fromCssColorString("#fbbf24").withAlpha(0.65),
            }),
          },
        });
        orbitEntitiesRef.current.push(orbitEntity as any);

        const sampled = makeSampledOrbitPosition(
          params,
          nowLocal,
          12 * 3600,
          200
        );

        const point = viewer.entities.add({
          id: `asteroid-point-${idx}`,
          position: sampled,
          point: {
            pixelSize: 14, // bigger, clear
            color: Color.fromCssColorString("#f59e0b"),
            outlineColor: Color.WHITE.withAlpha(0.95),
            outlineWidth: 2,
            scaleByDistance: new NearFarScalar(1.0e6, 1.0, 3.0e7, 0.6),
          },
        });

        // CRISP billboard label
        addCrispBillboardLabel(point as Entity, neo.name?.trim() || `Asteroid ${idx + 1}`, "#f59e0b");

        pointEntitiesRef.current.push(point as any);
        asteroidEntitiesRef.current.push({ point: point as Entity, neo });
      });
    }

    // 2) Comets (scaled)
    if (mode === "nasa-scaled" && scaledCometOrbits) {
      scaledCometOrbits.slice(0, 120).forEach((orbitParams, idx) => {
        orbitParamsRef.current.push(orbitParams);
        const positions = sampleOrbitPolyline(orbitParams, ORBIT_SEGMENTS);

        const orbitEntity = viewer.entities.add({
          id: `comet-orbit-${idx}`,
          polyline: {
            positions,
            width: 1.9,
            arcType: ArcType.NONE,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.15,
              color: ORBIT_COLOR.withAlpha(0.7),
            }),
          },
        });
        orbitEntitiesRef.current.push(orbitEntity as any);

        const sampled = makeSampledOrbitPosition(orbitParams, now, 12 * 3600, 220);
        const colorHex = pickColor(idx);

        const pt = viewer.entities.add({
          id: `comet-point-${idx}`,
          position: sampled,
          point: {
            pixelSize: 13,
            color: Color.fromCssColorString(colorHex),
            outlineColor: Color.WHITE.withAlpha(0.95),
            outlineWidth: 2,
            scaleByDistance: new NearFarScalar(1.0e6, 1.0, 3.0e7, 0.65),
          },
        });

        // CRISP billboard label
        addCrispBillboardLabel(pt as Entity, (orbitParams.name || "Comet").trim(), colorHex);

        pointEntitiesRef.current.push(pt as any);
        cometEntitiesRef.current.push({
          point: pt as Entity,
          orbit: orbitParams,
          index: idx,
        });
      });
    }

    // Click picking (recreate each rebuild)
    if (clickHandlerRef.current && !clickHandlerRef.current.isDestroyed()) {
      clickHandlerRef.current.destroy();
    }
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      if (!picked || !picked.id) return;
      const id: string = picked.id.id;
      if (id?.startsWith?.("asteroid-point-")) {
        const idx = parseInt(id.split("-").pop() || "", 10);
        const entry = asteroidEntitiesRef.current[idx];
        if (entry && onSelectAsteroid) onSelectAsteroid(entry.neo, idx);
      } else if (id?.startsWith?.("comet-point-")) {
        const idx = parseInt(id.split("-").pop() || "", 10);
        const entry = cometEntitiesRef.current.find((c) => c.index === idx);
        if (entry && onSelectComet) onSelectComet(entry.orbit, idx);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
      if (!handler.isDestroyed()) handler.destroy();
    };
  }, [neos, mode, scaledCometOrbits, onSelectAsteroid, onSelectComet]);

  return (
    <div
      ref={cesiumContainerRef}
      className="absolute top-0 left-0 h-full w-full"
    />
  );
};

export default CesiumGlobe;
