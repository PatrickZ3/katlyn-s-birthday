import type { Level } from "./types";

// goals: colour index -> how many to pop. 0 red, 1 green, 2 gold, 3 blue, 4 purple
// After changing these, run `npm test`: it checks a casual player can still win.
export const LEVELS: Level[] = [
  { colors: 4, moves: 20, goals: { 0: 10, 1: 10 } },
  { colors: 4, moves: 20, goals: { 0: 12, 2: 12, 3: 10 } },
  { colors: 5, moves: 26, goals: { 1: 12, 2: 12, 4: 10 } },
  { colors: 5, moves: 26, goals: { 0: 12, 1: 12, 3: 12, 4: 10 } },
  { colors: 5, moves: 30, goals: { 0: 13, 1: 13, 2: 13, 3: 13, 4: 13 } },
];
