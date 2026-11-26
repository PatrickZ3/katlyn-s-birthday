import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { insidePolygon, type MapData, type Shape } from "./geo";

/**
 * Draws the buildings so they don't all look the same: seven wall styles
 * (glass towers, condos with balconies, punched windows, brick, ribbon
 * windows, stone, cladding panels), each in two versions, colours and
 * materials from OpenStreetMap where it has them, shopfronts with awnings and
 * Christmas lights along Yonge, ledges, stone bands, glass fins, roof walls,
 * rooftop lights and machinery, antennas on the tallest towers, and Old City
 * Hall's clock tower.
 */

type Style = "glass" | "windows" | "brick" | "ribbon" | "stone" | "condo" | "panel";
const STYLES: Style[] = ["glass", "windows", "brick", "ribbon", "stone", "condo", "panel"];
/** Each style is drawn in this many versions, so neighbours don't look identical. */
const VARIANTS = 2;

/** Hand-picked looks for famous buildings, so they're recognisable. */
const LANDMARK_LOOKS: Record<string, { style: Style; color: string }> = {
  "Old City Hall": { style: "stone", color: "#c9ae86" },
  "CF Toronto Eaton Centre": { style: "ribbon", color: "#e4e4e2" },
  "College Park": { style: "stone", color: "#d8c7a0" },
  "Massey Hall": { style: "brick", color: "#b0563f" },
  "Hudson's Bay/Saks Fifth Avenue": { style: "stone", color: "#d8cdb5" },
  "Toronto Police Headquarters": { style: "stone", color: "#c79b8a" },
  "Ed Mirvish Theatre": { style: "stone", color: "#e2d6c0" },
  "Church of the Holy Trinity": { style: "brick", color: "#a04a38" },
  Atrium: { style: "glass", color: "#9fb4c4" },
  "Chelsea Hotel, Toronto": { style: "windows", color: "#ddd3c4" },
  "Confederation Life Building": { style: "brick", color: "#b5654c" },
};

const PALETTES: Record<Style, string[]> = {
  glass: ["#86a6c2", "#6f8aa3", "#9cbccc", "#7c9a96", "#5d6f82", "#a9bfd0"],
  windows: ["#d9cfbd", "#c8c2b8", "#e6dcc8", "#b9b4ac", "#d6c7a6"],
  brick: ["#a65a4b", "#b5654c", "#8f4a3c", "#c27a5c", "#9c5845", "#7d4a3e"],
  ribbon: ["#c9c9c4", "#b0aca4", "#e0ddd6", "#9fa3a8"],
  stone: ["#d2bf98", "#c9ae86", "#bfb39c", "#d8cdb5"],
  condo: ["#eef1f3", "#dfe5ea", "#e9e4dc", "#d0d8de"],
  panel: ["#c9ced6", "#d8c9b4", "#a9b8c2", "#c7b8a8", "#b8c4b0", "#d4cfc4"],
};

/** Each style's window pattern covers this many real metres across and up per repeat. */
const TILE: Record<Style, [number, number]> = {
  glass: [8, 14],
  windows: [10, 12],
  brick: [10, 12],
  ribbon: [10, 12],
  stone: [10, 14],
  condo: [12, 12],
  panel: [10, 12],
};
/** How tall the shopfronts along Yonge are, in real metres. */
export const SHOP_HEIGHT = 3.8;
const SHOP_TILE = 6;

export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function texture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/**
 * The wall picture for a style, drawn twice: once as the wall (white parts
 * take the building's colour) and once as the glow of lit windows. `variant`
 * changes the window layout, so the same style still varies street to street.
 */
