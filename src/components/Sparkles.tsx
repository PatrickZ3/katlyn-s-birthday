"use client";

import { useEffect, useRef } from "react";

const HUES = ["255,214,120", "255,90,110", "255,245,230"];

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  sway: number;
  twinkle: number;
  color: string;
  life: number;
  snow: boolean;
};

let burst: ((count: number) => void) | null = null;
let queuedBurst = 0;

/** Throws a shower of sparkles. Safe to call before the canvas has mounted. */
export function burstSparkles(count: number) {
  if (burst) burst(count);
  else queuedBurst += count;
}

export function Sparkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frameId = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
    };

    const make = (isBurst: boolean): Particle => ({
      x: Math.random() * width,
      y: isBurst ? height * 0.45 + (Math.random() - 0.5) * height * 0.2 : Math.random() * height,
      r: (Math.random() * 1.8 + 0.8) * (width / window.innerWidth),
      vy: isBurst ? (Math.random() - 0.7) * 6 : Math.random() * 0.5 + 0.2,
      vx: isBurst ? (Math.random() - 0.5) * 6 : 0,
      sway: Math.random() * Math.PI * 2,
      twinkle: Math.random() * Math.PI * 2,
      color: HUES[Math.floor(Math.random() * HUES.length)],
      life: isBurst ? 1 : Infinity,
      snow: false,
    });

    const makeSnow = (): Particle => ({
      ...make(false),
      r: (Math.random() * 2 + 1.2) * (width / window.innerWidth),
      vy: Math.random() * 0.7 + 0.45,
      color: "255,255,255",
      snow: true,
    });

    resize();
    window.addEventListener("resize", resize);
    let particles = [
      ...Array.from({ length: reduce ? 25 : 45 }, () => make(false)),
      ...Array.from({ length: reduce ? 30 : 70 }, makeSnow),
    ];

    const frame = () => {
      const scale = width / window.innerWidth;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.twinkle += 0.05;
        p.sway += 0.01;
        p.y += p.vy * scale;
        p.x += (p.vx + Math.sin(p.sway) * 0.3) * scale;
        if (p.life !== Infinity) {
          p.vy += 0.08;
          p.vx *= 0.98;
          p.life -= 0.008;
        } else if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        const twinkle = p.snow ? 0.8 : 0.5 + Math.sin(p.twinkle) * 0.5;
        const alpha = Math.max(0, twinkle * Math.min(1, p.life));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        ctx.shadowColor = `rgba(${p.color},1)`;
        ctx.shadowBlur = p.snow ? 0 : p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      particles = particles.filter((p) => p.life > 0);
      if (!reduce) frameId = requestAnimationFrame(frame);
    };
    frame();

    burst = (count) => {
      for (let i = 0; i < count; i++) particles.push(make(true));
      if (reduce) frame();
    };
    if (queuedBurst > 0) {
      burst(queuedBurst);
      queuedBurst = 0;
    }

    return () => {
      burst = null;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-1 size-full" aria-hidden />;
}
