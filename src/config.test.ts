import { describe, expect, it } from "vitest";
import { LIMITS, config } from "./config";

const { gift, cuteStuff } = config;

/** Fails with a message that says what to change in config.ts. */
function check(ok: boolean, message: string) {
  expect(ok, `\n\n  src/config.ts: ${message}\n`).toBe(true);
}

function checkLength(text: string, max: number, what: string) {
  check(text.length <= max, `${what} "${text}" is ${text.length} letters. The maximum is ${max}.`);
}

describe("gifts page in config.ts", () => {
  it("has a sensible number of gift types", () => {
    check(gift.types.length >= 1, "there must be at least 1 gift type.");
    check(
      gift.types.length <= LIMITS.giftTypes,
      `there are ${gift.types.length} gift types. The maximum is ${LIMITS.giftTypes}.`,
    );
    const labels = gift.types.map((type) => type.label);
    check(new Set(labels).size === labels.length, "two gift types have the same label.");
  });

  it.each(gift.types.map((type) => [type.label, type] as const))("%s gifts fit", (label, type) => {
    checkLength(label, LIMITS.giftTypeLabelLength, "the tab name");
    checkLength(type.dose, LIMITS.giftDoseLength, "the dose line");
    check(type.items.length >= 1, `"${label}" needs at least 1 gift.`);
    check(
      type.items.length <= LIMITS.giftsPerType,
      `"${label}" has ${type.items.length} gifts. The maximum is ${LIMITS.giftsPerType}.`,
    );
    check(new Set(type.items).size === type.items.length, `"${label}" has the same gift twice.`);
    for (const item of type.items) {
      check(item.trim().length > 0, `"${label}" has an empty gift.`);
      checkLength(item, LIMITS.giftTextLength, "the gift");
    }
  });
});

describe("cute stuff page in config.ts", () => {
  const stickers = cuteStuff.sections.flatMap((section) => section.stickers);

  it("has a sensible number of sections and stickers", () => {
    check(
      cuteStuff.sections.length <= LIMITS.cuteSections,
      `there are ${cuteStuff.sections.length} sections. The maximum is ${LIMITS.cuteSections}.`,
    );
    check(
      stickers.length <= LIMITS.cuteStickers,
      `there are ${stickers.length} stickers. The maximum is ${LIMITS.cuteStickers}.`,
    );
    for (const section of cuteStuff.sections) {
      check(section.stickers.length >= 1, `"${section.title}" needs at least 1 sticker.`);
    }
    const titles = cuteStuff.sections.map((section) => section.title);
    check(new Set(titles).size === titles.length, "two sections have the same title.");
  });

  it("keeps sticker words short and unique", () => {
    for (const { name, note } of stickers) {
      checkLength(name, LIMITS.cuteNameLength, "the sticker name");
      checkLength(note, LIMITS.cuteNoteLength, "the sticker note");
    }
    const ids = stickers.map(({ sticker, name }) => `${sticker}-${name}`);
    check(new Set(ids).size === ids.length, "two stickers have the same drawing and the same name.");
  });
});
