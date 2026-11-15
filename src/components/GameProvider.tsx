"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playSfx } from "@/audio/engine";
import { isLastLevel, settle, startLevel, tap } from "@/game/game";
import type { Blast, Board, Cell, GameState, PopEffect } from "@/game/types";
import { loadLevel, saveLevel } from "@/lib/progress";
import { fireConfetti } from "./Confetti";
import { burstSparkles } from "./Sparkles";

const POP_MS = 220;
const FALL_MS = 360;
const FINALE_DELAY_MS = 600;
/** The gap between one star going off and the next one in a chain. */
export const CHAIN_WAVE_MS = 260;

/** What the board should show for the last move: shockwaves, a new star, and so on. */
export type MoveFx = {
  /** New for every move, so the board replays its effects. */
  id: number;
  effect: PopEffect;
  blasts: Blast[];
  /** Where she tapped. */
  cell: Cell;
};

type GameContextValue = {
  game: GameState | null;
  /** What's on screen. Trails `game.board` while tiles are popping. */
  shownBoard: Board;
  poppingIds: ReadonlySet<number>;
  /** Tile id -> which chain wave it pops in. Missing means wave 0. */
  popWaves: ReadonlyMap<number, number>;
  fx: MoveFx | null;
  shake: { tileId: number; nonce: number } | null;
  /** Changes on every fresh board, so the board can skip its entrance animation. */
  attempt: number;
  tapCell: (cell: Cell) => void;
  startSavedLevel: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  pickLevel: (levelIndex: number) => void;
  playAgain: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

const NO_IDS: ReadonlySet<number> = new Set();
const NO_WAVES: ReadonlyMap<number, number> = new Map();

/** Runs the plain-TypeScript game on a timer so pops and falls can be seen. */
export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [shownBoard, setShownBoard] = useState<Board>([]);
  const [poppingIds, setPoppingIds] = useState(NO_IDS);
  const [popWaves, setPopWaves] = useState(NO_WAVES);
  const [fx, setFx] = useState<MoveFx | null>(null);
  const fxId = useRef(0);
  const [shake, setShake] = useState<GameContextValue["shake"]>(null);
  const [attempt, setAttempt] = useState(0);

  const gameRef = useRef(game);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const show = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const begin = useCallback(
    (levelIndex: number) => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      busy.current = false;
      // Ids keep counting up so no tile from the last board is mistaken for a new one.
      const next = startLevel(levelIndex, gameRef.current?.nextTileId);
      show(next);
      setShownBoard(next.board);
      setPoppingIds(NO_IDS);
      setPopWaves(NO_WAVES);
      setFx(null);
      setShake(null);
      setAttempt((n) => n + 1);
    },
    [show],
  );

  // Storage only exists in the browser, so the first board is dealt after mounting.
  useEffect(() => begin(loadLevel()), [begin]);

  const finishMove = useCallback(() => {
    const next = settle(gameRef.current!);
    show(next);
    setShownBoard(next.board);

    if (next.status === "lost") playSfx("lose");
    if (next.status === "won") {
      playSfx("win");
      burstSparkles(80);
      fireConfetti(70, { x: window.innerWidth / 2, y: window.innerHeight * 0.45 });
      if (isLastLevel(next.levelIndex)) {
        saveLevel(0);
        timers.current.push(setTimeout(() => router.replace("/final"), FINALE_DELAY_MS));
      } else {
        saveLevel(next.levelIndex + 1);
      }
    }
    busy.current = false;
  }, [router, show]);

  const tapCell = useCallback(
    (cell: Cell) => {
      const current = gameRef.current;
      if (!current || busy.current) return;

      const result = tap(current, cell);
      if (result.type === "shake") {
        playSfx("shake");
        setShake((s) => ({ tileId: result.tileId, nonce: (s?.nonce ?? 0) + 1 }));
      }
      if (result.type !== "pop") return;

      busy.current = true;
      show(result.state);
      setPoppingIds(new Set(result.poppedIds));
      setPopWaves(new Map(result.poppedIds.map((id, i) => [id, result.waves[i]])));
      setFx({ id: ++fxId.current, effect: result.effect, blasts: result.blasts, cell });

      // Each wave of a chain booms a little after the last one.
      const lastWave = Math.max(0, ...result.waves);
      const chainMs = lastWave * CHAIN_WAVE_MS;
      if (result.blasts.length === 0) playSfx(result.effect, result.poppedIds.length);
      const sounds = new Set(result.blasts.map((b) => b.wave));
      timers.current = [...sounds].map((wave) =>
        setTimeout(() => playSfx(wave === 0 ? "blast" : "chain"), wave * CHAIN_WAVE_MS),
      );
      timers.current.push(
        setTimeout(() => {
          setShownBoard(result.state.board);
          setPoppingIds(NO_IDS);
          setPopWaves(NO_WAVES);
        }, POP_MS + chainMs),
        setTimeout(finishMove, POP_MS + chainMs + FALL_MS),
      );
    },
    [finishMove, show],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      shownBoard,
      poppingIds,
      popWaves,
      fx,
      shake,
      attempt,
      tapCell,
      startSavedLevel: () => begin(loadLevel()),
      restartLevel: () => begin(gameRef.current?.levelIndex ?? 0),
      nextLevel: () => begin((gameRef.current?.levelIndex ?? 0) + 1),
      pickLevel: (levelIndex) => {
        saveLevel(levelIndex);
        begin(levelIndex);
      },
      playAgain: () => {
        saveLevel(0);
        begin(0);
      },
    }),
    [attempt, begin, fx, game, popWaves, poppingIds, shake, shownBoard, tapCell],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
