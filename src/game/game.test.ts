import { describe, expect, it } from "vitest";
import {
  COLS,
  ROWS,
  blastArea,
  createTileMaker,
  findGroup,
  hasMove,
  popAndRefill,
  shuffleBoard,
} from "./board";
import { settle, startLevel, tap } from "./game";
import { LEVELS } from "./levels";
import type { Board, Cell, GameState, Rng, Tile } from "./types";

/** Small seeded generator (mulberry32) so failures can be reproduced. */
function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A board with no two neighbours alike, with `edit` applied on top. */
function boardOf(edit: (set: (row: number, col: number, tile: Partial<Tile>) => void) => void) {
  let id = 1000;
  const board: Board = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      id: id++,
      color: (row + col) % 2 === 0 ? 2 : 3,
      kind: "bubble" as const,
    })),
  );
  edit((row, col, tile) => {
    board[row][col] = { ...board[row][col], ...tile };
  });
  return board;
}

function stateWith(board: Board, overrides: Partial<GameState> = {}): GameState {
  return { ...startLevel(0, 1, seeded(1)), board, nextTileId: 5000, ...overrides };
}

const ids = (board: Board) => board.flat().map((t) => t.id);

describe("board", () => {
  it("finds connected same-colour bubbles only", () => {
    const board = boardOf((set) => {
      set(0, 0, { color: 0 });
      set(0, 1, { color: 0 });
      set(1, 1, { color: 0 });
      set(3, 3, { color: 0 });
    });
    expect(findGroup(board, { row: 0, col: 0 })).toHaveLength(3);
  });

  it("does not spread through a star", () => {
    const board = boardOf((set) => {
      set(0, 0, { color: 0 });
      set(0, 1, { color: -1, kind: "star" });
      set(0, 2, { color: 0 });
    });
    expect(findGroup(board, { row: 0, col: 0 })).toHaveLength(1);
  });

  it("trims the star blast at corners", () => {
    expect(blastArea({ row: 0, col: 0 })).toHaveLength(4);
    expect(blastArea({ row: 3, col: 3 })).toHaveLength(9);
  });

  it("drops tiles and refills from the top", () => {
    const board = boardOf(() => {});
    const above = board[ROWS - 2][0];
    const tiles = createTileMaker(4, 5000, seeded(2));
    const next = popAndRefill(board, [{ row: ROWS - 1, col: 0 }], null, tiles);
    expect(next[ROWS - 1][0]).toBe(above);
    expect(next[0][0].id).toBe(5000);
    expect(new Set(ids(next)).size).toBe(ROWS * COLS);
  });

  it("sees when no move is left, and shuffling fixes it", () => {
    const stuck = boardOf(() => {});
    expect(hasMove(stuck)).toBe(false);
    const tiles = createTileMaker(4, 5000, seeded(3));
    const shuffled = shuffleBoard(stuck, tiles, seeded(4));
    expect(hasMove(shuffled)).toBe(true);
    expect(ids(shuffled).sort()).toEqual(ids(stuck).sort());
  });

  it("counts a star as a move", () => {
    expect(hasMove(boardOf((set) => set(4, 4, { color: -1, kind: "star" })))).toBe(true);
  });
});

