import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type Collider, insidePolygon, type MapData } from "./geo";

/**
 * Things on the sidewalks: lamp posts with wreaths, Toronto-style bins,
 * benches, planters with little decorated pines, round pots, and café
 * tables with red chairs outside cafés and restaurants. They're
 * people-sized (not shrunk with the city), and she walks around them.
 *
 * To change how many there are, edit SPACING and the chances in `pick`.
 */

/** Metres between spots along each sidewalk. */
const SPACING = 9;
/** Metres between lamp posts along the main streets. */
const LAMP_SPACING = 24;
/** Room left between furniture and walls. She can always get round on the road side. */
const CLEARANCE = 0.25;
/** Map units around each crossing kept free of benches, bins and planters. */
const CORNER_CLEAR = 13;
const FOOD = new Set(["cafe", "restaurant", "fast_food", "tea", "bakery", "pub", "bar"]);

type Kind = "bin" | "bench" | "planter" | "pot" | "cafe" | "lamp";
/** Half the footprint of each kind (across, front to back), in metres, for walking into it. */
const FOOTPRINT: Record<Kind, [number, number]> = {
  bin: [0.4, 0.3],
  bench: [0.85, 0.3],
  planter: [0.55, 0.55],
  pot: [0.4, 0.4],
  cafe: [0.95, 0.55],
  lamp: [0.15, 0.15],
};

/** A box or other shape, painted one colour, ready to merge. */
function piece(geometry: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, rotY = 0) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g !== geometry) geometry.dispose();
  if (rotY) g.rotateY(rotY);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const colors = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i);
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute("uv");
  return g;
}

function merged(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** The models, each facing +z (towards the road). */
function models(): Record<Kind, THREE.BufferGeometry> {
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const snow = "#f4f7fb";
  return {
    // A silver street bin with a dark lid and coloured slots for garbage, recycling and organics.
    bin: merged([
      piece(box(0.72, 0.95, 0.5), "#7d8791", 0, 0.475, 0),
      piece(box(0.76, 0.1, 0.54), "#2e3338", 0, 1.0, 0),
      piece(box(0.6, 0.05, 0.4), snow, 0, 1.075, 0),
      piece(box(0.16, 0.07, 0.02), "#1f4e9e", -0.22, 0.82, 0.26),
      piece(box(0.16, 0.07, 0.02), "#1d1f22", 0, 0.82, 0.26),
      piece(box(0.16, 0.07, 0.02), "#1d7a3a", 0.22, 0.82, 0.26),
    ]),
    // A wooden bench on black iron legs, with a little snow on the seat.
    bench: merged([
      piece(box(1.6, 0.06, 0.45), "#8a5a34", 0, 0.46, 0),
      piece(box(1.5, 0.02, 0.3), snow, 0, 0.5, 0.02),
      piece(box(1.6, 0.08, 0.04), "#8a5a34", 0, 0.68, -0.21),
      piece(box(1.6, 0.08, 0.04), "#8a5a34", 0, 0.84, -0.21),
      piece(box(0.06, 0.46, 0.46), "#2b2f36", -0.7, 0.23, 0),
      piece(box(0.06, 0.46, 0.46), "#2b2f36", 0.7, 0.23, 0),
      piece(box(0.06, 0.5, 0.05), "#2b2f36", -0.7, 0.72, -0.22),
      piece(box(0.06, 0.5, 0.05), "#2b2f36", 0.7, 0.72, -0.22),
    ]),
    // A concrete planter with a little pine, decorated for Christmas.
    planter: merged([
      piece(box(1.05, 0.55, 1.05), "#b9b2a8", 0, 0.275, 0),
      piece(box(0.95, 0.03, 0.95), "#f4f7fb", 0, 0.56, 0),
      piece(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6), "#5a3a26", 0, 0.7, 0),
      piece(new THREE.ConeGeometry(0.48, 0.8, 8), "#1f5e3a", 0, 1.1, 0),
      piece(new THREE.ConeGeometry(0.34, 0.6, 8), "#256b43", 0, 1.45, 0),
      piece(new THREE.ConeGeometry(0.16, 0.25, 8), snow, 0, 1.7, 0),
      piece(new THREE.SphereGeometry(0.06, 6, 5), "#e0283f", 0.26, 1.0, 0.3),
      piece(new THREE.SphereGeometry(0.06, 6, 5), "#ffd27a", -0.3, 1.05, 0.22),
      piece(new THREE.SphereGeometry(0.06, 6, 5), "#e0283f", -0.05, 1.35, 0.3),
      piece(new THREE.SphereGeometry(0.06, 6, 5), "#7fd3ff", 0.2, 1.38, -0.2),
      piece(new THREE.SphereGeometry(0.07, 6, 5), "#ffd27a", 0, 1.84, 0),
    ]),
    // A round terracotta pot with a snowy shrub.
    pot: merged([
      piece(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 12), "#b5603f", 0, 0.3, 0),
      piece(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12), "#9c4f33", 0, 0.6, 0),
      piece(new THREE.SphereGeometry(0.42, 10, 8), "#2f6b3e", 0, 0.92, 0),
      piece(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), snow, 0, 1.08, 0),
      piece(box(0.3, 0.1, 0.04), "#c4183a", 0, 0.42, 0.37),
    ]),
    // A bistro table with two red chairs facing each other.
    cafe: merged([
      piece(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 14), "#2b2f36", 0, 0.74, 0),
      piece(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 6), "#2b2f36", 0, 0.37, 0),
      piece(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10), "#2b2f36", 0, 0.015, 0),
      piece(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), "#f4f1ea", 0.1, 0.81, 0.05),
      ...[-1, 1].flatMap((side) => [
        piece(box(0.42, 0.04, 0.42), "#c4183a", side * 0.62, 0.46, 0),
        piece(box(0.04, 0.42, 0.42), "#c4183a", side * 0.83, 0.69, 0),
        piece(box(0.03, 0.46, 0.38), "#2b2f36", side * 0.44, 0.23, 0),
        piece(box(0.03, 0.46, 0.38), "#2b2f36", side * 0.8, 0.23, 0),
      ]),
    ]),
    // A black lamp post with a wreath and a red bow. The lamp itself is drawn separately so it glows.
    lamp: merged([
      piece(new THREE.CylinderGeometry(0.14, 0.18, 0.4, 8), "#24272d", 0, 0.2, 0),
      piece(new THREE.CylinderGeometry(0.06, 0.07, 4.2, 8), "#2b2f36", 0, 2.3, 0),
      piece(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 8), "#2b2f36", 0, 4.42, 0),
      piece(new THREE.TorusGeometry(0.26, 0.07, 6, 14), "#1f5e3a", 0, 2.6, 0.08),
      piece(box(0.22, 0.12, 0.05), "#c4183a", 0, 2.38, 0.14),
      piece(box(0.07, 0.2, 0.04), "#c4183a", -0.06, 2.26, 0.14),
      piece(box(0.07, 0.2, 0.04), "#c4183a", 0.06, 2.26, 0.14),
    ]),
  };
}