function styleTextures(style: Style, seed: number, variant: number) {
  const random = seeded(seed);
  const lit = Array.from({ length: 64 }, () => random() < 0.32);
  const shades = Array.from({ length: 64 }, () => random());
  const draw = (glow: boolean) => (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = glow ? "#000" : "#fff";
    ctx.fillRect(0, 0, 256, 256);
    const paneColor = (i: number) => (glow ? (lit[i % 64] ? "#ffcf7a" : "#000") : lit[i % 64] ? "#ffe3a6" : "#3c4a5f");
    const pane = (x: number, y: number, w: number, h: number, i: number) => {
      ctx.fillStyle = paneColor(i);
      ctx.fillRect(x, y, w, h);
    };

    if (style === "glass") {
      // A curtain wall: glass everywhere, thin mullions, a dark slab line at each floor.
      if (!glow) {
        const g = ctx.createLinearGradient(0, 0, 256, 256);
        g.addColorStop(0, variant ? "#e6f2ee" : "#f2f6fa");
        g.addColorStop(1, variant ? "#9fb5b0" : "#b7c3cf");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }
      const cols = variant ? 4 : 8;
      const cw = 256 / cols;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * 8 + col;
          if (lit[i]) pane(col * cw + 2, row * 64 + (variant ? 14 : 6), cw - 4, variant ? 40 : 52, i);
        }
      }
      if (!glow) {
        ctx.fillStyle = "rgba(60,70,82,0.55)";
        for (let col = 0; col < cols; col++) ctx.fillRect(col * cw, 0, variant ? 4 : 2, 256);
        // Variant 1 has wide opaque spandrel bands between floors.
        ctx.fillStyle = variant ? "rgba(70,84,92,0.75)" : "rgba(45,52,62,0.7)";
        for (let row = 0; row < 4; row++) ctx.fillRect(0, row * 64, 256, variant ? 14 : 6);
      }
      return;
    }

    if (style === "condo") {
      // Glass condo floors with white balcony slabs and glass railings.
      for (let row = 0; row < 4; row++) {
        const y = row * 64;
        if (!glow) {
          ctx.fillStyle = "#4a5f70";
          ctx.fillRect(0, y + 10, 256, 54);
        }
        for (let col = 0; col < 4; col++) {
          const i = row * 4 + col;
          if (lit[i]) pane(col * 64 + 4, y + 12, 56, 30, i);
        }
        if (!glow) {
          // Slab edge, its shadow, and the frosted railing.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, y, 256, 10);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(0, y + 10, 256, 3);
          ctx.fillStyle = "rgba(220,235,245,0.45)";
          ctx.fillRect(0, y + 42, 256, 22);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(0, y + 42, 256, 2);
          // Walls between units, every other bay on variant 1.
          for (let col = 0; col < 4; col += variant ? 2 : 1) ctx.fillRect(col * 64, y + 10, 5, 54);
        }
      }
      return;
    }

    if (style === "panel") {
      // Cladding panels in slightly different tones, with square windows.
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const i = row * 4 + col;
          const x = col * 64;
          const y = row * 64;
          if (!glow) {
            const tone = Math.round(205 + shades[i] * 50);
            ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
            ctx.fillRect(x, y, 64, 64);
            ctx.fillStyle = "rgba(0,0,0,0.18)";
            ctx.fillRect(x, y, 64, 2);
            ctx.fillRect(x, y, 2, 64);
          }
          const w = variant ? 40 : 26;
          const off = variant ? 12 : 8 + Math.floor(shades[(i + 7) % 64] * 28);
          pane(x + off, y + 14, w, 34, i);
        }
      }
      return;
    }

    if (style === "brick" && !glow) {
      // Rows of bricks with light mortar.
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      for (let y = 0; y < 256; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
        for (let x = (y / 8) % 2 ? 0 : 8; x < 256; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 8);
          ctx.stroke();
        }
      }
    }
    if (style === "stone" && !glow) {
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      for (let y = 0; y < 256; y += 16) ctx.fillRect(0, y, 256, 1);
      if (variant) {
        // Pilasters between the window columns.
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (let x = 0; x < 256; x += 64) ctx.fillRect(x, 0, 8, 256);
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        for (let x = 8; x < 256; x += 64) ctx.fillRect(x, 0, 2, 256);
      }
    }

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const i = row * 4 + col;
        const x = col * 64;
        const y = row * 64;
        if (style === "ribbon") {
          // A continuous band of windows along each floor.
          const top = variant ? 12 : 18;
          const h = variant ? 40 : 30;
          if (col === 0 && !glow) {
            ctx.fillStyle = "#3c4a5f";
            ctx.fillRect(0, y + top, 256, h);
          }
          pane(x + 3, y + top, 58, h, i);
          if (!glow) {
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect(x, y + top, 3, h);
            if (variant) ctx.fillRect(x + 31, y + top, 2, h);
          }
        } else if (style === "brick") {
          if (variant) {
            // Arched windows with a stone keystone.
            if (!glow) {
              ctx.fillStyle = "#e9dfcf";
              ctx.beginPath();
              ctx.moveTo(x + 17, y + 54);
              ctx.lineTo(x + 17, y + 26);
              ctx.arc(x + 32, y + 26, 15, Math.PI, 0);
              ctx.lineTo(x + 47, y + 54);
              ctx.fill();
            }
            ctx.fillStyle = paneColor(i);
            ctx.beginPath();
            ctx.moveTo(x + 21, y + 52);
            ctx.lineTo(x + 21, y + 27);
            ctx.arc(x + 32, y + 27, 11, Math.PI, 0);
            ctx.lineTo(x + 43, y + 52);
            ctx.fill();
          } else {
            // Smaller windows with white frames and a sill.
            if (!glow) {
              ctx.fillStyle = "#f4f1ea";
              ctx.fillRect(x + 18, y + 12, 28, 40);
            }
            pane(x + 21, y + 15, 22, 34, i);
            if (!glow) ctx.fillRect(x + 15, y + 52, 34, 4);
          }
        } else if (style === "stone") {
          if (variant) {
            // Tall rectangular windows with a lintel.
            pane(x + 22, y + 14, 22, 40, i);
            if (!glow) {
              ctx.fillStyle = "rgba(255,255,255,0.5)";
              ctx.fillRect(x + 18, y + 9, 30, 5);
            }
          } else {
            // Tall windows with rounded tops.
            ctx.fillStyle = paneColor(i);
            ctx.beginPath();
            ctx.moveTo(x + 22, y + 58);
            ctx.lineTo(x + 22, y + 22);
            ctx.arc(x + 32, y + 22, 10, Math.PI, 0);
            ctx.lineTo(x + 42, y + 58);
            ctx.fill();
          }
        } else if (variant) {
          // Pairs of narrow windows with a shared frame.
          if (!glow) {
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fillRect(x + 10, y + 10, 44, 44);
          }
          pane(x + 13, y + 13, 18, 38, i);
          pane(x + 33, y + 13, 18, 38, i + 17);
        } else {
          pane(x + 16, y + 12, 32, 40, i);
          if (!glow) {
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            ctx.fillRect(x + 16, y + 12, 32, 4);
          }
        }
      }
    }
  };
  return [texture(256, 256, draw(false)), texture(256, 256, draw(true))];
}

