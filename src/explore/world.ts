import * as THREE from "three";
import { SHOP_HEIGHT, addBuildings } from "./buildings";
import { addLandmarks } from "./landmarks";
import { addStorefronts } from "./storefronts";
import { insidePolygon, type MapData } from "./geo";

/**
 * Builds the 3D city from the map data: snowy ground, streets, buildings with
 * windows and snowy roofs, parks with pine trees, street signs, a Christmas
 * tree and landmark names. Everything of one kind is merged into a single mesh,
 * so even a phone draws it quickly.
 */

/** Landmarks that get a floating name, and the shorter name to show. */
const LANDMARKS: Record<string, string> = {
  "CF Toronto Eaton Centre": "Eaton Centre",
  "College Park": "College Park",
  "Old City Hall": "Old City Hall",
  "Massey Hall": "Massey Hall",
  "Ed Mirvish Theatre": "Ed Mirvish Theatre",
  "Hudson's Bay/Saks Fifth Avenue": "Hudson's Bay",
  "Toronto Police Headquarters": "Police HQ",
  "Chelsea Hotel, Toronto": "Chelsea Hotel",
  Atrium: "Atrium on Bay",
  "Church of the Holy Trinity": "Holy Trinity Church",
  "Toronto Coach Terminal (disused)": "Old Coach Terminal",
  "Confederation Life Building": "Confederation Life",
};

export const SKY_TOP = new THREE.Color("#2b3f73");
export const SKY_HORIZON = new THREE.Color("#e8b8b0");

