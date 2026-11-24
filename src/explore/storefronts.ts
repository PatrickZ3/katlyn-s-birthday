import * as THREE from "three";
import type { MapData, Poi } from "./geo";
import { type Theme, themeFor } from "./themes";

/**
 * A sign over every real street-level shop and restaurant (from
 * OpenStreetMap), styled for what it is: Korean places get Korean writing,
 * Japanese ones a noren curtain and lantern, Chinese ones red lanterns,
 * kebab shops a döner spit, and so on. Every sign is drawn onto one shared
 * picture so a phone only loads one texture.
 *
 * To change a style, edit `themeFor` in themes.ts.
 */

const SLOT_W = 256;
const SLOT_H = 64;
const COLS = 8;
const ROWS = 32;
/** Sign size in metres (people-sized, not shrunk with the city). */
const SIGN_W = 4.4;
const SIGN_H = 1.1;

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 800) {
  let s = size;
  ctx.font = `${weight} ${s}px "Apple SD Gothic Neo", "Hiragino Sans", "PingFang SC", Nunito, system-ui, sans-serif`;
  while (s > 9 && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `${weight} ${s}px "Apple SD Gothic Neo", "Hiragino Sans", "PingFang SC", Nunito, system-ui, sans-serif`;
  }
}

function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, poi: Poi, theme: Theme) {
  const pad = 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = theme.bg;
  ctx.beginPath();
  ctx.roundRect(pad, pad, SLOT_W - pad * 2, SLOT_H - pad * 2, 8);
  ctx.fill();
  ctx.strokeStyle = theme.fg;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (theme.decoration === "italia") {
    ["#1d7a3a", "#ffffff", "#c4183a"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(pad + 2, pad + 2 + i * 6, SLOT_W - pad * 2 - 4, 6);
    });
  }
  if (theme.decoration === "marquee") {
    ctx.fillStyle = "#ffe08a";
    for (let i = 10; i < SLOT_W - 6; i += 12) {
      ctx.beginPath();
      ctx.arc(i, 7, 2.2, 0, Math.PI * 2);
      ctx.arc(i, SLOT_H - 7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let left = 10;
  if (theme.icon) {
    ctx.font = `34px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(theme.icon, 8, SLOT_H / 2 + 2);
    left = 50;
  }
  const width = SLOT_W - left - 10;
  const centre = left + width / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (theme.word) {
    ctx.fillStyle = theme.wordColor ?? theme.fg;
    fitText(ctx, theme.word, width, 26, 900);
    ctx.fillText(theme.word, centre, 22);
    ctx.fillStyle = theme.fg;
    fitText(ctx, poi.n, width, 15, 800);
    ctx.fillText(poi.n, centre, 47);
  } else {
    ctx.fillStyle = theme.fg;
    fitText(ctx, poi.n, width, 24, 800);
    ctx.fillText(poi.n, centre, SLOT_H / 2 + 1);
  }
  ctx.restore();
}

export type Storefronts = { group: THREE.Group; update: (time: number) => void; dispose: () => void };

/**
 * `map` is already shrunk by `scale`; signs go just above the shop windows,
 * which are SHOP_HEIGHT real metres tall.
 */
export function addStorefronts(map: MapData, scale: number, shopHeight: number): Storefronts {
  const group = new THREE.Group();
  const pois = (map.pois ?? []).slice(0, COLS * ROWS);
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(thing: T) => (disposables.push(thing), thing);

  const canvas = document.createElement("canvas");
  canvas.width = SLOT_W * COLS;
  canvas.height = SLOT_H * ROWS;
  const ctx = canvas.getContext("2d")!;

  const position: number[] = [];
  const uv: number[] = [];
  const signTop = shopHeight * scale + 0.25 + SIGN_H;

  // People-sized decorations, shared between shops.
  const lanternGeometry = keep(new THREE.SphereGeometry(0.2, 12, 10));
  const lanternMaterial = keep(new THREE.MeshBasicMaterial({ color: "#e0283f" }));
  const capMaterial = keep(new THREE.MeshBasicMaterial({ color: "#ffd27a" }));
  const capGeometry = keep(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10));
  const norenGeometry = keep(new THREE.PlaneGeometry(0.34, 0.55));
  const norenMaterial = keep(new THREE.MeshLambertMaterial({ color: "#22305a", side: THREE.DoubleSide }));
  const donerGeometry = keep(new THREE.CylinderGeometry(0.17, 0.27, 0.8, 14));
  const donerMaterial = keep(new THREE.MeshLambertMaterial({ color: "#9a5a2a", emissive: new THREE.Color("#5a2a08") }));
  const rodGeometry = keep(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 6));
  const rodMaterial = keep(new THREE.MeshBasicMaterial({ color: "#d9dde3" }));
  const doners: THREE.Mesh[] = [];

  pois.forEach((poi, i) => {
    const theme = themeFor(poi);
    const sx = (i % COLS) * SLOT_W;
    const sy = Math.floor(i / COLS) * SLOT_H;
    drawSign(ctx, sx, sy, poi, theme);

    // The wall's outward direction and the direction along it.
    const nx = Math.sin(poi.a);
    const nz = Math.cos(poi.a);
    const tx = nz;
    const tz = -nx;
    const out = 0.14;
    const cx = poi.x + nx * out;
    const cz = poi.z + nz * out;
    const hw = SIGN_W / 2;
    const corners = [
      [cx - tx * hw, signTop - SIGN_H, cz - tz * hw],
      [cx + tx * hw, signTop - SIGN_H, cz + tz * hw],
      [cx + tx * hw, signTop, cz + tz * hw],
      [cx - tx * hw, signTop, cz - tz * hw],
    ];
    // Atlas coordinates (the canvas's y runs downwards).
    const u0 = sx / canvas.width;
    const u1 = (sx + SLOT_W) / canvas.width;
    const v0 = 1 - (sy + SLOT_H) / canvas.height;
    const v1 = 1 - sy / canvas.height;
    const uvs = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    // Wound to face out of the wall, so it reads left to right from the street.
    for (const k of [0, 1, 2, 0, 2, 3]) {
      position.push(...corners[k]);
      uv.push(...uvs[k]);
    }

    const at = (along: number, up: number, outward: number) =>
      new THREE.Vector3(poi.x + tx * along + nx * outward, up, poi.z + tz * along + nz * outward);

    if (theme.decoration === "lanterns" || theme.decoration === "noren") {
      const spots = theme.decoration === "lanterns" ? [-hw - 0.3, hw + 0.3] : [hw + 0.3];
      for (const along of spots) {
        const lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
        lantern.scale.set(1, 1.3, 1);
        lantern.position.copy(at(along, signTop - 0.55, 0.4));
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.copy(at(along, signTop - 0.26, 0.4));
        group.add(lantern, cap);
      }
    }
    if (theme.decoration === "noren") {
      // A short split curtain hanging over the door.
      for (let k = -1; k <= 1; k++) {
        const flap = new THREE.Mesh(norenGeometry, norenMaterial);
        flap.position.copy(at(k * 0.37, signTop - SIGN_H - 0.32, 0.3));
        flap.rotation.y = poi.a;
        group.add(flap);
      }
    }
    if (theme.decoration === "doner") {
      // A döner spit turning in the window.
      const meat = new THREE.Mesh(donerGeometry, donerMaterial);
      meat.position.copy(at(-hw + 0.45, 1.15, 0.45));
      const rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.position.copy(at(-hw + 0.45, 1.15, 0.45));
      group.add(meat, rod);
      doners.push(meat);
    }
  });

  const texture = keep(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = keep(new THREE.BufferGeometry());
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  const signs = new THREE.Mesh(geometry, keep(new THREE.MeshBasicMaterial({ map: texture })));
  group.add(signs);

  return {
    group,
    update: (time) => doners.forEach((d) => (d.rotation.y = time * 1.5)),
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
