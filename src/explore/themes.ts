import type { Poi } from "./geo";

/**
 * How each real shop or restaurant's sign looks, from what kind of place it
 * is and its cuisine: Korean places get Korean writing, Japanese ones a noren
 * curtain and lantern, Chinese ones red lanterns, kebab shops a döner spit,
 * and so on. Used by the 3D signs and the map.
 */

export type Decoration = "lanterns" | "noren" | "doner" | "italia" | "marquee" | null;

export type Theme = {
  bg: string;
  fg: string;
  /** Big words in the shop's own language or a short label, shown above the name. */
  word?: string;
  wordColor?: string;
  icon?: string;
  decoration?: Decoration;
};

/** Picks colours, words and decorations from the kind of place and its cuisine. */
export function themeFor(poi: Poi): Theme {
  const q = `${poi.q ?? ""} ${poi.n}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has("korean", "kimchi", "bulgogi", "bibimbap", "donkatsu", "kimbap")) {
    const word = poi.l ?? (has("chicken", "치킨") ? "치킨" : has("donkatsu", "katsu") ? "돈까스" : has("bbq") ? "고기구이" : has("kimbap") ? "김밥" : "한식");
    return { bg: "#fffdf8", fg: "#1b1b1b", word, wordColor: "#c8102e", icon: "🇰🇷" };
  }
  if (has("japanese", "sushi", "ramen", "izakaya", "udon", "donburi")) {
    const word = poi.l ?? (has("ramen") ? "ラーメン" : has("sushi") ? "寿司" : has("izakaya") ? "居酒屋" : "和食");
    return { bg: "#1f2a44", fg: "#ffffff", word, wordColor: "#ffd27a", icon: "🍣", decoration: "noren" };
  }
  if (has("chinese", "dim_sum", "dumpling", "hotpot", "cantonese", "szechuan", "sichuan", "noodle")) {
    const word = poi.l ?? (has("dim_sum") ? "点心" : has("hotpot") ? "火锅" : has("noodle") ? "面馆" : "中餐");
    return { bg: "#b3121f", fg: "#ffd54a", word, wordColor: "#ffd54a", icon: "🥟", decoration: "lanterns" };
  }
  if (has("kebab", "shawarma", "doner", "döner", "turkish", "arab", "lebanese", "middle_eastern", "falafel")) {
    return { bg: "#e85d04", fg: "#ffffff", word: has("shawarma") && !has("kebab") ? "SHAWARMA" : "KEBAB", wordColor: "#fff3b0", icon: "🥙", decoration: "doner" };
  }
  if (has("thai")) return { bg: "#4b2a7b", fg: "#ffd27a", word: "อาหารไทย", wordColor: "#ffffff", icon: "🍜" };
  if (has("vietnamese", "pho")) return { bg: "#d62828", fg: "#ffe066", word: "Phở", wordColor: "#ffffff", icon: "🍜" };
  if (has("indian", "curry")) return { bg: "#f77f00", fg: "#ffffff", word: "Curry", icon: "🍛" };
  if (has("mexican", "taco", "burrito")) return { bg: "#2a9d8f", fg: "#ffffff", word: "Tacos", wordColor: "#ffe066", icon: "🌮" };
  if (has("greek", "mediterranean")) return { bg: "#1d5fa8", fg: "#ffffff", icon: "🫒" };
  if (has("pizza", "italian")) return { bg: "#fffdf8", fg: "#2b2b2b", icon: "🍕", decoration: "italia" };
  if (has("bubble_tea", "bubble tea", "boba")) return { bg: "#ffd6e8", fg: "#7a2a52", word: "Bubble Tea", wordColor: "#b0306a", icon: "🧋" };
  if (has("coffee", "cafe", "café", "tea")) return { bg: "#4a2c1d", fg: "#f3e3c3", icon: "☕" };
  if (has("chicken")) return { bg: "#ff6b00", fg: "#ffffff", icon: "🍗" };
  if (has("burger", "american", "hot_dog")) return { bg: "#ffc300", fg: "#b3121f", icon: "🍔" };
  if (has("sandwich", "bagel", "bakery", "breakfast")) return { bg: "#f5e6c8", fg: "#5a3a1a", icon: "🥪" };
  if (has("ice_cream", "dessert", "donut", "juice")) return { bg: "#ffe3f1", fg: "#a0306a", icon: "🍦" };
  if (has("seafood")) return { bg: "#0f4c75", fg: "#ffffff", icon: "🦐" };

  switch (poi.k) {
    case "pub":
    case "bar":
      return { bg: "#14452f", fg: "#f3c969", icon: "🍺" };
    case "bank":
      return { bg: "#1f4e9e", fg: "#ffffff", icon: "🏦" };
    case "pharmacy":
      return { bg: "#ffffff", fg: "#1d7a3a", icon: "💊" };
    case "clothes":
    case "fashion":
    case "boutique":
      return { bg: "#151515", fg: "#ffffff", icon: "👗" };
    case "shoes":
      return { bg: "#151515", fg: "#ffffff", icon: "👟" };
    case "convenience":
    case "supermarket":
      return { bg: "#2a7f62", fg: "#ffffff", icon: "🛒" };
    case "beauty":
    case "cosmetics":
    case "hairdresser":
      return { bg: "#f7c5d5", fg: "#8a1c4a", icon: "💄" };
    case "cannabis":
      return { bg: "#1e5631", fg: "#e9f5db", icon: "🌿" };
    case "jewelry":
      return { bg: "#1b1b2f", fg: "#f3c969", icon: "💍" };
    case "mobile_phone":
    case "electronics":
      return { bg: "#222831", fg: "#00adb5", icon: "📱" };
    case "books":
      return { bg: "#6b3e26", fg: "#fff3e0", icon: "📚" };
    case "gift":
      return { bg: "#c4183a", fg: "#ffffff", icon: "🎁" };
    case "optician":
      return { bg: "#ffffff", fg: "#1f4e9e", icon: "👓" };
    case "department_store":
      return { bg: "#2b2b2b", fg: "#f3c969", icon: "🛍️" };
    case "theatre":
    case "cinema":
      return { bg: "#7a0d1f", fg: "#ffd27a", icon: poi.k === "cinema" ? "🎬" : "🎭", decoration: "marquee" };
    default:
      return { bg: "#2b2b2b", fg: "#ffffff", icon: "🛍️" };
  }
}
