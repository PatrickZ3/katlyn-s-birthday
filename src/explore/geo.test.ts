import { describe, expect, it } from "vitest";
import { Collider, distanceToOutline, insidePolygon, type MapData } from "./geo";
import mapData from "./map-data.json";

const square = [0, 0, 10, 0, 10, 10, 0, 10];
const walk: [number, number][] = [
  [-50, -50],
  [50, -50],
  [50, 50],
  [-50, 50],
];

describe("polygon maths", () => {
  it("knows inside from outside", () => {
    expect(insidePolygon(5, 5, square)).toBe(true);
    expect(insidePolygon(15, 5, square)).toBe(false);
  });

  it("measures distance to the outline", () => {
    expect(distanceToOutline(5, -3, square)).toBeCloseTo(3);
    expect(distanceToOutline(5, 5, square)).toBeCloseTo(5);
  });
});

describe("Collider", () => {
  const collider = new Collider([square], walk);

  it("blocks walking into a building, including brushing past its wall", () => {
    expect(collider.blocked(5, 5, 0.3)).toBe(true);
    expect(collider.blocked(5, -0.2, 0.3)).toBe(true);
    expect(collider.blocked(5, -2, 0.3)).toBe(false);
  });

  it("blocks leaving the walkable area", () => {
    expect(collider.blocked(60, 0, 0.3)).toBe(true);
  });

  it("slides along a wall instead of stopping", () => {
    // Walking diagonally into the building's south side keeps the sideways part.
    const [x, z] = collider.move(5, -1, 1, 1, 0.3);
    expect(x).toBe(6);
    expect(z).toBe(-1);
  });
});

describe("the real Toronto map", () => {
  const map = mapData as MapData;
  const collider = new Collider(
    map.buildings.map((b) => b.p),
    map.walk,
  );

  it("starts her somewhere she can stand", () => {
    expect(collider.blocked(map.spawn[0], map.spawn[1], 0.35)).toBe(false);
  });

  it("includes every corner intersection in the walkable area", () => {
    for (const [x, z] of map.corners) expect(collider.blocked(x, z, 0.35)).toBe(false);
  });

  it("has the buildings and streets", () => {
    expect(map.buildings.length).toBeGreaterThan(100);
    expect(map.roads.length).toBeGreaterThan(100);
    expect(map.buildings.some((b) => b.n === "CF Toronto Eaton Centre")).toBe(true);
  });
});