export type Street = { group: THREE.Group; dispose: () => void };

/**
 * `map` is already shrunk by `scale`. Spots are checked against `collider`,
 * then added to it so she walks around them. `avoid` is a spot to keep clear
 * (her front door).
 */
export function addStreetFurniture(map: MapData, scale: number, collider: Collider, avoid: [number, number]): Street {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(thing: T) => (disposables.push(thing), thing);
  const walk = map.walk.flat();
  let seed = 23;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Every road segment, for checking a spot is on the sidewalk and not in the road.
  const segments: number[][] = [];
  for (const road of map.roads) {
    for (let i = 0; i + 3 < road.p.length; i += 2) segments.push([road.p[i], road.p[i + 1], road.p[i + 2], road.p[i + 3], road.w / 2]);
  }
  const inRoad = (x: number, z: number, margin: number) =>
    segments.some(([ax, az, bx, bz, half]) => {
      const dx = bx - ax;
      const dz = bz - az;
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
      return Math.hypot(x - ax - dx * t, z - az - dz * t) < half + margin;
    });

  const placed: { kind: Kind; x: number; z: number; angle: number }[] = [];
  const tooClose = (x: number, z: number, gap: number) =>
    placed.some((p) => Math.hypot(p.x - x, p.z - z) < gap) || Math.hypot(x - avoid[0], z - avoid[1]) < 6;

  const tryPlace = (kind: Kind, x: number, z: number, angle: number, gap: number) => {
    const [hw, hd] = FOOTPRINT[kind];
    const reach = Math.hypot(hw, hd);
    if (!insidePolygon(x, z, walk) || tooClose(x, z, gap)) return false;
    // Keep street corners clear, where she crosses.
    if (kind !== "lamp" && map.signs.some((sign) => Math.hypot(sign.x - x, sign.z - z) < CORNER_CLEAR)) return false;
    // Kept off the road by its depth, since it stands square to the curb.
    if (inRoad(x, z, kind === "cafe" ? reach : hd + 0.1)) return false;
    if (collider.blocked(x, z, reach + CLEARANCE)) return false;
    placed.push({ kind, x, z, angle });
    // Its footprint, turned to match, becomes solid.
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const corner = (u: number, v: number) => [x + u * c + v * s, z - u * s + v * c];
    collider.add([...corner(-hw, -hd), ...corner(hw, -hd), ...corner(hw, hd), ...corner(-hw, hd)]);
    return true;
  };

  // Walk along each side of each street, offering spots on the sidewalk.
  const sidewalkSpots = (spacing: number, mainOnly: boolean, use: (curb: number[], out: number[], angle: number) => void) => {
    for (const road of map.roads) {
      if (mainOnly && !road.m) continue;
      let carry = 0;
      for (let i = 0; i + 3 < road.p.length; i += 2) {
        const [ax, az, bx, bz] = [road.p[i], road.p[i + 1], road.p[i + 2], road.p[i + 3]];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 0.01) continue;
        const dx = (bx - ax) / len;
        const dz = (bz - az) / len;
        let t = carry;
        for (; t < len; t += spacing) {
          for (const side of [-1, 1]) {
            // (nx, nz) points from the road out to this sidewalk.
            const nx = -dz * side;
            const nz = dx * side;
            const off = road.w / 2;
            // Turned so its front (+z) faces back towards the road.
            use([ax + dx * t + nx * off, az + dz * t + nz * off], [nx, nz], Math.atan2(-nx, -nz));
          }
        }
        carry = t - len;
      }
    }
  };

  // Lamp posts first, close to the curb of the main streets.
  /** Stands `kind` on the sidewalk, its front a little back from the curb. */
  const atCurb = (kind: Kind, curb: number[], out: number[], angle: number, gap: number) => {
    const back = 0.35 + FOOTPRINT[kind][1];
    return tryPlace(kind, curb[0] + out[0] * back, curb[1] + out[1] * back, angle, gap);
  };
  sidewalkSpots(LAMP_SPACING * scale, true, (curb, out, angle) => atCurb("lamp", curb, out, angle, 8));

  // Café tables outside cafés and restaurants.
  for (const poi of map.pois ?? []) {
    if (!FOOD.has(poi.k) || random() < 0.35) continue;
    const nx = Math.sin(poi.a);
    const nz = Math.cos(poi.a);
    const along = (random() - 0.5) * 2;
    tryPlace("cafe", poi.x + nx * 1.4 + nz * along, poi.z + nz * 1.4 - nx * along, poi.a, 2.4);
  }

  // Then bins, benches and planters along every sidewalk.
  const pick = (): Kind => {
    const r = random();
    return r < 0.3 ? "bin" : r < 0.55 ? "bench" : r < 0.82 ? "planter" : "pot";
  };
  sidewalkSpots(SPACING * scale, false, (curb, out, angle) => {
    if (random() < 0.3) return;
    atCurb(pick(), curb, out, angle, 4.5);
  });

  // One instanced mesh per kind: hundreds of them still cost a handful of draw calls.
  const material = keep(new THREE.MeshLambertMaterial({ vertexColors: true }));
  const shapes = models();
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  for (const kind of Object.keys(shapes) as Kind[]) {
    const items = placed.filter((p) => p.kind === kind);
    const geometry = keep(shapes[kind]);
    if (!items.length) continue;
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    mesh.name = `street-${kind}`;
    items.forEach((p, i) => {
      rotation.setFromAxisAngle(up, p.angle);
      mesh.setMatrixAt(i, matrix.compose(new THREE.Vector3(p.x, 0, p.z), rotation, one));
    });
    group.add(mesh);
  }

  // The lamps: a warm glowing globe on each post.
  const lamps = placed.filter((p) => p.kind === "lamp");
  if (lamps.length) {
    const globe = new THREE.InstancedMesh(
      keep(new THREE.SphereGeometry(0.2, 10, 8)),
      keep(new THREE.MeshBasicMaterial({ color: "#fff1c9" })),
      lamps.length,
    );
    lamps.forEach((p, i) => globe.setMatrixAt(i, matrix.makeTranslation(p.x, 4.68, p.z)));
    group.add(globe);
  }

  return { group, dispose: () => disposables.forEach((d) => d.dispose()) };
}