describe("tap", () => {
  it("shakes a lone bubble without using a move", () => {
    const state = stateWith(boardOf(() => {}));
    expect(tap(state, { row: 0, col: 0 }).type).toBe("shake");
  });

  it("pops a group, uses one move and counts the goal", () => {
    const board = boardOf((set) => {
      set(0, 0, { color: 0 });
      set(0, 1, { color: 0 });
    });
    const state = stateWith(board, { moves: 20, goals: { 0: 12, 1: 12 } });
    const result = tap(state, { row: 0, col: 0 }, seeded(5));
    if (result.type !== "pop") throw new Error("expected a pop");
    expect(result.poppedIds).toHaveLength(2);
    expect(result.state.moves).toBe(19);
    expect(result.state.goals).toEqual({ 0: 10, 1: 12 });
  });

  it("makes a star where you tapped when 6 or more pop", () => {
    const board = boardOf((set) => {
      for (let col = 0; col < 6; col++) set(ROWS - 1, col, { color: 0 });
    });
    const result = tap(stateWith(board), { row: ROWS - 1, col: 2 }, seeded(6));
    if (result.type !== "pop") throw new Error("expected a pop");
    expect(result.state.board[ROWS - 1][2].kind).toBe("star");
    expect(result.effect).toBe("makeStar");
  });

  it("makes no star for 5", () => {
    const board = boardOf((set) => {
      for (let col = 0; col < 5; col++) set(ROWS - 1, col, { color: 0 });
    });
    const result = tap(stateWith(board), { row: ROWS - 1, col: 2 }, seeded(7));
    if (result.type !== "pop") throw new Error("expected a pop");
    expect(result.state.board.flat().some((t) => t.kind === "star")).toBe(false);
  });

  it("blasts 3x3 with a star, and blasted bubbles count towards goals", () => {
    const board = boardOf((set) => {
      set(3, 3, { color: -1, kind: "star" });
      set(2, 2, { color: 0 });
    });
    const state = stateWith(board, { goals: { 0: 5 } });
    const result = tap(state, { row: 3, col: 3 }, seeded(8));
    if (result.type !== "pop") throw new Error("expected a pop");
    expect(result.poppedIds).toHaveLength(9);
    expect(result.effect).toBe("blast");
    expect(result.state.goals[0]).toBe(4);
    expect(result.state.board.flat().some((t) => t.kind === "star")).toBe(false);
  });

  it("never lets a goal go below zero", () => {
    const board = boardOf((set) => {
      set(0, 0, { color: 0 });
      set(0, 1, { color: 0 });
    });
    const result = tap(stateWith(board, { goals: { 0: 1 } }), { row: 0, col: 0 }, seeded(9));
    if (result.type !== "pop") throw new Error("expected a pop");
    expect(result.state.goals[0]).toBe(0);
  });

  it("ignores taps once the level is over", () => {
    const state = stateWith(boardOf(() => {}), { status: "won" });
    expect(tap(state, { row: 0, col: 0 }).type).toBe("ignored");
  });
});

describe("settle", () => {
  it("wins when every goal is met, even on the last move", () => {
    const state = stateWith(boardOf(() => {}), { goals: { 0: 0 }, moves: 0 });
    expect(settle(state).status).toBe("won");
  });

  it("loses when moves run out with goals left", () => {
    const state = stateWith(boardOf(() => {}), { goals: { 0: 1 }, moves: 0 });
    expect(settle(state).status).toBe("lost");
  });

  it("reshuffles a stuck board and keeps playing", () => {
    const state = stateWith(boardOf(() => {}), { goals: { 0: 1 }, moves: 5 });
    const next = settle(state, seeded(10));
    expect(next.status).toBe("playing");
    expect(hasMove(next.board)).toBe(true);
  });
});

describe("levels", () => {
  /** Plays like someone not thinking hard: any group of a colour still needed. */
  function casualMove(state: GameState, rng: Rng): Cell {
    const all: Cell[] = [];
    const wanted: Cell[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = state.board[row][col];
        const isStar = tile.kind === "star";
        if (!isStar && findGroup(state.board, { row, col }).length < 2) continue;
        all.push({ row, col });
        if (isStar || state.goals[tile.color] > 0) wanted.push({ row, col });
      }
    }
    const pool = wanted.length > 0 ? wanted : all;
    return pool[Math.floor(rng() * pool.length)];
  }

  function casualGameWon(levelIndex: number, rng: Rng): boolean {
    let state = startLevel(levelIndex, 1, rng);
    while (state.status === "playing") {
      const result = tap(state, casualMove(state, rng), rng);
      if (result.type !== "pop") throw new Error("expected a pop");
      state = settle(result.state, rng);
    }
    return state.status === "won";
  }

  it.each(LEVELS.map((_, i) => i))("a casual player usually beats level index %i", (levelIndex) => {
    const rng = seeded(100 + levelIndex);
    const games = 200;
    const wins = Array.from({ length: games }, () => casualGameWon(levelIndex, rng)).filter(Boolean);
    expect(wins.length / games).toBeGreaterThan(0.7);
  });
});
