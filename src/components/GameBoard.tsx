"use client";

import { AnimatePresence, motion } from "framer-motion";
import { COLS, ROWS } from "@/game/board";
import type { Tile } from "@/game/types";
import { GlowBuddy } from "./Doodles";
import { useGame } from "./GameProvider";
import { Holly } from "./Holly";
import { SnowCap } from "./SnowCap";

const COLOR_NAMES = ["Red", "Green", "Gold", "Blue", "Purple"];
const FALL = { duration: 0.34, ease: [0.3, 1.35, 0.6, 1] } as const;
const POP = { duration: 0.2 } as const;

const percent = (cells: number) => `${cells * 100}%`;

export function GameBoard() {
  const { shownBoard, poppingIds, shake, attempt, tapCell } = useGame();

  return (
    <div
      className="relative"
      style={{
        width: `min(100%, calc((100dvh - 250px) * ${COLS} / ${ROWS}))`,
        aspectRatio: `${COLS} / ${ROWS}`,
      }}
    >
      <SnowCap />
      <Holly className="absolute -top-4 -left-2 z-10 w-12" />
      <GlowBuddy className="absolute -top-[30px] right-6 z-10 w-[26px]" />
      <div className="absolute inset-0 overflow-hidden rounded-[18px] border-2 border-gold/40 bg-bg/70 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-1.5">
        {/* initial={false}: a fresh board appears in place; only refills fall in. */}
        <AnimatePresence key={attempt} initial={false}>
          {shownBoard.flatMap((tiles, row) =>
            tiles.map((tile, col) => {
              const popping = poppingIds.has(tile.id);
              return (
                <motion.button
                  key={tile.id}
                  type="button"
                  data-own-sound
                  aria-label={tile.kind === "star" ? "Star" : `${COLOR_NAMES[tile.color]} bubble`}
                  className="absolute top-0 left-0"
                  style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
                  initial={
                    tile.kind === "star"
                      ? { x: percent(col), y: percent(row), scale: 0 }
                      : { x: percent(col), y: percent(row - ROWS) }
                  }
                  animate={{
                    x: percent(col),
                    y: percent(row),
                    scale: popping ? 1.35 : 1,
                    opacity: popping ? 0 : 1,
                  }}
                  transition={popping ? POP : FALL}
                  onClick={() => tapCell({ row, col })}
                >
                  <Bubble
                    tile={tile}
                    shakeKey={shake?.tileId === tile.id ? shake.nonce : undefined}
                  />
                </motion.button>
              );
            }),
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

function Bubble({ tile, shakeKey }: { tile: Tile; shakeKey?: number }) {
  if (tile.kind === "star") return <span className="bubble bubble-star animate-glow">★</span>;
  // A new key remounts the bubble, which replays the shake on repeat taps.
  return (
    <span
      key={shakeKey ?? "still"}
      className={`bubble color-${tile.color} ${shakeKey === undefined ? "" : "animate-shake"}`}
    />
  );
}