/** A shop window: lit display, a door, and a coloured sign band on top. */
function shopTextures() {
  const random = seeded(19);
  const signs = ["#c4183a", "#1d7a3a", "#1f4e9e", "#e8a33c", "#7a3fa0", "#2b2b2b"];
  const draw = (glow: boolean) => (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = glow ? "#000" : "#3a3a3e";
    ctx.fillRect(0, 0, 512, 128);
    for (let shop = 0; shop < 2; shop++) {
      const x = shop * 256;
      if (!glow) {
        ctx.fillStyle = signs[Math.floor(random() * signs.length)];
        ctx.fillRect(x + 4, 4, 248, 24);
      }
      // Display windows, glowing warm.
      const g = ctx.createLinearGradient(0, 34, 0, 124);
      g.addColorStop(0, glow ? "#ffd58a" : "#fff1cf");
      g.addColorStop(1, glow ? "#b8752e" : "#e8b46a");
      ctx.fillStyle = g;
      ctx.fillRect(x + 10, 34, 150, 88);
      ctx.fillRect(x + 196, 34, 52, 88);
      if (!glow) {
        // Things on display.
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = signs[Math.floor(random() * signs.length)];
          ctx.fillRect(x + 20 + k * 34, 86 - random() * 30, 22, 40);
        }
        ctx.fillStyle = "#2a2522";
        ctx.fillRect(x + 166, 40, 26, 84);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(x + 10, 34, 150, 4);
      }
    }
  };
  return [texture(512, 128, draw(false)), texture(512, 128, draw(true))];
}

type Buffers = { position: number[]; normal: number[]; color: number[]; uv: number[] };
const buffers = (): Buffers => ({ position: [], normal: [], color: [], uv: [] });

function geometryOf(b: Buffers) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(b.position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(b.normal, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(b.color, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
  return g;
}

/** One wall from a to b, between heights y0 and y1, facing along (nx, nz). */
function addWall(
  b: Buffers,
  [ax, az]: number[],
  [bx, bz]: number[],
  y0: number,
  y1: number,
  [nx, nz]: number[],
  color: THREE.Color,
  uv: [number, number, number, number],
) {
  const [u0, u1, v0, v1] = uv;
  const corners = [
    [ax, y0, az, u0, v0],
    [bx, y0, bz, u1, v0],
    [bx, y1, bz, u1, v1],
    [ax, y1, az, u0, v1],
  ];
  const outward = -(bz - az) * nx + (bx - ax) * nz >= 0;
  for (const k of outward ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]) {
    const [x, y, z, u, v] = corners[k];
    b.position.push(x, y, z);
    b.normal.push(nx, 0, nz);
    b.color.push(color.r, color.g, color.b);
    b.uv.push(u, v);
  }
}

function addRoof(b: Buffers, flat: number[], y: number, color: THREE.Color, facingDown = false) {
  const contour: THREE.Vector2[] = [];
  for (let i = 0; i < flat.length; i += 2) contour.push(new THREE.Vector2(flat[i], flat[i + 1]));
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    const [a, c2, c3] = [contour[i], contour[j], contour[k]];
    const up = (c2.x - a.x) * (c3.y - a.y) - (c2.y - a.y) * (c3.x - a.x) < 0;
    for (const p of up !== facingDown ? [a, c2, c3] : [a, c3, c2]) {
      b.position.push(p.x, y, p.y);
      b.normal.push(0, facingDown ? -1 : 1, 0);
      b.color.push(color.r, color.g, color.b);
      b.uv.push(0, 0);
    }
  }
}