/** A repeatable random number from a seed, so the city looks the same every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Text on a canvas, for street signs and landmark names. */
function textTexture(text: string, { width = 512, height = 96, bg = "", color = "#fff", font = 52 } = {}) {
  return canvasTexture(width, height, (ctx) => {
    if (bg) {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 14);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(6, 6, width - 12, height - 12, 10);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.font = `800 ${font}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (!bg) {
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 10;
    }
    ctx.fillText(text, width / 2, height / 2 + 3);
  });
}

type Buffers = { position: number[]; normal: number[]; color: number[]; uv: number[] };
const newBuffers = (): Buffers => ({ position: [], normal: [], color: [], uv: [] });

function toGeometry(b: Buffers) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(b.position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(b.normal, 3));
  if (b.color.length) g.setAttribute("color", new THREE.Float32BufferAttribute(b.color, 3));
  if (b.uv.length) g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
  return g;
}

/** Adds a flat polygon at height y, facing up. */
function addFlat(b: Buffers, flat: number[], y: number, color: THREE.Color) {
  const contour: THREE.Vector2[] = [];
  for (let i = 0; i < flat.length; i += 2) contour.push(new THREE.Vector2(flat[i], flat[i + 1]));
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    // Wind each triangle so it faces up.
    const [a, c2, c3] = [contour[i], contour[j], contour[k]];
    const up = (c2.x - a.x) * (c3.y - a.y) - (c2.y - a.y) * (c3.x - a.x) < 0;
    for (const p of up ? [a, c2, c3] : [a, c3, c2]) {
      b.position.push(p.x, y, p.y);
      b.normal.push(0, 1, 0);
      b.color.push(color.r, color.g, color.b);
      b.uv.push(0, 0);
    }
  }
}

/** Adds a thick line on the ground (a street, or its centre line), with round joins. */
function addRibbon(b: Buffers, flat: number[], width: number, y: number, color: THREE.Color) {
  const half = width / 2;
  const push = (x: number, z: number) => {
    b.position.push(x, y, z);
    b.normal.push(0, 1, 0);
    b.color.push(color.r, color.g, color.b);
  };
  for (let i = 0; i + 3 < flat.length; i += 2) {
    const [ax, az, bx, bz] = [flat[i], flat[i + 1], flat[i + 2], flat[i + 3]];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const nx = (-(bz - az) / len) * half;
    const nz = ((bx - ax) / len) * half;
    // Two triangles, wound to face up.
    push(ax + nx, az + nz);
    push(bx + nx, bz + nz);
    push(bx - nx, bz - nz);
    push(ax + nx, az + nz);
    push(bx - nx, bz - nz);
    push(ax - nx, az - nz);
  }
  // A disc at every bend fills the gaps between straight pieces.
  for (let i = 0; i < flat.length; i += 2) {
    const steps = 10;
    for (let s = 0; s < steps; s++) {
      const a1 = (s / steps) * Math.PI * 2;
      const a2 = ((s + 1) / steps) * Math.PI * 2;
      push(flat[i], flat[i + 1]);
      push(flat[i] + Math.cos(a2) * half, flat[i + 1] + Math.sin(a2) * half);
      push(flat[i] + Math.cos(a1) * half, flat[i + 1] + Math.sin(a1) * half);
    }
  }
}

/** A snowy pine tree. */
function addPine(target: THREE.Group, x: number, z: number, size: number, materials: { trunk: THREE.Material; leaves: THREE.Material; snow: THREE.Material }) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * size, 0.2 * size, 1.2 * size, 6), materials.trunk);
  trunk.position.set(x, 0.6 * size, z);
  target.add(trunk);
  [0, 1, 2].forEach((layer) => {
    const radius = (1.5 - layer * 0.4) * size;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.6 * size, 7), materials.leaves);
    cone.position.set(x, (1.6 + layer * 0.9) * size, z);
    target.add(cone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.55, 0.7 * size, 7), materials.snow);
    cap.position.set(x, (2.05 + layer * 0.9) * size, z);
    target.add(cap);
  });
}

/** A big decorated Christmas tree with glowing baubles and a star. */
function christmasTree(x: number, z: number) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const green = new THREE.MeshLambertMaterial({ color: "#1d6b3a" });
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5 - i * 0.85, 3.6, 10), green);
    cone.position.y = 2.6 + i * 2.1;
    tree.add(cone);
  }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 8), new THREE.MeshLambertMaterial({ color: "#5a3420" }));
  trunk.position.y = 1;
  tree.add(trunk);

  const colors = ["#ff4d6a", "#ffd27a", "#7fd3ff", "#ffffff", "#ff9a3c"];
  const random = seeded(3);
  const bulb = new THREE.SphereGeometry(0.28, 8, 6);
  for (let i = 0; i < 90; i++) {
    const h = random();
    const y = 1.4 + h * 10;
    const radius = (1 - h) * 4.6 + 0.3;
    const angle = random() * Math.PI * 2;
    const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
    const ball = new THREE.Mesh(bulb, material);
    ball.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    tree.add(ball);
  }

  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1.1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(star, { depth: 0.3, bevelEnabled: false }),
    new THREE.MeshBasicMaterial({ color: "#ffd94a" }),
  );
  starMesh.position.y = 13.3;
  starMesh.name = "tree-star";
  tree.add(starMesh);
  return tree;
}

/** A little stone sign with a wreath outside her building, and a floating label above it. */
function homeSign(map: MapData, home: Home, keep: <T extends { dispose: () => void }>(thing: T) => T) {
  const sign = new THREE.Group();
  sign.position.set(home.x, 0, home.z);
  // Face west, towards Bay Street.
  const [bc, , , bq] = map.corners;
  const southX = bq[0] - bc[0];
  const southZ = bq[1] - bc[1];
  const length = Math.hypot(southX, southZ);
  const westX = -southZ / length;
  const westZ = southX / length;
  sign.rotation.y = Math.atan2(westX, westZ);

  const stone = new THREE.Mesh(keep(new THREE.BoxGeometry(2.6, 1.15, 0.45)), keep(new THREE.MeshLambertMaterial({ color: "#5b4636" })));
  stone.position.y = 0.58;
  sign.add(stone);
  const cap = new THREE.Mesh(keep(new THREE.BoxGeometry(2.8, 0.12, 0.6)), keep(new THREE.MeshLambertMaterial({ color: "#f4f7fb" })));
  cap.position.y = 1.2;
  sign.add(cap);
  const text = keep(textTexture(home.sign, { bg: "#2a1d16", color: "#f3c969", font: 62 }));
  const face = keep(new THREE.MeshBasicMaterial({ map: text }));
  const plate = keep(new THREE.PlaneGeometry(2.35, 0.45));
  [1, -1].forEach((side) => {
    const p = new THREE.Mesh(plate, face);
    p.position.set(0, 0.68, side * 0.231);
    if (side < 0) p.rotation.y = Math.PI;
    sign.add(p);
  });

  // A wreath with a red bow on top.
  const wreath = new THREE.Mesh(keep(new THREE.TorusGeometry(0.28, 0.09, 8, 20)), keep(new THREE.MeshLambertMaterial({ color: "#1d6b3a" })));
  wreath.position.set(0, 1.62, 0);
  sign.add(wreath);
  const bow = new THREE.Mesh(keep(new THREE.SphereGeometry(0.09, 8, 6)), keep(new THREE.MeshBasicMaterial({ color: "#e0283f" })));
  bow.position.set(0, 1.36, 0.06);
  sign.add(bow);

  const label = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: keep(textTexture(home.label, { color: "#ffd1dc", font: 58 })), depthWrite: false })));
  label.scale.set(3.4, 0.64, 1);
  label.position.y = 2.6;
  sign.add(label);
  return sign;
}

function centroid(flat: number[]) {
  let x = 0;
  let z = 0;
  for (let i = 0; i < flat.length; i += 2) {
    x += flat[i];
    z += flat[i + 1];
  }
  return [x / (flat.length / 2), z / (flat.length / 2)];
}

function area(flat: number[]) {
  let a = 0;
  const n = flat.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += flat[i * 2] * flat[j * 2 + 1] - flat[j * 2] * flat[i * 2 + 1];
  }
  return Math.abs(a / 2);
}

export type World = {
  group: THREE.Group;
  /** Walls and roofs, so the camera can avoid going inside buildings. */
  solids: THREE.Object3D[];
  /** Spins the star on top of the tree. */
  update: (time: number) => void;
  dispose: () => void;
};

/** Her home: where the "711 Bay Street" sign stands, and what it says. */
export type Home = { x: number; z: number; sign: string; label: string };

/**
 * `map` is already shrunk by `scale`. People-sized things (signs, trees)
 * stay full size; only the city is shrunk.
 */
export function buildWorld(map: MapData, scale: number, home: Home): World {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(thing: T) => (disposables.push(thing), thing);
  const walkFlat = map.walk.flat();

  // Snowy ground everywhere, fading into the fog.
  const ground = new THREE.Mesh(
    keep(new THREE.CircleGeometry(1400, 48)),
    keep(new THREE.MeshLambertMaterial({ color: "#e3e8ef" })),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // Parks: brighter fresh snow with pine trees. Squares: paving stones.
  const flats = newBuffers();
  const parkSnow = new THREE.Color("#f7f9fc");
  const paving = new THREE.Color("#c9c2b8");
  for (const park of map.parks) addFlat(flats, park.p, 0.015, parkSnow);
  for (const plaza of map.plazas) addFlat(flats, plaza.p, 0.012, paving);

  // Streets, with a yellow line down the middle of the main ones.
  const asphalt = new THREE.Color("#3d4250");
  const yellow = new THREE.Color("#f2c14e");
  const lines = newBuffers();
  for (const road of map.roads) {
    addRibbon(flats, road.p, road.w, 0.03, asphalt);
    if (road.m) addRibbon(lines, road.p, 0.35, 0.045, yellow);
  }
  const flatMaterial = keep(new THREE.MeshLambertMaterial({ vertexColors: true }));
  // Draw the streets on top of the ground without flickering.
  flatMaterial.polygonOffset = true;
  flatMaterial.polygonOffsetFactor = -1;
  group.add(new THREE.Mesh(keep(toGeometry(flats)), flatMaterial));
  const lineMaterial = keep(new THREE.MeshBasicMaterial({ vertexColors: true }));
  lineMaterial.polygonOffset = true;
  lineMaterial.polygonOffsetFactor = -2;
  group.add(new THREE.Mesh(keep(toGeometry(lines)), lineMaterial));

  // Buildings, with their windows, shops, awnings and rooftops.
  const buildings = addBuildings(group, map, scale);
  disposables.push(buildings);

  // Real shop and restaurant signs, styled for what each place is.
  const storefronts = addStorefronts(map, scale, SHOP_HEIGHT);
  group.add(storefronts.group);
  disposables.push(storefronts);

  // Eaton Centre's glass roof, the Yonge & Dundas screens, theatre marquees...
  const landmarks = addLandmarks(map, scale);
  group.add(landmarks.group);
  disposables.push(landmarks);

  // Pine trees in the parks.
  const pineMaterials = {
    trunk: keep(new THREE.MeshLambertMaterial({ color: "#5a3a26" })),
    leaves: keep(new THREE.MeshLambertMaterial({ color: "#1f5e3a" })),
    snow: keep(new THREE.MeshLambertMaterial({ color: "#f4f7fb" })),
  };
  const trees = new THREE.Group();
  const treeRandom = seeded(5);
  for (const park of map.parks) {
    const count = Math.min(10, Math.floor(area(park.p) / 250));
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < park.p.length; i += 2) {
      minX = Math.min(minX, park.p[i]);
      maxX = Math.max(maxX, park.p[i]);
      minZ = Math.min(minZ, park.p[i + 1]);
      maxZ = Math.max(maxZ, park.p[i + 1]);
    }
    for (let placed = 0, tries = 0; placed < count && tries < 60; tries++) {
      const x = minX + treeRandom() * (maxX - minX);
      const z = minZ + treeRandom() * (maxZ - minZ);
      if (!insidePolygon(x, z, park.p)) continue;
      addPine(trees, x, z, 0.8 + treeRandom() * 0.6, pineMaterials);
      placed++;
    }
  }
  group.add(trees);

  // The big Christmas tree goes in the largest park she can walk to.
  const reachable = map.parks
    .filter((park) => {
      const [x, z] = centroid(park.p);
      return insidePolygon(x, z, walkFlat);
    })
    .sort((a, b) => area(b.p) - area(a.p));
  const treeSpot = reachable[0] ? centroid(reachable[0].p) : map.spawn;
  const bigTree = christmasTree(treeSpot[0], treeSpot[1]);
  group.add(bigTree);
  const star = bigTree.getObjectByName("tree-star")!;

  // Street signs at the crossings: a pole with a blue sign for each street.
  const poleMaterial = keep(new THREE.MeshLambertMaterial({ color: "#3a3f47" }));
  const poleGeometry = keep(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6));
  const [bc, , , bq] = map.corners;
  // The direction Bay and Yonge run in (Toronto's grid is tilted from north).
  const northSouth = Math.atan2(bq[0] - bc[0], bq[1] - bc[1]);
  for (const sign of map.signs) {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    // Stand it on the corner, not in the middle of the road.
    const offset = 9 * scale;
    const px = sign.x + Math.cos(northSouth) * offset + Math.sin(northSouth) * offset;
    const pz = sign.z - Math.sin(northSouth) * offset + Math.cos(northSouth) * offset;
    pole.position.set(px, 1.8, pz);
    group.add(pole);
    const [first, second] = sign.names;
    const runsNorthSouth = (name: string) => /^(Bay|Yonge|James|Elizabeth|Victoria|Church)/.test(name);
    const ordered = runsNorthSouth(second) ? [second, first] : [first, second];
    ordered.forEach((name, i) => {
      const texture = keep(textTexture(name, { bg: "#1f4e9e", font: 50 }));
      const material = keep(new THREE.MeshBasicMaterial({ map: texture }));
      const geometry = keep(new THREE.PlaneGeometry(2.6, 0.5));
      // Two faces back to back, so the name reads the right way from both sides.
      [0, Math.PI].forEach((flip) => {
        const blade = new THREE.Mesh(geometry, material);
        blade.position.set(px, 3.35 - i * 0.6, pz);
        blade.rotation.y = northSouth + (i === 0 ? Math.PI / 2 : 0) + flip;
        group.add(blade);
      });
    });
  }

  // Floating names over a few famous buildings.
  for (const building of map.buildings) {
    const label = building.n && LANDMARKS[building.n];
    if (!label) continue;
    const [x, z] = centroid(building.p);
    const texture = keep(textTexture(label, { color: "#ffe3a6", font: 60 }));
    const sprite = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: texture, depthWrite: false })));
    sprite.scale.set(22, 4.1, 1);
    sprite.position.set(x, building.h + 6, z);
    group.add(sprite);
  }

  group.add(homeSign(map, home, keep));

  return {
    group,
    solids: buildings.solids,
    update: (time) => {
      star.rotation.y = time * 0.8;
      storefronts.update(time);
      landmarks.update(time);
    },
    dispose: () => {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((m: THREE.Material) => m.dispose());
        }
      });
      disposables.forEach((d) => d.dispose());
    },
  };
}
