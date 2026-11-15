import type { StickerName } from "@/components/stickers";

/**
 * Everything you're likely to want to edit lives here.
 * In `note.body`, wrap words in **double stars** to make them bold.
 *
 * Editing the Gifts page or the Cute stuff page? Scroll to the bottom of this
 * file: each one has step-by-step instructions above it.
 *
 * After any change, run `npm test`. If something breaks a limit, it tells you
 * exactly what to fix. GitHub runs the same check and won't publish until it passes.
 */
const name = "Katlyn";

/**
 * The most each page can hold. These numbers were tested on phone-sized
 * screens, down to 320 pixels wide. Going past them makes `npm test` fail.
 */
export const LIMITS = {
  giftTypes: 4,
  giftTypeLabelLength: 8,
  giftDoseLength: 45,
  giftsPerType: 12,
  giftTextLength: 40,
  cuteSections: 4,
  cuteStickers: 24,
  cuteNameLength: 24,
  cuteNoteLength: 60,
};

type GiftType = {
  /** The tab name, e.g. "Daily". */
  label: string;
  /** One emoji shown above the tab name. */
  icon: string;
  /** The small line under the tabs. */
  dose: string;
  /** One gift per line. */
  items: string[];
};

type CuteSticker = {
  /** Which drawing to show. Your editor suggests the valid names as you type. */
  sticker: StickerName;
  name: string;
  note: string;
  /** Optional. true makes this sticker a big full-width card. */
  featured?: boolean;
};

type CuteSection = {
  title: string;
  stickers: CuteSticker[];
};

/*
 * =====================================================================
 * GIFTS PAGE: HOW TO CHANGE IT
 * =====================================================================
 *
 * The page has one tab per gift type. Each tab shows that type's gifts.
 *
 * Add a gift:      add a line inside `items`, in quotes, ending with a comma:
 *                      "Breakfast in bed",
 * Remove a gift:   delete its line.
 * Edit a gift:     change the words between the quotes.
 * Reorder gifts:   move the lines. They appear top to bottom.
 *
 * Add a gift type: copy a whole { label ... } block, paste it after the
 *                  last one, then change its label, icon, dose and items.
 * Remove a type:   delete its whole { label ... } block.
 *
 * MAXIMUMS (from LIMITS at the top of this file):
 *   - Gift types (tabs):       4
 *   - Letters in a tab name:   8
 *   - Letters in a dose line:  45
 *   - Gifts in one type:       12
 *   - Letters in one gift:     40
 *
 * GOOD TO KNOW:
 *   - Every type needs at least 1 gift.
 *   - Each gift is a pill-shaped present in its own row. About 2 fit on
 *     screen on an iPhone 14, and 3 on a bigger phone like an iPhone 14 Plus.
 *     With more than that the list scrolls, with a fade at the bottom to
 *     show there's more. On a small phone like an iPhone SE, 1 fits.
 *   - Long gifts just wrap onto more lines, so nothing gets cut off.
 *   - Two gifts in the same type can't have identical wording.
 *   - Pill colours are automatic and repeat in this order: red + green,
 *     green + cream, navy + red, candy cane + green.
 *   - `showRx` puts the pharmacy prescription symbol on each gift tag. To
 *     remove it, change it to  showRx: false,
 */
const gift: { title: string; showRx: boolean; types: GiftType[] } = {
  title: "Your gifts",
  showRx: true,
  types: [
    {
      label: "Daily",
      icon: "⛄",
      dose: "Take once daily, with love.",
      items: ["A photoshoot", "Harass-me session", "I'll say anything you want"],
    },
    {
      label: "Weekly",
      icon: "🎄",
      dose: "Take once weekly. Refills included.",
      items: ["Free dinner", "My embarrassing pics", "Sitting in silence together"],
    },
    {
      label: "One time",
      icon: "🎁",
      dose: "Single dose. No refills.",
      items: ["Day trip with me", "Your slave for the day", "Fingering me"],
    },
  ],
};