/** Each side of a footprint, with its outward direction. */
export function edgesOf(flat: number[]) {
  const n = flat.length / 2;
  const edges: { a: number[]; b: number[]; normal: number[]; length: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = [flat[i * 2], flat[i * 2 + 1]];
    const b = [flat[((i + 1) % n) * 2], flat[((i + 1) % n) * 2 + 1]];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 0.01) continue;
    let normal = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
    if (insidePolygon((a[0] + b[0]) / 2 + normal[0] * 0.05, (a[1] + b[1]) / 2 + normal[1] * 0.05, flat)) {
      normal = [-normal[0], -normal[1]];
    }
    edges.push({ a, b, normal, length });
  }
  return edges;
}

export function centroid(flat: number[]) {
  let x = 0;
  let z = 0;
  for (let i = 0; i < flat.length; i += 2) {
    x += flat[i];
    z += flat[i + 1];
  }
  return [x / (flat.length / 2), z / (flat.length / 2)];
}

export function area(flat: number[]) {
  let a = 0;
  const n = flat.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += flat[i * 2] * flat[j * 2 + 1] - flat[j * 2] * flat[i * 2 + 1];
  }
  return Math.abs(a / 2);
}

/** Reads an OpenStreetMap colour like "beige" or "#a0522d", or null if it isn't one. */
function osmColor(value: string | undefined) {
  if (!value || !/^(#[0-9a-f]{3,6}|[a-z]+)$/i.test(value.trim())) return null;
  const c = new THREE.Color();
  try {
    c.setStyle(value.trim().toLowerCase(), THREE.SRGBColorSpace);
  } catch {
    return null;
  }
  // Map colours are often pure ("red", "#002387"), which looks cartoonish.
  // Soften them towards real paint and glass, and keep some brightness so windows show.
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(hsl.s, 0.45) * 0.75, Math.min(0.85, Math.max(0.32, hsl.l)));
  return c;
}

function styleFor(shape: Shape, random: () => number): Style {
  const material = shape.m ?? "";
  if (/glass|metal/.test(material)) return "glass";
  if (/brick/.test(material)) return "brick";
  if (/stone|granite|limestone|sandstone|marble/.test(material)) return "stone";
  if (/concrete|plaster/.test(material)) return (["ribbon", "windows", "panel"] as Style[])[Math.floor(random() * 3)];
  const h = shape.h;
  const r = random();
  if (h > 55) return r < 0.45 ? "glass" : r < 0.75 ? "condo" : "ribbon";
  if (h > 20) return (["windows", "ribbon", "glass", "brick", "panel", "condo"] as Style[])[Math.floor(r * 6)];
  return (["brick", "windows", "stone", "brick", "panel"] as Style[])[Math.floor(r * 5)];
}

/** Twice the signed area: positive when the outline runs one way round, negative the other. */
function winding(flat: number[]) {
  let a = 0;
  const n = flat.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += flat[i * 2] * flat[j * 2 + 1] - flat[j * 2] * flat[i * 2 + 1];
  }
  return a;
}

/**
 * The outline moved inwards by `d`. Pieces of the same building often share
 * a wall exactly; nudging them apart stops their windows flickering.
 */
function insetFlat(flat: number[], d: number) {
  const n = flat.length / 2;
  if (d <= 0 || n < 3) return flat;
  const sign = winding(flat) > 0 ? 1 : -1;
  const normals: number[][] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = flat[j * 2] - flat[i * 2];
    const dz = flat[j * 2 + 1] - flat[i * 2 + 1];
    const len = Math.hypot(dx, dz);
    normals.push(len < 1e-6 ? [0, 0] : [(sign * dz) / len, (-sign * dx) / len]);
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const n1 = normals[(i + n - 1) % n];
    const n2 = normals[i];
    const sx = n1[0] + n2[0];
    const sz = n1[1] + n2[1];
    // The miter: longer on sharp corners, but capped so spikes don't fly off.
    const k = Math.max(0.5, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
    out.push(flat[i * 2] - (sx * d) / k, flat[i * 2 + 1] - (sz * d) / k);
  }
  return out;
}

/** A flat four-cornered face, wound so it faces along `normal`. */
function addQuad(b: Buffers, corners: number[][], normal: number[], color: THREE.Color) {
  const [p0, p1, p2] = corners;
  const ux = p1[0] - p0[0];
  const uy = p1[1] - p0[1];
  const uz = p1[2] - p0[2];
  const vx = p2[0] - p0[0];
  const vy = p2[1] - p0[1];
  const vz = p2[2] - p0[2];
  const facing = (uy * vz - uz * vy) * normal[0] + (uz * vx - ux * vz) * normal[1] + (ux * vy - uy * vx) * normal[2];
  for (const k of facing >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]) {
    b.position.push(...corners[k]);
    b.normal.push(...normal);
    b.color.push(color.r, color.g, color.b);
    b.uv.push(0, 0);
  }
}

