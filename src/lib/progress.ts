import { LEVELS } from "@/game/levels";

const KEY = "katlynLevel";
const MUTED_KEY = "katlynMuted";

/** The saved level index. Falls back to 0 if storage is blocked or the value is bad. */
export function loadLevel(): number {
  try {
    const level = JSON.parse(localStorage.getItem(KEY) ?? "0");
    return Number.isInteger(level) && level >= 0 && level < LEVELS.length ? level : 0;
  } catch {
    return 0;
  }
}

export function saveLevel(level: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(level));
  } catch {
    // Private browsing or full storage: the game still works, it just won't remember.
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, String(muted));
  } catch {
    // Same as saveLevel: the choice just won't be remembered.
  }
}
