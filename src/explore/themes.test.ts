import { describe, expect, it } from "vitest";
import type { MapData, Poi } from "./geo";
import mapData from "./map-data.json";
import { themeFor } from "./themes";

const place = (n: string, k: string, q?: string): Poi => ({ x: 0, z: 0, a: 0, n, k, q });

describe("shop signs match what each place is", () => {
  it("writes Korean on Korean restaurants", () => {
    expect(themeFor(place("Lucky Donkatsu", "restaurant", "korean")).word).toBe("돈까스");
    expect(themeFor(place("bb.q Chicken", "restaurant", "korean;chicken")).word).toBe("치킨");
    expect(themeFor(place("Koryo Korean BBQ", "restaurant", "korean")).word).toBe("고기구이");
  });

  it("gives kebab and shawarma shops a döner spit", () => {
    const alforat = themeFor(place("Alforat Iraqi Street Food", "fast_food", "arab;chicken;diner;kebab;mediterranean;shawarma"));
    expect(alforat.word).toBe("KEBAB");
    expect(alforat.decoration).toBe("doner");
    expect(themeFor(place("Shawarma Royal", "fast_food", "shawarma")).word).toBe("SHAWARMA");
  });

  it("styles Japanese and Chinese places in their own writing", () => {
    expect(themeFor(place("Konjiki Ramen (Downtown)", "restaurant", "ramen;japanese")).word).toBe("ラーメン");
    expect(themeFor(place("Sushi Monkey", "restaurant", "sushi")).decoration).toBe("noren");
    expect(themeFor(place("Hero Dumpling", "restaurant", "chinese;dim_sum")).word).toBe("点心");
    expect(themeFor(place("GB Hand-Pulled Noodles", "restaurant", "chinese;noodle")).decoration).toBe("lanterns");
  });

  it("knows cafes, boba and pizza", () => {
    expect(themeFor(place("Some Cafe", "cafe", "coffee_shop")).icon).toBe("☕");
    expect(themeFor(place("Some Tea", "cafe", "bubble_tea")).icon).toBe("🧋");
    expect(themeFor(place("3 Brewers", "restaurant", "pizza")).decoration).toBe("italia");
  });

  it("covers the real Korean and kebab places in the area", () => {
    const pois = (mapData as MapData).pois ?? [];
    const korean = pois.filter((p) => p.q?.includes("korean"));
    const kebab = pois.filter((p) => /kebab|shawarma/.test(p.q ?? ""));
    expect(korean.length).toBeGreaterThan(0);
    expect(kebab.length).toBeGreaterThan(0);
    for (const p of korean) expect(themeFor(p).wordColor).toBe("#c8102e");
    for (const p of kebab) expect(themeFor(p).decoration).toBe("doner");
  });
});
