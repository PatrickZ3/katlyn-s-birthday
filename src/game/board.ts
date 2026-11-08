import type { Board, Cell, Rng, Tile } from "./types";

export const COLS = 7;
export const ROWS = 8;
/** Pop this many at once to make a star. */
export const STAR_SIZE = 6;
/** The smallest group that can be popped. */
export const MIN_GROUP = 2;

/** Hands out new tiles with increasing ids. */
export type TileMaker = {
  bubble: () => Tile;
  star: () => Tile;
  nextId: () => number;
};

export function createTileMaker(colors: number, firstId: number, rng: Rng): TileMaker {
  let id = firstId;
  return {
    bubble: () => ({ id: id++, color: Math.floor(rng() * colors), kind: "bubble" }),
    star: () => ({ id: id++, color: -1, kind: "star" }),
    nextId: () => id,
  };
}

export function hasMove(board: Board): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = board[row][col];
      if (tile.kind === "star") return true;
      const right = board[row][col + 1];
      const below = board[row + 1]?.[col];
      if (right?.kind === "bubble" && right.color === tile.color) return true;
      if (below?.kind === "bubble" && below.color === tile.color) return true;
    }
  }
  return false;
}

/** A new random board with at least one move. */
export function createBoard(tiles: TileMaker): Board {
  for (;;) {
    const board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => tiles.bubble()),
    );
    if (hasMove(board)) return board;
  }
}

/** Rearranges the same tiles until there's a move, or deals a new board if that fails. */
export function shuffleBoard(board: Board, tiles: TileMaker, rng: Rng): Board {
  const all = board.flat();
  for (let tries = 0; tries < 50; tries++) {
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const shuffled = Array.from({ length: ROWS }, (_, row) =>
      all.slice(row * COLS, (row + 1) * COLS),
    );
    if (hasMove(shuffled)) return shuffled;
  }
  return createBoard(tiles);
}

/** The connected bubbles of the same colour as `start`, including `start`. */
export function findGroup(board: Board, start: Cell): Cell[] {
  const color = board[start.row][start.col].color;
  const seen = new Set<number>();
  const group: Cell[] = [];
  const stack: Cell[] = [start];

  while (stack.length > 0) {
    const { row, col } = stack.pop()!;
    const key = row * COLS + col;
    if (seen.has(key)) continue;
    seen.add(key);
    const tile = board[row]?.[col];
    if (!tile || tile.kind !== "bubble" || tile.color !== color) continue;
    group.push({ row, col });
    stack.push(
      { row: row + 1, col },
      { row: row - 1, col },
      { row, col: col + 1 },
      { row, col: col - 1 },
    );
  }
  return group;
}

/** The 3x3 area a star at `center` clears, trimmed at the board edges. */
export function blastArea({ row, col }: Cell): Cell[] {
  const cells: Cell[] = [];
  for (let y = row - 1; y <= row + 1; y++) {
    for (let x = col - 1; x <= col + 1; x++) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) cells.push({ row: y, col: x });
    }
  }
  return cells;
}

/**
 * Removes `cells`, optionally leaves a star at `starAt`, drops everything
 * down and fills each column from the top.
 */
export function popAndRefill(
  board: Board,
  cells: Cell[],
  starAt: Cell | null,
  tiles: TileMaker,
): Board {
  const grid: (Tile | null)[][] = board.map((row) => [...row]);
  for (const { row, col } of cells) grid[row][col] = null;
  if (starAt) grid[starAt.row][starAt.col] = tiles.star();

  const result: Board = Array.from({ length: ROWS }, () => new Array<Tile>(COLS));
  for (let col = 0; col < COLS; col++) {
    let write = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      const tile = grid[row][col];
      if (tile) result[write--][col] = tile;
    }
    while (write >= 0) result[write--][col] = tiles.bubble();
  }
  return result;
}
