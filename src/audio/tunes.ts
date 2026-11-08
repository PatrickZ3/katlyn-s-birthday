/** Note lists look like "G4:1 A4:.5 R:2": note (or R for a rest), then beats. */
export type Bar = { bass: string; melody: string };

export type Tune = {
  name: string;
  bpm: number;
  beatsPerBar: number;
  bars: Bar[];
};

const bar = (bass: string, melody: string): Bar => ({ bass, melody });

/** Both carols are traditional and in the public domain. */
export const TUNES: Tune[] = [
  {
    name: "We Wish You a Merry Christmas",
    bpm: 120,
    beatsPerBar: 3,
    bars: [
      bar("R:3", "R:2 D4:1"),
      bar("G3:3", "G4:1 G4:.5 A4:.5 G4:.5 F#4:.5"),
      bar("C3:3", "E4:1 E4:1 E4:1"),
      bar("A3:3", "A4:1 A4:.5 B4:.5 A4:.5 G4:.5"),
      bar("D3:3", "F#4:1 D4:1 D4:1"),
      bar("B3:3", "B4:1 B4:.5 C5:.5 B4:.5 A4:.5"),
      bar("E3:3", "G4:1 E4:1 D4:.5 D4:.5"),
      bar("C3:1 D3:2", "E4:1 A4:1 F#4:1"),
      bar("G3:3", "G4:2 D4:1"),
      bar("G3:3", "G4:1 G4:1 G4:1"),
      bar("D3:3", "F#4:2 F#4:1"),
      bar("E3:3", "G4:1 F#4:1 E4:1"),
      bar("D3:3", "D4:2 A4:1"),
      bar("G3:3", "B4:1 A4:1 G4:1"),
      bar("D3:3", "D5:1 D4:1 D4:.5 D4:.5"),
      bar("C3:1 D3:2", "E4:1 A4:1 F#4:1"),
      bar("G3:3", "G4:3"),
    ],
  },
  {
    name: "Jingle Bells",
    bpm: 132,
    beatsPerBar: 4,
    bars: [
      bar("C3:4", "E4:1 E4:1 E4:2"),
      bar("C3:4", "E4:1 E4:1 E4:2"),
      bar("C3:4", "E4:1 G4:1 C4:1.5 D4:.5"),
      bar("C3:4", "E4:4"),
      bar("F3:4", "F4:1 F4:1 F4:1.5 F4:.5"),
      bar("C3:4", "F4:1 E4:1 E4:1 E4:.5 E4:.5"),
      bar("D3:4", "E4:1 D4:1 D4:1 E4:1"),
      bar("G3:4", "D4:2 G4:2"),
      bar("C3:4", "E4:1 E4:1 E4:2"),
      bar("C3:4", "E4:1 E4:1 E4:2"),
      bar("C3:4", "E4:1 G4:1 C4:1.5 D4:.5"),
      bar("C3:4", "E4:4"),
      bar("F3:4", "F4:1 F4:1 F4:1.5 F4:.5"),
      bar("C3:4", "F4:1 E4:1 E4:1 E4:.5 E4:.5"),
      bar("G3:4", "G4:1 G4:1 F4:1 D4:1"),
      bar("C3:4", "C4:4"),
      bar("R:4", "R:4"),
    ],
  },
];

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteToHz(note: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(note);
  if (!match) throw new Error(`Bad note: ${note}`);
  const [, letter, sharp, octave] = match;
  const midi = 12 * (Number(octave) + 1) + SEMITONES[letter] + (sharp ? 1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

/** `hz` is null for a rest. */
export function parseNotes(notes: string): { hz: number | null; beats: number }[] {
  return notes.split(" ").map((item) => {
    const [note, beats] = item.split(":");
    return { hz: note === "R" ? null : noteToHz(note), beats: Number(beats) };
  });
}

export type NoteEvent = { at: number; hz: number; beats: number; voice: "bell" | "bass" };

/** Flattens a tune into notes ordered by start beat. */
export function tuneEvents(tune: Tune): NoteEvent[] {
  const events: NoteEvent[] = [];
  tune.bars.forEach(({ bass, melody }, index) => {
    for (const [notes, voice] of [[melody, "bell"], [bass, "bass"]] as const) {
      let at = index * tune.beatsPerBar;
      for (const { hz, beats } of parseNotes(notes)) {
        if (hz !== null) events.push({ at, hz, beats, voice });
        at += beats;
      }
    }
  });
  return events.sort((a, b) => a.at - b.at);
}
