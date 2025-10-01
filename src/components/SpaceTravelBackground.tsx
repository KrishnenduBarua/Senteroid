import React, { useEffect, useMemo, useRef } from "react";

/**
 * Programmatic canvas background (no image).
 * Fixed full-viewport canvas drawn with 2D context; parallax with scroll.
 */
type ScrollRef =
  | React.RefObject<Element>
  | React.MutableRefObject<Element | null>;

type Props = {
  scrollTargetRef?: ScrollRef;
  density?: [number, number, number];
};

type Star = { x: number; y: number; r: number; a: number };

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getScrollMetrics(target: Element | Window) {
  if (target instanceof Window) {
    return {
      scrollTop: target.scrollY || window.pageYOffset || 0,
      scrollHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
      clientHeight: window.innerHeight || 0,
    };
  } else {
    return {
      scrollTop: (target as Element).scrollTop,
      scrollHeight: (target as Element).scrollHeight,
      clientHeight: (target as Element).clientHeight,
    };
  }
}

export default function SpaceTravelBackground({
  scrollTargetRef,
  density = [700, 250, 80],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const layers = useMemo(() => {
    const rng = mulberry32(0xC0FFEE);
    const genLayer = (n: number, worldW: number, worldH: number, sizeRange: [number, number]) => {
      const [smin, smax] = sizeRange;
      const arr: Star[] = [];
      for (let i = 0; i < n; i++) {
        arr.push({
          x: rng() * worldW,
          y: rng() * worldH,
          r: smin + rng() * (smax - smin),
          a: 0.6 + rng() * 0.4,
        });
      }
      return arr;
    };
    const WORLD_W = 6000;
    const WORLD_H = 60000;
    return {
      WORLD_W,
      WORLD_H,
      small: genLayer(density[0], WORLD_W, WORLD_H, [0.4, 1.0]),
      medium: genLayer(density[1], WORLD_W, WORLD_H, [0.8, 1.8]),
      large: genLayer(density[2], WORLD_W, WORLD_H, [1.2, 2.6]),
    };
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const targetW = Math.max(1, Math.floor(cssW * dpr));
    const targetH = Math.max(1, Math.floor(cssH * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, cssH);
    grad.addColorStop(0, "#02030f");
    grad.addColorStop(0.5, "#060b2a");
    grad.addColorStop(1, "#09123d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);

    const target = (scrollTargetRef && scrollTargetRef.current) ? scrollTargetRef.current! : window;
    const sm = (target instanceof Window)
      ? { scrollTop: target.scrollY || 0, scrollHeight: document.documentElement.scrollHeight || 0, clientHeight: window.innerHeight || 0 }
      : { scrollTop: (target as Element).scrollTop, scrollHeight: (target as Element).scrollHeight, clientHeight: (target as Element).clientHeight };

    const maxScrollable = Math.max(1, sm.scrollHeight - sm.clientHeight);
    const progress = Math.max(0, Math.min(1, sm.scrollTop / maxScrollable));

    const pSmall = 0.25;
    const pMed = 0.5;
    const pLarge = 0.85;

    const worldYSmall = progress * layers.WORLD_H * pSmall;
    const worldYMed = progress * layers.WORLD_H * pMed;
    const worldYLarge = progress * layers.WORLD_H * pLarge;

    const drawLayer = (stars: Star[], offsetY: number, brightness: number) => {
      const ctx2 = ctx!;
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const localY = s.y - offsetY;
        if (localY > -20 && localY < cssH + 20) {
          const x = (s.x % (cssW + 40)) - 20;
          ctx2.globalAlpha = Math.min(1, Math.max(0, s.a * brightness));
          ctx2.beginPath();
          ctx2.arc(x, localY, s.r, 0, Math.PI * 2);
          ctx2.fillStyle = "#cfe8ff";
          ctx2.fill();
        }
      }
      ctx2.restore();
    };

    const wrap = (v: number, max: number) => {
      v = v % max;
      return v < 0 ? v + max : v;
    };

    drawLayer(layers.small, wrap(worldYSmall, layers.WORLD_H), 0.7);
    drawLayer(layers.medium, wrap(worldYMed, layers.WORLD_H), 0.9);
    drawLayer(layers.large, wrap(worldYLarge, layers.WORLD_H), 1.0);

    const neb = ctx.createRadialGradient(cssW * 0.7, cssH * 0.3, 10, cssW * 0.7, cssH * 0.3, cssW * 0.9);
    neb.addColorStop(0, "rgba(120,130,255,0.06)");
    neb.addColorStop(1, "rgba(10,15,40,0)");
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  const requestDraw = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  };

  useEffect(() => {
    const onResize = () => requestDraw();
    const targetEl =
      (scrollTargetRef && scrollTargetRef.current) || (window as unknown as EventTarget);
    const onScroll = () => requestDraw();

    window.addEventListener("resize", onResize, { passive: true });
    targetEl.addEventListener?.("scroll", onScroll as EventListener, { passive: true });

    requestDraw();

    return () => {
      window.removeEventListener("resize", onResize);
      targetEl.removeEventListener?.("scroll", onScroll as EventListener);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollTargetRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
