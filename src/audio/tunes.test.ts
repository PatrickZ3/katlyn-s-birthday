import { describe, expect, it } from "vitest";
import { TUNES, noteToHz, parseNotes, tuneEvents } from "./tunes";

const beats = (notes: string) => parseNotes(notes).reduce((sum, n) => sum + n.beats, 0);

describe("tunes", () => {
  it("tunes A4 to 440 Hz", () => {
    expect(noteToHz("A4")).toBeCloseTo(440);
    expect(noteToHz("C4")).toBeCloseTo(261.63, 1);
    expect(noteToHz("F#4")).toBeCloseTo(369.99, 1);
  });

  it.each(TUNES.map((t) => [t.name, t] as const))("%s has full bars", (_, tune) => {
    for (const { bass, melody } of tune.bars) {
      expect(beats(melody)).toBe(tune.beatsPerBar);
      expect(beats(bass)).toBe(tune.beatsPerBar);
    }
  });

  it("orders notes by time", () => {
    for (const tune of TUNES) {
      const starts = tuneEvents(tune).map((e) => e.at);
      expect(starts).toEqual([...starts].sort((a, b) => a - b));
    }
  });
});