export type BuildingsResult = { meshes: THREE.Object3D[]; solids: THREE.Mesh[]; dispose: () => void };

type DrawOptions = {
  /** The famous building this piece belongs to, so it takes that building's look. */
  parentName?: string;
  /** Extra inset, in map units. */
  inset?: number;
  /** A filler block for the gaps in a building OpenStreetMap only partly describes: walls and roof only. */
  filler?: boolean;
};

/**
 * Adds every building to `group`. Positions are already scaled; `scale` turns
 * them back into real metres so windows and floors stay the right size.
 */
export function addBuildings(group: THREE.Group, map: MapData, scale: number): BuildingsResult {
  const walls: Record<string, Buffers> = {};
  const wallsFor = (style: Style, variant: number) => (walls[`${style}:${variant}`] ??= buffers());
  const shops = buffers();
  const roofs = buffers();
  const awnings = buffers();
  const trims = buffers();
  const crowns = buffers();
  const crownColor = new THREE.Color("#cfeaff");
  const lights: number[] = [];
  const lightColors: number[] = [];
  const boxes: THREE.BufferGeometry[] = [];
  const random = seeded(11);
  const snow = new THREE.Color("#f4f7fb");
  const awningColors = ["#c4183a", "#1d7a3a", "#1f4e9e", "#e8a33c", "#7a3fa0"].map((c) => new THREE.Color(c));
  const bulbColors = ["#ff4d6a", "#ffd27a", "#7fd3ff", "#ffffff", "#8dff9a"].map((c) => new THREE.Color(c));
  const warmBulbs = ["#ffd27a", "#fff1c9", "#ffb347"].map((c) => new THREE.Color(c));
  const tallest = Math.max(...map.buildings.map((b) => b.h), ...(map.parts ?? []).map((p) => p.h)) / scale;

  const drawShape = (shape: Shape, options: DrawOptions = {}) => {
    // A piece of a famous building takes the building's look, unless the map gives it its own colour.
    const lookName = shape.n ?? (shape.c || shape.m ? undefined : options.parentName);
    const landmark = lookName ? LANDMARK_LOOKS[lookName] : undefined;
    const style = landmark?.style ?? styleFor({ ...shape, h: shape.h / scale }, random);
    const variant = Math.floor(random() * VARIANTS);
    const color =
      (landmark && new THREE.Color(landmark.color)) ??
      osmColor(shape.c) ??
      new THREE.Color(PALETTES[style][Math.floor(random() * PALETTES[style].length)]);
    const bottom = shape.b ?? 0;
    const top = shape.h;
    const realTop = top / scale;
    const realBottom = bottom / scale;
    // Taller pieces sit further out, so where two share a wall the taller one shows.
    const inset = (0.02 + 0.12 * (1 - Math.min(1, realTop / tallest))) * scale + (options.inset ?? 0);
    const flat = insetFlat(shape.p, inset);
    const [tileW, tileH] = TILE[style];
    const hasShops = shape.s === 1 && bottom === 0 && realTop > 6;
    const shopTop = SHOP_HEIGHT * scale;
    const edges = edgesOf(flat);
    const wallBuffers = wallsFor(style, variant);
    const trim = color.clone().multiplyScalar(0.8);
    const extras = !options.filler;
    // Some low buildings get a string of warm lights along the roof edge.
    const roofLights = extras && realTop < 35 && random() < 0.35;
    const fins = extras && style === "glass" && realTop > 40 && random() < 0.5;
    let along = 0;

    for (const edge of edges) {
      const realLength = edge.length / scale;
      const u0 = along / tileW;
      const u1 = (along + realLength) / tileW;
      along += realLength;
      const [nx, nz] = edge.normal;
      const shopHere = hasShops && realLength > 3;
      const wallFrom = shopHere ? shopTop : bottom;
      addWall(wallBuffers, edge.a, edge.b, wallFrom, top, edge.normal, color, [
        u0,
        u1,
        wallFrom / scale / tileH,
        realTop / tileH,
      ]);

      if (shopHere) {
        const shopU = realLength / SHOP_TILE;
        addWall(shops, edge.a, edge.b, 0, shopTop, edge.normal, new THREE.Color("#ffffff"), [0, shopU, 0, 1]);

        // An awning over the shop windows, with a string of Christmas lights along its edge.
        if (realLength > 5 && extras) {
          const insetEnds = 0.6 * scale;
          const dx = (edge.b[0] - edge.a[0]) / edge.length;
          const dz = (edge.b[1] - edge.a[1]) / edge.length;
          const a = [edge.a[0] + dx * insetEnds, edge.a[1] + dz * insetEnds];
          const b = [edge.b[0] - dx * insetEnds, edge.b[1] - dz * insetEnds];
          const out = 1.3 * scale;
          const hi = shopTop - 0.15 * scale;
          const lo = hi - 0.7 * scale;
          const c = awningColors[Math.floor(random() * awningColors.length)];
          const quad = [
            [a[0], hi, a[1]],
            [b[0], hi, b[1]],
            [b[0] + nx * out, lo, b[1] + nz * out],
            [a[0] + nx * out, lo, a[1] + nz * out],
          ];
          for (const k of [0, 1, 2, 0, 2, 3]) {
            awnings.position.push(...quad[k]);
            awnings.normal.push(nx * 0.5, 0.85, nz * 0.5);
            awnings.color.push(c.r, c.g, c.b);
            awnings.uv.push(0, 0);
          }
          const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (let t = 0; t <= span; t += 0.5 * scale) {
            const bulb = bulbColors[lights.length % bulbColors.length];
            lights.push(a[0] + dx * t + nx * out, lo - 0.05, a[1] + dz * t + nz * out);
            lightColors.push(bulb.r, bulb.g, bulb.b);
          }
        }
      }
      if (!extras) continue;

      const outAt = (d: number) => [
        [edge.a[0] + nx * d, edge.a[1] + nz * d],
        [edge.b[0] + nx * d, edge.b[1] + nz * d],
      ];

      // A ledge around the top of older stone and brick buildings.
      if ((style === "stone" || style === "brick") && realTop < 45) {
        const [a, b] = outAt(0.35 * scale);
        addWall(trims, a, b, top - 0.9 * scale, top, edge.normal, trim, [0, 0, 0, 0]);
        addQuad(trims, [[a[0], top - 0.9 * scale, a[1]], [b[0], top - 0.9 * scale, b[1]], [edge.b[0], top - 0.9 * scale, edge.b[1]], [edge.a[0], top - 0.9 * scale, edge.a[1]]], [0, -1, 0], trim);
      }
      // Stone bands every few floors on older and mid-rise buildings.
      if ((style === "stone" || style === "brick" || style === "windows") && realTop < 70 && realLength > 2) {
        const [a, b] = outAt(0.15 * scale);
        for (let y = Math.max(realBottom, shopHere ? SHOP_HEIGHT : 0) + 0.2; y < realTop - 4; y += 12) {
          addWall(trims, a, b, y * scale, (y + 0.35) * scale, edge.normal, trim, [0, 0, 0, 0]);
          addQuad(trims, [[a[0], (y + 0.35) * scale, a[1]], [b[0], (y + 0.35) * scale, b[1]], [edge.b[0], (y + 0.35) * scale, edge.b[1]], [edge.a[0], (y + 0.35) * scale, edge.a[1]]], [0, 1, 0], snow);
        }
      }
      // Vertical fins up some glass towers, for depth.
      if (fins && realLength > 4) {
        const dx = (edge.b[0] - edge.a[0]) / edge.length;
        const dz = (edge.b[1] - edge.a[1]) / edge.length;
        const depth = 0.4 * scale;
        const half = 0.12 * scale;
        const finColor = color.clone().multiplyScalar(0.7);
        const finBottom = shopHere ? shopTop : bottom;
        for (let t = 2; t < realLength - 1; t += 4) {
          const cx = edge.a[0] + dx * t * scale;
          const cz = edge.a[1] + dz * t * scale;
          const l = [cx - dx * half, cz - dz * half];
          const r = [cx + dx * half, cz + dz * half];
          const lo = [l[0] + nx * depth, l[1] + nz * depth];
          const ro = [r[0] + nx * depth, r[1] + nz * depth];
          addWall(trims, lo, ro, finBottom, top, edge.normal, finColor, [0, 0, 0, 0]);
          addWall(trims, l, lo, finBottom, top, [-dx, -dz], finColor, [0, 0, 0, 0]);
          addWall(trims, ro, r, finBottom, top, [dx, dz], finColor, [0, 0, 0, 0]);
        }
      }
      // A low wall around the roof: outside, inside and a cap.
      if (realTop < 150) {
        const p = 0.9 * scale;
        const thick = 0.3 * scale;
        const [ia, ib] = outAt(-thick);
        addWall(trims, edge.a, edge.b, top, top + p, edge.normal, trim, [0, 0, 0, 0]);
        addWall(trims, ia, ib, top, top + p, [-nx, -nz], trim.clone().multiplyScalar(0.85), [0, 0, 0, 0]);
        addQuad(trims, [[edge.a[0], top + p, edge.a[1]], [edge.b[0], top + p, edge.b[1]], [ib[0], top + p, ib[1]], [ia[0], top + p, ia[1]]], [0, 1, 0], snow);
        if (roofLights) {
          const dx = (edge.b[0] - edge.a[0]) / edge.length;
          const dz = (edge.b[1] - edge.a[1]) / edge.length;
          for (let t = 0; t <= edge.length; t += 0.8 * scale) {
            const bulb = warmBulbs[lights.length % warmBulbs.length];
            lights.push(edge.a[0] + dx * t + nx * 0.05, top + p + 0.08, edge.a[1] + dz * t + nz * 0.05);
            lightColors.push(bulb.r, bulb.g, bulb.b);
          }
        }
      }
    }
    // A band of light around the top of the tallest towers, so the skyline glows.
    if (extras && realTop > 90) {
      for (const edge of edges) {
        const out = 0.08 * scale;
        const a = [edge.a[0] + edge.normal[0] * out, edge.a[1] + edge.normal[1] * out];
        const b = [edge.b[0] + edge.normal[0] * out, edge.b[1] + edge.normal[1] * out];
        addWall(crowns, a, b, top - 2.2 * scale, top - 1.2 * scale, edge.normal, crownColor, [0, 0, 0, 0]);
      }
    }
    addRoof(roofs, flat, top, snow);
    // A floating piece (an overhang or a bridge) gets an underside, so it doesn't look hollow.
    if (bottom > 0) addRoof(trims, flat, bottom, trim, true);
    if (!extras) return;

    // Machinery boxes on bigger roofs, and an antenna on the tallest towers.
    const realArea = area(flat) / (scale * scale);
    if (realTop > 12 && realArea > 150) {
      const [cx, cz] = centroid(flat);
      const count = realArea > 1500 ? 3 : realArea > 500 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const w = (2 + random() * 4) * scale;
        const d = (2 + random() * 4) * scale;
        const h = (1.5 + random() * 2.5) * scale;
        const x = cx + (random() - 0.5) * Math.sqrt(area(flat)) * 0.4;
        const z = cz + (random() - 0.5) * Math.sqrt(area(flat)) * 0.4;
        if (!insidePolygon(x, z, flat)) continue;
        boxes.push(new THREE.BoxGeometry(w, h, d).translate(x, top + h / 2, z));
      }
      if (realTop > 120) {
        boxes.push(new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 14 * scale, 6).translate(cx, top + 7 * scale, cz));
        lights.push(cx, top + 14.3 * scale, cz);
        lightColors.push(1, 0.15, 0.15);
      }
    }
  };

  for (const building of map.buildings) if (!building.x) drawShape(building);
  const split = map.buildings.filter((b) => b.x);
  const partsOf = new Map<Shape, Shape[]>(split.map((b) => [b, []]));
  for (const part of map.parts ?? []) {
    const [px, pz] = centroid(part.p);
    const owner = split.find((b) => insidePolygon(px, pz, b.p));
    if (owner) partsOf.get(owner)!.push(part);
    drawShape(part, { parentName: owner?.n });
  }
  // OpenStreetMap sometimes describes only some pieces of a building, which
  // left holes. Fill the whole outline up to its lowest piece, tucked just
  // inside the real pieces so they still show.
  for (const building of split) {
    const pieces = partsOf.get(building)!.filter((p) => !(p.b && p.b > 0));
    const lowest = pieces.length ? Math.min(...pieces.map((p) => p.h)) : building.h;
    const h = Math.max(3 * scale, Math.min(building.h, lowest) - 0.25 * scale);
    drawShape({ ...building, h, x: undefined }, { inset: 0.25 * scale, filler: true });
  }

  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(thing: T) => (disposables.push(thing), thing);
  const meshes: THREE.Object3D[] = [];
  const solids: THREE.Mesh[] = [];

  for (const [key, b] of Object.entries(walls)) {
    if (b.position.length === 0) continue;
    const [style, variant] = key.split(":");
    const index = STYLES.indexOf(style as Style);
    const [map, glow] = styleTextures(style as Style, 7 + index * 13 + Number(variant) * 101, Number(variant));
    const mesh = new THREE.Mesh(
      keep(geometryOf(b)),
      keep(
        new THREE.MeshLambertMaterial({
          vertexColors: true,
          map: keep(map),
          emissive: new THREE.Color("#ffffff"),
          emissiveMap: keep(glow),
          emissiveIntensity: 0.85,
        }),
      ),
    );
    meshes.push(mesh);
    solids.push(mesh);
  }

  if (shops.position.length) {
    const [map, glow] = shopTextures();
    const shopMesh = new THREE.Mesh(
      keep(geometryOf(shops)),
      keep(new THREE.MeshLambertMaterial({ map: keep(map), emissive: new THREE.Color("#ffffff"), emissiveMap: keep(glow), emissiveIntensity: 1 })),
    );
    meshes.push(shopMesh);
    // The camera mustn't pass through shop windows either.
    solids.push(shopMesh);
  }

  const roofMesh = new THREE.Mesh(keep(geometryOf(roofs)), keep(new THREE.MeshLambertMaterial({ vertexColors: true })));
  meshes.push(roofMesh);
  solids.push(roofMesh);
  if (trims.position.length) {
    meshes.push(new THREE.Mesh(keep(geometryOf(trims)), keep(new THREE.MeshLambertMaterial({ vertexColors: true }))));
  }
  if (crowns.position.length) {
    meshes.push(new THREE.Mesh(keep(geometryOf(crowns)), keep(new THREE.MeshBasicMaterial({ vertexColors: true }))));
  }
  if (awnings.position.length) {
    meshes.push(
      new THREE.Mesh(keep(geometryOf(awnings)), keep(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }))),
    );
  }
  if (boxes.length) {
    const merged = keep(mergeGeometries(boxes.map((b) => b.toNonIndexed()))!);
    boxes.forEach((b) => b.dispose());
    meshes.push(new THREE.Mesh(merged, keep(new THREE.MeshLambertMaterial({ color: "#9a9ea6" }))));
  }
  if (lights.length) {
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(lights, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(lightColors, 3));
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const ctx = dot.getContext("2d")!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const points = new THREE.Points(
      g,
      keep(
        new THREE.PointsMaterial({
          size: 0.32,
          vertexColors: true,
          map: keep(new THREE.CanvasTexture(dot)),
          transparent: true,
          depthWrite: false,
        }),
      ),
    );
    meshes.push(points);
  }

  meshes.push(...oldCityHallTower(map, scale, keep));
  meshes.forEach((m) => group.add(m));

  return { meshes, solids, dispose: () => disposables.forEach((d) => d.dispose()) };
}

