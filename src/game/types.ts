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

/** What a pop did, so the display can react: a plain pop, a new star, or a star going off. */
export type PopEffect = "pop" | "makeStar" | "blast";

export type TapResult =
  | { type: "ignored" }
  /** A lone bubble: nothing pops and no move is used. */
  | { type: "shake"; tileId: number }
  /** `state` has the tiles removed and the board refilled. Call `settle` once it has landed. */
  | { type: "pop"; effect: PopEffect; poppedIds: number[]; state: GameState };
