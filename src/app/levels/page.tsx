"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Boba, FlaskTree, SpicySock } from "@/components/Doodles";
import { useGame } from "@/components/GameProvider";
import { config } from "@/config";
import { LEVELS } from "@/game/levels";

/** Where each level's bauble hangs on the tree, in percent. */
const SPOTS = [
  { left: 50, top: 28 },
  { left: 36, top: 51 },
  { left: 64, top: 49 },
  { left: 25, top: 75 },
  { left: 75, top: 73 },
];

function Tree() {
  return (
    <svg viewBox="0 0 300 360" aria-hidden className="absolute inset-0 size-full">
      <rect x="132" y="306" width="36" height="42" fill="#5a2e1a" />
      <path fill="#14562d" d="M150 190L286 322C210 340 90 340 14 322Z" />
      <path fill="#1d7a3a" d="M150 104L256 226C196 244 104 244 44 226Z" />
      <path fill="#26964a" d="M150 36L222 134C184 150 116 150 78 134Z" />
      <g fill="#fff">
        <path d="M150 36L172 66C162 72 158 64 150 70C142 64 138 72 128 66Z" />
        <path d="M44 226C52 216 58 224 64 216C60 230 54 232 44 226Z M256 226C248 216 242 224 236 216C240 230 246 232 256 226Z" />
        <path d="M14 322C24 310 32 320 40 310C36 328 26 330 14 322Z M286 322C276 310 268 320 260 310C264 328 274 330 286 322Z" />
      </g>
      <path
        fill="#f3c969"
        stroke="#fff3c4"
        strokeWidth="2"
        d="M150 6L158 26L180 27L163 40L169 61L150 49L131 61L137 40L120 27L142 26Z"
      />
      <rect x="62" y="322" width="44" height="30" rx="3" fill="#c4183a" />
      <rect x="80" y="322" width="8" height="30" fill="#f3c969" />
      <FlaskTree x="192" y="296" width="42" height="58" />
    </svg>
  );
}

export default function LevelsPage() {
  const router = useRouter();
  const { game, pickLevel } = useGame();

  return (
    <section className="flex h-full w-full flex-col items-center gap-2">
      <h1 className="script-title shrink-0 text-[2.8rem] text-gold">{config.levels.title}</h1>
      <div
        className="relative aspect-[300/360]"
        style={{ width: "min(100%, calc((100dvh - 190px) * 300 / 360))" }}
      >
        <Tree />
        <SpicySock className="pointer-events-none absolute top-[3%] left-[1%] w-[17%] -rotate-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
        <Boba className="pointer-events-none absolute top-[6%] right-[4%] w-[11%] rotate-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
        {LEVELS.map((_, i) => (
          <motion.button
            key={i}
            aria-label={`Level ${i + 1}`}
            aria-current={game?.levelIndex === i ? "true" : undefined}
            className={`ornament absolute flex aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 items-center justify-center font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] color-${i} ${game?.levelIndex === i ? "animate-ring" : ""}`}
            style={{ left: `${SPOTS[i].left}%`, top: `${SPOTS[i].top}%`, fontSize: "clamp(1.1rem, 6vw, 1.7rem)" }}
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              pickLevel(i);
              router.push("/play");
            }}
          >
            {i + 1}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