/** Old City Hall's clock tower, at the corner of its footprint nearest Bay & Queen. */
function oldCityHallTower(map: MapData, scale: number, keep: <T extends { dispose: () => void }>(t: T) => T) {
  const hall = map.buildings.find((b) => b.n === "Old City Hall");
  // When the map has Old City Hall's own detailed parts, its real tower is already there.
  if (!hall || hall.x) return [];
  const [qx, qz] = map.corners[3];
  let best = [0, 0];
  let bestDistance = Infinity;
  for (let i = 0; i < hall.p.length; i += 2) {
    const d = Math.hypot(hall.p[i] - qx, hall.p[i + 1] - qz);
    if (d < bestDistance) {
      bestDistance = d;
      best = [hall.p[i], hall.p[i + 1]];
    }
  }
  const [cx, cz] = centroid(hall.p);
  const pull = Math.min(1, (16 * scale) / Math.hypot(cx - best[0], cz - best[1]));
  const x = best[0] + (cx - best[0]) * pull;
  const z = best[1] + (cz - best[1]) * pull;
  const [bc, , , bq] = map.corners;
  const angle = Math.atan2(bq[0] - bc[0], bq[1] - bc[1]);

  const tower = new THREE.Group();
  tower.position.set(x, 0, z);
  tower.rotation.y = angle;
  const width = 11 * scale;
  const height = 62 * scale;
  const stone = keep(new THREE.MeshLambertMaterial({ color: "#c9ae86" }));
  const body = new THREE.Mesh(keep(new THREE.BoxGeometry(width, height, width)), stone);
  body.position.y = height / 2;
  tower.add(body);

  const clock = texture(128, 128, (ctx) => {
    ctx.fillStyle = "#c9ae86";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#f8f1dc";
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a2522";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64, 26);
    ctx.moveTo(64, 64);
    ctx.lineTo(90, 72);
    ctx.stroke();
  });
  keep(clock);
  const faceMaterial = keep(new THREE.MeshBasicMaterial({ map: clock }));
  const faceGeometry = keep(new THREE.PlaneGeometry(width * 0.8, width * 0.8));
  for (let side = 0; side < 4; side++) {
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    const a = (side * Math.PI) / 2;
    face.position.set(Math.sin(a) * (width / 2 + 0.05), height - width * 0.7, Math.cos(a) * (width / 2 + 0.05));
    face.rotation.y = a;
    tower.add(face);
  }
  const roof = new THREE.Mesh(
    keep(new THREE.ConeGeometry(width * 0.75, 16 * scale, 4)),
    keep(new THREE.MeshLambertMaterial({ color: "#5f9e8a" })),
  );
  roof.position.y = height + 8 * scale;
  roof.rotation.y = Math.PI / 4;
  tower.add(roof);
  return [tower];
}
