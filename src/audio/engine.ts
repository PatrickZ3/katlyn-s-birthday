import { loadMuted, saveMuted } from "@/lib/progress";
import { TUNES, tuneEvents } from "./tunes";

/**
 * All sound is generated with the Web Audio API, so there are no audio files.
 * Browsers only allow sound after a tap, so nothing plays until unlockAudio()
 * has run from a tap (see AudioUnlock).
 */

export type Sfx = "tap" | "pop" | "shake" | "makeStar" | "blast" | "win" | "lose" | "gift";

const MUSIC_VOLUME = 0.32;
const SFX_VOLUME = 0.8;
const SCHEDULE_AHEAD_S = 0.3;
const SCHEDULER_MS = 100;

const SONGS = TUNES.map((tune) => ({
  events: tuneEvents(tune),
  beatSeconds: 60 / tune.bpm,
  beats: tune.bars.length * tune.beatsPerBar,
}));

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noise: AudioBuffer;
let muted: boolean | null = null;

let song = 0;
let eventIndex = 0;
let songStart = 0;

export function isMuted(): boolean {
  muted ??= loadMuted();
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  saveMuted(value);
  if (ctx) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.03);
}

function bus(volume: number, destination: AudioNode): GainNode {
  const gain = ctx!.createGain();
  gain.gain.value = volume;
  gain.connect(destination);
  return gain;
}

/** Call from a tap. Safe to call repeatedly: it also wakes a paused context. */
export function unlockAudio(): void {
  if (!ctx) {
    // Without this, iPhones stay silent when the ring switch is on mute.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";

    ctx = new AudioContext();
    master = bus(isMuted() ? 0 : 1, ctx.destination);
    musicBus = bus(MUSIC_VOLUME, master);
    sfxBus = bus(SFX_VOLUME, master);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    noise.getChannelData(0).forEach((_, i, data) => (data[i] = Math.random() * 2 - 1));

    songStart = ctx.currentTime + 0.1;
    setInterval(scheduleMusic, SCHEDULER_MS);
    // Stop the music when she switches apps or locks the phone.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) void ctx?.suspend();
      else void ctx?.resume();
    });
  }
  if (ctx.state !== "running") void ctx.resume();
}

type Tone = {
  hz: number;
  at: number;
  seconds: number;
  volume: number;
  type?: OscillatorType;
  /** Slides the pitch to this frequency over the note. */
  glideTo?: number;
  out: AudioNode;
};

function tone({ hz, at, seconds, volume, type = "sine", glideTo, out }: Tone) {
  const osc = ctx!.createOscillator();
  const gain = ctx!.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + seconds);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + seconds + 0.02);
}

/** A music-box note: a clear tone plus a quiet shimmer an octave and a bit above. */
function bell(hz: number, at: number, seconds: number, volume: number, out: AudioNode) {
  tone({ hz, at, seconds, volume, out });
  tone({ hz: hz * 3, at, seconds: seconds * 0.4, volume: volume * 0.18, out });
}

function scheduleMusic() {
  const now = ctx!.currentTime;
  for (;;) {
    const { events, beatSeconds, beats } = SONGS[song];
    const event = events[eventIndex];
    const at = songStart + event.at * beatSeconds;
    if (at > now + SCHEDULE_AHEAD_S) return;

    if (at >= now) {
      const seconds = event.beats * beatSeconds;
      if (event.voice === "bell") bell(event.hz * 2, at, Math.max(seconds, 0.9), 0.22, musicBus);
      else tone({ hz: event.hz, at, seconds, volume: 0.16, type: "triangle", out: musicBus });
    }

    eventIndex++;
    if (eventIndex === events.length) {
      eventIndex = 0;
      songStart += beats * beatSeconds;
      song = (song + 1) % SONGS.length;
    }
  }
}

function arpeggio(notes: number[], gapSeconds: number, volume: number) {
  const now = ctx!.currentTime;
  notes.forEach((hz, i) => bell(hz, now + i * gapSeconds, 0.6, volume, sfxBus));
}

function noiseBurst(seconds: number, volume: number) {
  const source = ctx!.createBufferSource();
  const gain = ctx!.createGain();
  const now = ctx!.currentTime;
  source.buffer = noise;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  source.connect(gain).connect(sfxBus);
  source.start(now);
  source.stop(now + seconds);
}

/** `size` is how many bubbles popped: bigger groups sound higher. */
export function playSfx(name: Sfx, size = 2): void {
  if (!ctx || isMuted()) return;
  const at = ctx.currentTime;
  const out = sfxBus;

  switch (name) {
    case "tap":
      return tone({ hz: 720, at, seconds: 0.07, volume: 0.16, out });
    case "pop": {
      const hz = 320 + Math.min(size, 12) * 45;
      return tone({ hz, glideTo: hz * 2.4, at, seconds: 0.11, volume: 0.42, out });
    }
    case "shake":
      return tone({ hz: 170, glideTo: 110, at, seconds: 0.14, volume: 0.3, type: "triangle", out });
    case "makeStar":
      return arpeggio([1047, 1319, 1568, 2093], 0.06, 0.26);
    case "blast":
      noiseBurst(0.3, 0.3);
      return tone({ hz: 200, glideTo: 55, at, seconds: 0.35, volume: 0.5, out });
    case "win":
      return arpeggio([523, 659, 784, 1047, 1319], 0.11, 0.32);
    case "lose":
      return arpeggio([440, 392, 330, 262], 0.17, 0.24);
    case "gift":
      noiseBurst(0.18, 0.1);
      return arpeggio([784, 988, 1175, 1568, 1976, 2349], 0.075, 0.28);
  }
}
