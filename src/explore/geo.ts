/**
 * Plain maths for the Explore Toronto map: where she's allowed to stand.
 * Positions are metres from the middle of the map: x goes east, z goes south.
 */

/** The shape of src/explore/map-data.json (made by scripts/fetch-map.mjs). */
export type MapData = {
  attribution: string;
  origin: { lat: number; lon: number };
  /** Bay & College, Yonge & College, Yonge & Queen, Bay & Queen. */
  corners: [number, number][];
  /** The area she can walk in. */
  walk: [number, number][];
  spawn: [number, number];
  /** Whole buildings. Their footprints block walking. */
  buildings: Shape[];
  /** Detailed pieces of some buildings (a podium, a tower on top...). Only drawn. */
  parts?: Shape[];
  /** Centre line as x,z,x,z,... with width in metres. `m` marks a main road. */
  roads: { p: number[]; w: number; m?: number }[];
  parks: { p: number[] }[];
  plazas: { p: number[] }[];
  signs: { x: number; z: number; names: string[] }[];
  pois?: Poi[];
};

/**
 * One building or building piece. `p` is the footprint as x,z,x,z,...
 * `h` is the top and `b` the bottom (for pieces that start higher up), in metres.
 */
export type Shape = {
  p: number[];
  h: number;
  b?: number;
  n?: string;
  /** Wall colour, roof colour and material, from OpenStreetMap when it knows them. */
  c?: string;
  r?: string;
  m?: string;
  /** 1 if it has shops on the ground floor. */
  s?: number;
  /** 1 if it's drawn from its detailed parts instead. */
  x?: number;
};

/**
 * A street-level shop or restaurant. x,z is the spot on its building's wall,
 * `a` the direction the wall faces. `k` is the kind (restaurant, cafe,
 * clothes...), `q` the cuisine and `l` its name in its own language, if known.
 */
export type Poi = { x: number; z: number; a: number; n: string; k: string; q?: string; l?: string };

/** Shrinks (or grows) the whole map around its middle, heights included. */
export function scaleMap(map: MapData, scale: number): MapData {
  const flat = (p: number[]) => p.map((v) => Math.round(v * scale * 100) / 100);
  const pair = ([x, z]: [number, number]): [number, number] => [x * scale, z * scale];
  const shape = (s: Shape): Shape => ({ ...s, p: flat(s.p), h: s.h * scale, ...(s.b ? { b: s.b * scale } : {}) });
  return {
    ...map,
    corners: map.corners.map(pair),
    walk: map.walk.map(pair),
    spawn: pair(map.spawn),
    buildings: map.buildings.map(shape),
    parts: (map.parts ?? []).map(shape),
    roads: map.roads.map((r) => ({ ...r, p: flat(r.p), w: r.w * scale })),
    parks: map.parks.map((p) => ({ p: flat(p.p) })),
    plazas: map.plazas.map((p) => ({ p: flat(p.p) })),
    signs: map.signs.map((s) => ({ ...s, x: s.x * scale, z: s.z * scale })),
    pois: (map.pois ?? []).map((p) => ({ ...p, x: p.x * scale, z: p.z * scale })),
  };
}

/** Turns a real latitude/longitude into map metres (before any scaling). */
export function project(map: MapData, lat: number, lon: number): [number, number] {
  const metresPerLon = 111_320 * Math.cos((map.origin.lat * Math.PI) / 180);
  return [(lon - map.origin.lon) * metresPerLon, -(lat - map.origin.lat) * 111_132];
}

/** Is the point inside the polygon (flat x,z,x,z,... list)? */
export function insidePolygon(x: number, z: number, flat: ArrayLike<number>): boolean {
  let hit = false;
  const n = flat.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = flat[i * 2];
    const zi = flat[i * 2 + 1];
    const xj = flat[j * 2];
    const zj = flat[j * 2 + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

/** The closest distance from the point to the polygon's outline. */
export function distanceToOutline(x: number, z: number, flat: ArrayLike<number>): number {
  let best = Infinity;
  const n = flat.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = flat[j * 2];
    const az = flat[j * 2 + 1];
    const bx = flat[i * 2];
    const bz = flat[i * 2 + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lengthSq));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return best;
}

const CELL = 20;

/** Answers "can she stand here?" quickly, using a grid so only nearby buildings are checked. */
export class Collider {
  private grid = new Map<string, number[][]>();
  private walk: number[];

  constructor(buildings: number[][], walk: [number, number][]) {
    this.walk = walk.flat();
    for (const flat of buildings) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (let i = 0; i < flat.length; i += 2) {
        minX = Math.min(minX, flat[i]);
        maxX = Math.max(maxX, flat[i]);
        minZ = Math.min(minZ, flat[i + 1]);
        maxZ = Math.max(maxZ, flat[i + 1]);
      }
      for (let gx = Math.floor(minX / CELL); gx <= Math.floor(maxX / CELL); gx++) {
        for (let gz = Math.floor(minZ / CELL); gz <= Math.floor(maxZ / CELL); gz++) {
          const key = `${gx},${gz}`;
          if (!this.grid.has(key)) this.grid.set(key, []);
          this.grid.get(key)!.push(flat);
        }
      }
    }
  }

  /** True if a circle of `radius` at x,z overlaps a building or leaves the walkable area. */
  blocked(x: number, z: number, radius: number): boolean {
    if (!insidePolygon(x, z, this.walk)) return true;
    const seen = new Set<number[]>();
    for (let gx = Math.floor((x - radius) / CELL); gx <= Math.floor((x + radius) / CELL); gx++) {
      for (let gz = Math.floor((z - radius) / CELL); gz <= Math.floor((z + radius) / CELL); gz++) {
        for (const flat of this.grid.get(`${gx},${gz}`) ?? []) {
          if (seen.has(flat)) continue;
          seen.add(flat);
          if (insidePolygon(x, z, flat) || distanceToOutline(x, z, flat) < radius) return true;
        }
      }
    }
    return false;
  }

  /** The nearest spot to x,z where she can stand, searching outwards in rings. */
  nearestFree(x: number, z: number, radius: number): [number, number] | null {
    if (!this.blocked(x, z, radius)) return [x, z];
    for (let ring = 1; ring <= 40; ring++) {
      const r = ring * 1.2;
      const steps = 8 + ring * 2;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        if (!this.blocked(px, pz, radius)) return [px, pz];
      }
    }
    return null;
  }

  /**
   * Moves from x,z by dx,dz. If that walks into a wall, she slides along it
   * instead of stopping dead.
   */
  move(x: number, z: number, dx: number, dz: number, radius: number): [number, number] {
    if (!this.blocked(x + dx, z + dz, radius)) return [x + dx, z + dz];
    if (dx !== 0 && !this.blocked(x + dx, z, radius)) return [x + dx, z];
    if (dz !== 0 && !this.blocked(x, z + dz, radius)) return [x, z + dz];
    return [x, z];
  }
}
