import {
  MIN_GROUP,
  STAR_SIZE,
  blastChain,
  createBoard,
  createTileMaker,
  findGroup,
  hasMove,
  popAndRefill,
  shuffleBoard,
} from "./board";
import { LEVELS } from "./levels";
import type { Cell, GameState, Goals, PoppedCell, Rng, TapResult } from "./types";

export function isLastLevel(levelIndex: number): boolean {
  return levelIndex === LEVELS.length - 1;
}

export function startLevel(levelIndex: number, firstTileId = 1, rng: Rng = Math.random): GameState {
  const level = LEVELS[levelIndex];
  const tiles = createTileMaker(level.colors, firstTileId, rng);
  const board = createBoard(tiles);
  return {
    levelIndex,
    board,
    moves: level.moves,
    goals: { ...level.goals },
    status: "playing",
    nextTileId: tiles.nextId(),
  };
}

/** Plays a tap on `cell`. The result is final apart from win/lose, which `settle` decides. */
export function tap(state: GameState, cell: Cell, rng: Rng = Math.random): TapResult {
  if (state.status !== "playing") return { type: "ignored" };
  const tile = state.board[cell.row]?.[cell.col];
  if (!tile) return { type: "ignored" };

  const isStar = tile.kind === "star";
  const chain = isStar ? blastChain(state.board, cell) : null;
  const cells: PoppedCell[] = chain
    ? chain.cells
    : findGroup(state.board, cell).map((c) => ({ ...c, wave: 0 }));
  if (!isStar && cells.length < MIN_GROUP) return { type: "shake", tileId: tile.id };

  const goals: Goals = { ...state.goals };
  const popped = cells.map(({ row, col }) => state.board[row][col]);
  for (const { kind, color } of popped) {
    if (kind === "bubble" && goals[color] > 0) goals[color]--;
  }

  const tiles = createTileMaker(LEVELS[state.levelIndex].colors, state.nextTileId, rng);
  const makesStar = !isStar && cells.length >= STAR_SIZE;
  const board = popAndRefill(state.board, cells, makesStar ? cell : null, tiles);

  const blasts = chain?.blasts ?? [];
  return {
    type: "pop",
    effect: blasts.length > 1 ? "chain" : isStar ? "blast" : makesStar ? "makeStar" : "pop",
    poppedIds: popped.map((t) => t.id),
    waves: cells.map((c) => c.wave),
    blasts,
    state: { ...state, board, goals, moves: state.moves - 1, nextTileId: tiles.nextId() },
  };
}

/** Runs after a pop has landed: decides win or lose, and reshuffles a stuck board. */
export function settle(state: GameState, rng: Rng = Math.random): GameState {
  if (Object.values(state.goals).every((left) => left <= 0)) return { ...state, status: "won" };
  if (state.moves <= 0) return { ...state, status: "lost" };
  if (hasMove(state.board)) return state;

  const tiles = createTileMaker(LEVELS[state.levelIndex].colors, state.nextTileId, rng);
  const board = shuffleBoard(state.board, tiles, rng);
  return { ...state, board, nextTileId: tiles.nextId() };
}
