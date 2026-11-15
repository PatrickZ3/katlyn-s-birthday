import type { Blast, Board, Cell, PoppedCell, Rng, Tile } from "./types";

export const COLS = 7;
export const ROWS = 8;
/** Pop this many at once to make a star. */
export const STAR_SIZE = 6;
/** The smallest group that can be popped. */
export const MIN_GROUP = 2;
/** A tapped star clears 3x3 (radius 1). A star set off by another blast clears 5x5. */
export const STAR_RADIUS = 1;
export const CHAIN_RADIUS = 2;

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

/** The square a star at `center` clears (3x3 for radius 1), trimmed at the board edges. */
export function blastArea({ row, col }: Cell, radius = STAR_RADIUS): Cell[] {
  const cells: Cell[] = [];
  for (let y = row - radius; y <= row + radius; y++) {
    for (let x = col - radius; x <= col + radius; x++) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) cells.push({ row: y, col: x });
    }
  }
  return cells;
}

/**
 * Sets off the star at `start`. Any other star caught in a blast goes off
 * too, one wave later, with a bigger blast, and so on down the chain.
 * Every cleared cell comes with the wave it pops in, so the display can
 * ripple the chain outwards.
 */
export function blastChain(board: Board, start: Cell): { cells: PoppedCell[]; blasts: Blast[] } {
  const key = ({ row, col }: Cell) => row * COLS + col;
  const popped = new Map<number, PoppedCell>([[key(start), { ...start, wave: 0 }]]);
  const blasts: Blast[] = [];
  const queue: Blast[] = [{ ...start, radius: STAR_RADIUS, wave: 0 }];

  while (queue.length > 0) {
    const blast = queue.shift()!;
    blasts.push(blast);
    for (const cell of blastArea(blast, blast.radius)) {
      if (popped.has(key(cell))) continue;
      const isStar = board[cell.row][cell.col].kind === "star";
      // A caught star pops when it goes off, one wave later.
      const wave = isStar ? blast.wave + 1 : blast.wave;
      popped.set(key(cell), { ...cell, wave });
      if (isStar) queue.push({ ...cell, radius: CHAIN_RADIUS, wave });
    }
  }
  return { cells: [...popped.values()], blasts };
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
