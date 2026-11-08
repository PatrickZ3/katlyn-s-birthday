"use client";

import { motion } from "framer-motion";
import { Bow } from "./Bow";

const LID_OPEN = { x: 46, y: -170, rotate: 26, opacity: 0 };

/** The big wrapped present. When `opening`, the lid flies off and light pours out. */
export function Present({ opening }: { opening: boolean }) {
  return (
    <svg viewBox="0 0 200 210" aria-hidden className="size-full overflow-visible">
      <defs>
        <pattern id="wrap" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="26" height="26" fill="#c4183a" />
          <rect width="13" height="26" fill="#a50f2b" />
        </pattern>
        <linearGradient id="ribbon" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#d39a1c" />
          <stop offset="0.5" stopColor="#ffe29a" />
          <stop offset="1" stopColor="#d39a1c" />
        </linearGradient>
        <linearGradient id="box-shade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id="beam" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor="#fff6d0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd97a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="200" rx="84" ry="8" fill="#000" opacity="0.45" />

      <motion.path
        d="M34 96L-30 -120H230L166 96Z"
        fill="url(#beam)"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      <rect x="28" y="92" width="144" height="106" rx="8" fill="url(#wrap)" />
      <rect x="88" y="92" width="24" height="106" fill="url(#ribbon)" />
      <rect x="28" y="92" width="144" height="106" rx="8" fill="url(#box-shade)" />
      <rect x="28" y="92" width="144" height="9" fill="#000" opacity="0.28" />

      <motion.g animate={opening ? LID_OPEN : undefined} transition={{ duration: 0.5, ease: "easeOut" }}>
        <rect x="18" y="64" width="164" height="36" rx="7" fill="url(#wrap)" />
        <rect x="88" y="64" width="24" height="36" fill="url(#ribbon)" />
        <rect x="18" y="64" width="164" height="36" rx="7" fill="url(#box-shade)" />
        <path
          fill="#fff"
          d="M20 72C20 64 28 62 36 62H164C174 62 180 64 180 72C176 80 168 79 163 73C156 81 146 80 140 73C132 80 122 80 116 73C108 79 98 80 92 73C84 80 74 80 68 73C60 80 50 79 44 73C36 81 24 79 20 72Z"
        />
        <Bow x="38" y="8" width="124" height="66" />
      </motion.g>
    </svg>
  );
}
