"use client";

import { useEffect, useRef } from "react";

/**
 * Confetti and sparks, drawn on one canvas above the page (but under the menu).
 * Call fireConfetti, rainConfetti or fireSparks from anywhere. The canvas only
 * animates while something is flying, so it costs nothing the rest of the time.
 * With "reduce motion" turned on in the phone's settings, nothing is drawn.
 */

const CONFETTI_COLORS = ["#e0283f", "#2f8f4e", "#ffd27a", "#fff8ee", "#c4183a", "#7fd39a"];
const SPARK_COLORS = ["255,214,120", "255,245,220", "255,150,90"];

type Shape = "strip" | "square" | "dot" | "star";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  flip: number;
  flipSpeed: number;
  color: string;
  shape: Shape;
  /** Seconds left. */
  life: number;
  spark: boolean;
};

type Point = { x: number; y: number };

let add: ((pieces: Piece[]) => void) | null = null;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function confettiPiece(x: number, y: number, vx: number, vy: number): Piece {
  return {
    x,
    y,
    vx,
    vy,
    size: rand(6, 11),
    spin: rand(-8, 8),
    angle: rand(0, Math.PI * 2),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(6, 14),
    color: pick(CONFETTI_COLORS),
    shape: pick(["strip", "strip", "square", "dot", "star"] as const),
    life: rand(4, 6),
    spark: false,
  };
}

/** A burst of confetti from `origin` (screen pixels), or the middle of the screen. */
export function fireConfetti(count: number, origin?: Point) {
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  add?.(
    Array.from({ length: count }, () => {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(250, 900);
      return confettiPiece(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 350);
    }),
  );
}

/** Confetti falling from the top of the screen. */
export function rainConfetti(count: number) {
  add?.(
    Array.from({ length: count }, () =>
      confettiPiece(rand(0, window.innerWidth), rand(-window.innerHeight * 0.6, -10), rand(-40, 40), rand(40, 160)),
    ),
  );
}

/** Glowing sparks flying out of `origin` (screen pixels). `power` makes them faster and bigger. */
export function fireSparks(origin: Point, count: number, power = 1) {
  add?.(
    Array.from({ length: count }, () => {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(120, 420) * power;
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1.4, 3) * Math.sqrt(power),
        spin: 0,
        angle: 0,
        flip: 0,
        flipSpeed: 0,
        color: pick(SPARK_COLORS),
        shape: "dot" as const,
        life: rand(0.35, 0.7),
        spark: true,
      };
    }),
  );
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let pieces: Piece[] = [];
    let frameId = 0;
    let last = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      // Cap the step so a hidden tab doesn't fling everything at once.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bottom = window.innerHeight + 40;

      for (const p of pieces) {
        p.life -= dt;
        if (p.spark) {
          p.vx *= 1 - 3 * dt;
          p.vy = p.vy * (1 - 3 * dt) + 300 * dt;
        } else {
          // Air drag, gravity and a little flutter, like paper.
          p.vx *= 1 - 1.6 * dt;
          p.vy = p.vy * (1 - 1.6 * dt) + 520 * dt;
          p.vx += Math.sin(p.flip) * 30 * dt;
          p.angle += p.spin * dt;
          p.flip += p.flipSpeed * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > bottom) p.life = 0;
        if (p.life <= 0) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.spark) {
          const alpha = Math.min(1, p.life * 2.5);
          ctx.fillStyle = `rgba(${p.color},${alpha})`;
          ctx.shadowColor = `rgba(${p.color},1)`;
          ctx.shadowBlur = p.size * 5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = Math.min(1, p.life);
          ctx.rotate(p.angle);
          // Squashing one way and the other makes it look like it's tumbling.
          ctx.scale(1, Math.cos(p.flip));
          ctx.fillStyle = p.color;
          const s = p.size;
          if (p.shape === "strip") ctx.fillRect(-s / 2, -s / 5, s, s / 2.5);
          else if (p.shape === "square") ctx.fillRect(-s / 3, -s / 3, s / 1.5, s / 1.5);
          else if (p.shape === "dot") {
            ctx.beginPath();
            ctx.arc(0, 0, s / 3, 0, Math.PI * 2);
            ctx.fill();
          } else drawStar(ctx, s / 1.6);
        }
        ctx.restore();
      }

      pieces = pieces.filter((p) => p.life > 0);
      frameId = pieces.length > 0 ? requestAnimationFrame(frame) : 0;
      if (!frameId) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    add = (more) => {
      pieces.push(...more);
      if (!frameId) {
        last = performance.now();
        frameId = requestAnimationFrame(frame);
      }
    };

    return () => {
      add = null;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-35 size-full" aria-hidden />;
}
