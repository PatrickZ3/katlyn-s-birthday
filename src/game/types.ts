/** Returns a number in [0, 1), like Math.random. Pass a seeded one in tests. */
export type Rng = () => number;

/** Colour index: 0 red, 1 green, 2 gold, 3 blue, 4 purple. Stars use -1. */
export type Color = number;

export type Tile = {
  id: number;
  color: Color;
  kind: "bubble" | "star";
};

export type Cell = { row: number; col: number };

/** One star going off. `wave` 0 is the tapped star; each chained star is one wave later. */
export type Blast = Cell & { radius: number; wave: number };

/** A cleared cell, and the wave it pops in. */
export type PoppedCell = Cell & { wave: number };

/** board[row][col]; row 0 is the top. */
export type Board = Tile[][];

/** Colour index -> how many are left to pop. */
export type Goals = Record<number, number>;

export type Level = {
  colors: number;
  moves: number;
  goals: Goals;
};

export type GameStatus = "playing" | "won" | "lost";

export type GameState = {
  levelIndex: number;
  board: Board;
  moves: number;
  goals: Goals;
  status: GameStatus;
  /** The id the next created tile will get, so React can track every tile. */
  nextTileId: number;
};

/**
 * What a pop did, so the display can react: a plain pop, a new star, a star
 * going off, or a star setting off other stars.
 */
export type PopEffect = "pop" | "makeStar" | "blast" | "chain";

export type TapResult =
  | { type: "ignored" }
  /** A lone bubble: nothing pops and no move is used. */
  | { type: "shake"; tileId: number }
  /** `state` has the tiles removed and the board refilled. Call `settle` once it has landed. */
  | {
      type: "pop";
      effect: PopEffect;
      poppedIds: number[];
      /** The wave each popped tile goes in, matching `poppedIds`. All 0 unless stars chain. */
      waves: number[];
      /** Every star that went off, in order. Empty for a plain pop. */
      blasts: Blast[];
      state: GameState;
    };
