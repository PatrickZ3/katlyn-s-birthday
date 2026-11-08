"use client";

import { motion } from "framer-motion";

const SPARKS = [
  { angle: 0, size: 1.3 },
  { angle: 52, size: 0.8 },
  { angle: 105, size: 1.1 },
  { angle: 160, size: 0.7 },
  { angle: 212, size: 1.25 },
  { angle: 265, size: 0.8 },
  { angle: 318, size: 1 },
];

const centered = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
const FIELD = "min(165vw, 118dvh, 900px)";
const HALO = "min(96vw, 58dvh, 480px)";

/** Everything behind the present: a dimmed room, turning light, ripples and sparks. */
export function PresentGlow({ opening }: { opening: boolean }) {
  return (
    <div className={`pointer-events-none ${centered}`} style={{ width: FIELD, height: FIELD }}>
      {/* Darkens everything away from the present, so the eye goes to the middle. */}
      <div className="absolute -inset-[60%] bg-[radial-gradient(circle,transparent_14%,rgba(30,5,12,0.5)_46%)]" />

      <div className="absolute inset-0 animate-rays">
        <div className="present-rays size-full rounded-full" />
      </div>
      <div className="absolute inset-0 animate-rays-back">
        <div className="present-rays-soft size-full rounded-full" />
      </div>

      <div className={centered} style={{ width: HALO, height: HALO }}>
        <div className="size-full animate-halo rounded-full bg-[radial-gradient(circle,rgba(255,232,170,0.75)_0%,rgba(255,170,90,0.34)_34%,transparent_68%)]" />
      </div>

      {[0, 1.2, 2.4].map((delay) => (
        <div key={delay} className={centered} style={{ width: HALO, height: HALO }}>
          <div
            className="size-full animate-ripple rounded-full border-2 border-gold/60"
            style={{ animationDelay: `${delay}s` }}
          />
        </div>
      ))}

      <div className={`${centered} animate-orbit`} style={{ width: HALO, height: HALO }}>
        {SPARKS.map(({ angle, size }) => (
          <span
            key={angle}
            className="absolute top-1/2 left-1/2 -mt-3 -ml-2 text-gold"
            style={{ transform: `rotate(${angle}deg) translateY(calc(${HALO} * -0.46)) scale(${size})` }}
          >
            <span
              className="block animate-twinkle text-[1.2rem] leading-6"
              style={{ animationDelay: `${angle / 200}s` }}
            >
              ✦
            </span>
          </span>
        ))}
      </div>

      <motion.div
        className={`${centered} rounded-full bg-[radial-gradient(circle,#fff8e0_0%,#ffd98a_40%,#f7b34a_62%,transparent_74%)]`}
        style={{ width: HALO, height: HALO }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={opening ? { opacity: 1, scale: 5 } : undefined}
        transition={{ duration: 0.55, delay: 0.22, ease: "easeIn" }}
      />
    </div>
  );
}
