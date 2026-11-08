import type { ComponentType } from "react";
import {
  Aspirin,
  Benzene,
  Boba,
  Capsule,
  FlaskTree,
  GlowBuddy,
  KimchiRice,
  Microscope,
  RoundBuddy,
  SpicySock,
  TestTubes,
} from "./Doodles";
import { ElementTiles } from "./ElementTiles";

/**
 * Every drawing the Cute stuff page can show. The names on the left are what
 * you write as `sticker:` in src/config.ts. To add one, draw it in Doodles.tsx,
 * then add a line here.
 */
/** Grows to fill a featured card, and stays small enough for a normal one. */
function ElementsSticker() {
  return (
    <span className="inline-block group-data-featured:scale-150">
      <ElementTiles />
    </span>
  );
}

export const STICKERS = {
  kimchiRice: KimchiRice,
  spicySock: SpicySock,
  boba: Boba,
  smiski: GlowBuddy,
  chiikawa: RoundBuddy,
  flaskTree: FlaskTree,
  capsule: Capsule,
  elements: ElementsSticker,
  benzene: Benzene,
  aspirin: Aspirin,
  testTubes: TestTubes,
  microscope: Microscope,
} satisfies Record<string, ComponentType<{ className?: string }>>;

export type StickerName = keyof typeof STICKERS;
