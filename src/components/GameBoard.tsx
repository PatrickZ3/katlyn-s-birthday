"use client";

import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useRef } from "react";
import { COLS, ROWS } from "@/game/board";
import type { Cell, Tile } from "@/game/types";
import { fireSparks } from "./Confetti";
import { GlowBuddy } from "./Doodles";
import { CHAIN_WAVE_MS, type MoveFx, useGame } from "./GameProvider";
import { Holly } from "./Holly";
import { SnowCap } from "./SnowCap";

const COLOR_NAMES = ["Red", "Green", "Gold", "Blue", "Purple"];
const FALL = { duration: 0.34, ease: [0.3, 1.35, 0.6, 1] } as const;
const POP = { duration: 0.2 } as const;

const percent = (cells: number) => `${cells * 100}%`;
const WAVE_S = CHAIN_WAVE_MS / 1000;

/** Where a cell's middle is, as a percentage of the board. */
const centerOf = ({ row, col }: Cell) => ({
  left: `${((col + 0.5) / COLS) * 100}%`,
  top: `${((row + 0.5) / ROWS) * 100}%`,
});

export function GameBoard() {
  const { shownBoard, poppingIds, popWaves, fx, shake, attempt, tapCell } = useGame();
  const [board, animate] = useAnimate<HTMLDivElement>();
  const tiles = useRef<HTMLDivElement>(null);

  // Sparks and a board shake for each star that goes off, and a little sparkle for a new star.
  useEffect(() => {
    if (!fx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sparksAt = (cell: Cell, count: number, power: number) => {
      const rect = tiles.current?.getBoundingClientRect();
      if (!rect) return;
      fireSparks(
        {
          x: rect.left + ((cell.col + 0.5) / COLS) * rect.width,
          y: rect.top + ((cell.row + 0.5) / ROWS) * rect.height,
        },
        count,
        power,
      );
    };

    if (fx.effect === "makeStar") sparksAt(fx.cell, 16, 0.7);
    for (const blast of fx.blasts) {
      const chained = blast.wave > 0;
      timers.push(
        setTimeout(() => {
          sparksAt(blast, chained ? 46 : 24, chained ? 1.7 : 1);
          const push = chained ? 9 : 4;
          void animate(
            board.current,
            { x: [0, -push, push, -push / 2, push / 2, 0], y: [0, push / 2, -push / 2, 0] },
            { duration: chained ? 0.45 : 0.3 },
          );
        }, blast.wave * CHAIN_WAVE_MS),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [animate, board, fx]);

  return (
    <div
      ref={board}
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
      <div ref={tiles} className="absolute inset-1.5">
        {/* initial={false}: a fresh board appears in place; only refills fall in. */}
        <AnimatePresence key={attempt} initial={false}>
          {shownBoard.flatMap((tiles, row) =>
            tiles.map((tile, col) => {
              const popping = poppingIds.has(tile.id);
              const popDelay = (popWaves.get(tile.id) ?? 0) * WAVE_S;
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
                  transition={popping ? { ...POP, delay: popDelay } : FALL}
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
        {fx && <MoveEffects key={fx.id} fx={fx} />}
      </div>
      </div>
    </div>
  );
}

/** Shockwaves and flashes for the last move, drawn over the tiles. */
function MoveEffects({ fx }: { fx: MoveFx }) {
  const chainSize = fx.blasts.length;
  const lastWave = Math.max(0, ...fx.blasts.map((b) => b.wave));

  return (
    <div className="pointer-events-none absolute inset-0">
      {fx.effect === "makeStar" && (
        <motion.span
          className="blast-ring absolute aspect-square w-[22%] -translate-1/2"
          style={centerOf(fx.cell)}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      {fx.blasts.map((blast) => {
        const size = `${((blast.radius * 2 + 1.6) / COLS) * 100}%`;
        const delay = blast.wave * WAVE_S;
        const chained = blast.wave > 0;
        const place = { ...centerOf(blast), width: size };
        return (
          <span key={`${blast.row}-${blast.col}`}>
            <motion.span
              className="blast-flash absolute aspect-square -translate-1/2"
              style={place}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 1.15], opacity: [0, 1, 0] }}
              transition={{ duration: chained ? 0.5 : 0.38, delay, times: [0, 0.35, 1] }}
            />
            <motion.span
              className={`blast-ring absolute aspect-square -translate-1/2 ${chained ? "blast-ring-big" : ""}`}
              style={place}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.25], opacity: [1, 0] }}
              transition={{ duration: chained ? 0.6 : 0.45, delay, ease: "easeOut" }}
            />
          </span>
        );
      })}

      {chainSize > 1 && (
        <motion.div
          className="absolute inset-x-0 top-[38%] text-center font-script text-[clamp(2.6rem,12vw,3.6rem)] text-gold [text-shadow:0_2px_0_#7a0f22,0_0_18px_rgba(255,200,90,0.9)]"
          initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
          animate={{ scale: [0.3, 1.2, 1, 1], opacity: [0, 1, 1, 0], rotate: [-8, 3, 0, 0] }}
          transition={{ duration: 1.3, delay: lastWave * WAVE_S, times: [0, 0.2, 0.35, 1] }}
        >
          Chain ×{chainSize}!
        </motion.div>
      )}
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