/*
 * =====================================================================
 * CUTE STUFF PAGE: HOW TO CHANGE IT
 * =====================================================================
 *
 * The page is made of sections, and each section holds stickers.
 *
 * Add a sticker:    copy a whole { sticker ... } line, paste it into a
 *                   section, then change the name and note.
 * Remove a sticker: delete its line.
 * Change the words: edit `name` and `note`.
 * Make one big:     add  featured: true  to it (see kimchi fried rice).
 * Add a section:    copy a whole { title ... } block, paste it after the
 *                   last one, then change its title and stickers.
 *
 * STICKER NAMES YOU CAN USE:
 *   kimchiRice, spicySock, boba, smiski, chiikawa, flaskTree, capsule,
 *   elements, benzene, aspirin, testTubes, microscope
 * The same sticker can be used more than once.
 *
 * To add a brand new drawing: draw it in src/components/Doodles.tsx, then add
 * it to the list in src/components/stickers.tsx. Its name then works here.
 *
 * MAXIMUMS (from LIMITS at the top of this file):
 *   - Sections:                      4
 *   - Stickers across all sections:  24
 *   - Letters in a sticker name:     24
 *   - Letters in a sticker note:     60
 *
 * GOOD TO KNOW:
 *   - Every section needs at least 1 sticker.
 *   - The page scrolls, so it doesn't matter how many fit on screen at once.
 *   - Normal stickers sit two per row. A featured one takes a full row.
 */
const cuteStuff: { title: string; sections: CuteSection[] } = {
  title: "Cute stuff",
  sections: [
    {
      title: "Keren gk?",
      stickers: [
        {
          sticker: "kimchiRice",
          name: "Kimchi fried rice",
          note: "With a fried egg on top. Non-negotiable.",
          featured: true,
        },
        { sticker: "spicySock", name: "Samyang sock", note: "Warning: extremely spicy feet" },
        { sticker: "boba", name: "Boba", note: "Always room for one more" },
        { sticker: "smiski", name: "Smiski", note: "Hiding somewhere on this site" },
        { sticker: "chiikawa", name: "Chiikawa", note: "Small, round, doing its best" },
      ],
    },
    {
      title: "She's goes to the lab 👀",
      stickers: [
        {
          sticker: "elements",
          name: "I Lv U",
          note: "Iodine, livermorium, uranium",
          featured: true,
        },
        { sticker: "aspirin", name: "Aspirin", note: "C₉H₈O₄, for after long lab days" },
        { sticker: "benzene", name: "Benzene", note: "C₆H₆, a classic ring" },
        { sticker: "flaskTree", name: "Flask tree", note: "Erlenmeyer, Christmas edition" },
        { sticker: "testTubes", name: "Test tubes", note: "Festive results only" },
        { sticker: "capsule", name: "Candy capsule", note: "Take with love" },
        { sticker: "microscope", name: "Microscope", note: "For my favourite researcher" },
      ],
    },
  ],
};


export const config = {
  name,
  /**
   * Put the file in public/. A placeholder shows until it exists.
   * The name must match exactly, capitals included (photo.JPG is not
   * photo.jpg on the live site, even though your Mac treats them the same).
   */
  photo: "/photo.JPG",
  photoAlt: "Us",
  pageTitle: `Merry Christmas, ${name}`,

  landing: {
    greeting: "Merry Christmas,",
    subtitle: "I made you something ✨",
    prompt: "Play to unlock your gift :3",
    button: "Play ▶",
    photoPlaceholder: "Your photo here",
  },

  note: {
    title: "A gift is waiting",
    body: "Beat **level 5** to unlock your next gift.",
    howToPlay:
      "Tap groups of 2 or more matching bubbles to pop them. Pop 6 or more at once to make a ★ star, then tap it to blast everything around it. If a blast hits another star, that one goes off too, even bigger. (Kalo mager bisa skip look at top right)",
    button: "Ok Bro",
  },

  game: {
    levelWinText: "You're amazing. On to the next one!",
    lastLevelNextText: "One more to go. The gift is so close!",
    nextButton: "Next level",
    loseTitle: "Out of moves",
    loseText: "So close! Want to try again?",
    retryButton: "Try again",
  },

  final: {
    badge: "Gift unlocked",
    greeting: "Merry Christmas,",
    message: "I love you",
    button: "Main lagi?",
    presentHint: "Pencet for your present sayang",
    presentLabel: "Open your present",
  },

  levels: {
    title: "Pick a level",
  },

  /**
   * MOVING DECORATIONS
   * Change any of these to false to remove it.
   *   santa:   Santa flying across the top of every page.
   *   walkers: the two little buddies walking along the snowy hills.
   */
  decorations: {
    santa: true,
    walkers: true,
  },

  gift,
  cuteStuff,
};
