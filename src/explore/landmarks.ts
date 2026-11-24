import * as THREE from "three";
import { centroid, edgesOf, texture } from "./buildings";
import { insidePolygon, type MapData, type Shape } from "./geo";

/**
 * The details that make famous places recognisable at a glance:
 *   - CF Toronto Eaton Centre: its long glass arched roof, and big signs on Yonge.
 *   - Yonge & Dundas: giant glowing billboard screens around the corner,
 *     changing every few seconds, like Toronto's own Times Square.
 *   - Old City Hall: clock faces on its tower.
 *   - Massey Hall and the Ed Mirvish Theatre: lit theatre marquees, and Ed
 *     Mirvish's tall vertical sign.
 *   - College Park and the Atrium on Bay: their names on the front.
 *
 * To change what the billboards show, edit ADS below.
 */

type Keep = <T extends { dispose: () => void }>(thing: T) => T;

/** What the Yonge & Dundas screens cycle through. */
const ADS: { bg: [string, string]; title: string; sub?: string; color: string; icon?: string }[] = [
  { bg: ["#b3121f", "#e0283f"], title: "MERRY CHRISTMAS", sub: "Happy holidays, Toronto", color: "#ffffff", icon: "❄" },
  { bg: ["#0d1b4c", "#24408e"], title: "TORONTO", sub: "The 6ix", color: "#ffd27a", icon: "🏙️" },
  { bg: ["#ff7aa8", "#ffb3cf"], title: "I ❤ KATLYN", sub: "Love, your boyfriend", color: "#ffffff", icon: "💕" },
  { bg: ["#ffd6e8", "#f7a8c8"], title: "BUBBLE TEA", sub: "Extra pearls today", color: "#7a2a52", icon: "🧋" },
  { bg: ["#ffcc00", "#ff8a00"], title: "HOLIDAY SALE", sub: "Up to 50% off", color: "#b3121f", icon: "🛍️" },
  { bg: ["#4a2c1d", "#7a4a2c"], title: "HOT CHOCOLATE", sub: "Warm up inside", color: "#ffe3b0", icon: "☕" },
  { bg: ["#ff6b00", "#ffb000"], title: "KIMCHI FRIED RICE", sub: "With a fried egg on top", color: "#ffffff", icon: "🍳" },
  { bg: ["#2b0a3d", "#6b2fa8"], title: "LIVE AT MASSEY HALL", sub: "Tonight", color: "#ffd27a", icon: "🎤" },
];
/** How long each billboard shows one ad, in seconds. */
const AD_SECONDS = 4;

function adTexture(ad: (typeof ADS)[number]) {
  return texture(512, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 512, 256);
    g.addColorStop(0, ad.bg[0]);
    g.addColorStop(1, ad.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    // A few soft light streaks, like a bright LED screen.
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 6; i++) ctx.fillRect(0, i * 46, 512, 14);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (ad.icon) {
      ctx.font = `70px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillText(ad.icon, 256, 70);
    }
    ctx.fillStyle = ad.color;
    let size = 64;
    do {
      ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`;
      size -= 2;
    } while (ctx.measureText(ad.title).width > 470 && size > 20);
    ctx.fillText(ad.title, 256, 150);
    if (ad.sub) {
      ctx.font = `700 26px Nunito, system-ui, sans-serif`;
      ctx.fillText(ad.sub, 256, 208);
    }
  });
}

/** A sign board: text on a coloured panel, optionally with a border of light bulbs. */
function signTexture(
  text: string,
  { width = 1024, height = 160, bg = "#1b1b2f", color = "#ffffff", bulbs = false, lit = 0, vertical = false, logo = "" } = {},
) {
  return texture(width, height, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    if (bulbs) {
      const step = 26;
      let n = 0;
      const bulb = (x: number, y: number) => {
        ctx.fillStyle = (n++ + lit) % 2 ? "#fff3c4" : "#ffb84a";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      };
      for (let x = 14; x < width; x += step) {
        bulb(x, 14);
        bulb(x, height - 14);
      }
      for (let y = 14 + step; y < height - 14; y += step) {
        bulb(14, y);
        bulb(width - 14, y);
      }
    }
    let left = 0;
    if (logo) {
      // A round logo badge on the left, like the CF circle.
      ctx.fillStyle = "#1f5fbf";
      ctx.beginPath();
      ctx.arc(height / 2 + 10, height / 2, height * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.round(height * 0.34)}px Nunito, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(logo, height / 2 + 10, height / 2 + 2);
      left = height + 10;
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (vertical) {
      // One letter under another, like a theatre's tall blade sign.
      const letters = [...text];
      const each = (height - 60) / letters.length;
      ctx.font = `900 ${Math.min(width * 0.62, each * 0.9)}px Nunito, system-ui, sans-serif`;
      letters.forEach((letter, i) => ctx.fillText(letter, width / 2, 30 + each * (i + 0.5)));
    } else {
      let size = Math.round(height * 0.55);
      do {
        ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`;
        size -= 2;
      } while (ctx.measureText(text).width > width - left - 50 && size > 12);
      ctx.fillText(text, left + (width - left) / 2, height / 2 + 3);
    }
  });
}

/** A flat panel on a wall: `normal` points out of the wall. Two faces if `twoSided`. */
function panel(
  width: number,
  height: number,
  material: THREE.Material,
  at: THREE.Vector3,
  normal: [number, number],
  keep: Keep,
  twoSided = false,
) {
  const geometry = keep(new THREE.PlaneGeometry(width, height));
  const group = new THREE.Group();
  const face = new THREE.Mesh(geometry, material);
  group.add(face);
  if (twoSided) {
    const back = new THREE.Mesh(geometry, material);
    back.rotation.y = Math.PI;
    group.add(back);
  }
  group.position.copy(at);
  group.rotation.y = Math.atan2(normal[0], normal[1]);
  return group;
}

export type Landmarks = { group: THREE.Group; update: (time: number) => void; dispose: () => void };

export function addLandmarks(map: MapData, scale: number): Landmarks {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const keep: Keep = (thing) => (disposables.push(thing), thing);
  const updates: ((time: number) => void)[] = [];

  // Toronto's grid: `south` runs down Bay and Yonge, `east` across them.
  const [bc, , , bq] = map.corners;
  const length = Math.hypot(bq[0] - bc[0], bq[1] - bc[1]);
  const south: [number, number] = [(bq[0] - bc[0]) / length, (bq[1] - bc[1]) / length];
  const east: [number, number] = [south[1], -south[0]];

  const named = (name: string) => map.buildings.find((b) => b.n === name);
  const partsOf = (building: Shape) =>
    (map.parts ?? []).filter((part) => {
      const [x, z] = centroid(part.p);
      return insidePolygon(x, z, building.p);
    });
  const mainRoads = map.roads.filter((r) => r.m).map((r) => r.p);
  const distanceToMainRoad = (x: number, z: number) => {
    let best = Infinity;
    for (const line of mainRoads) {
      for (let i = 0; i + 3 < line.length; i += 2) {
        const [ax, az, bx, bz] = [line[i], line[i + 1], line[i + 2], line[i + 3]];
        const dx = bx - ax;
        const dz = bz - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
      }
    }
    return best;
  };
  /** The building's front: a decent-sized wall that faces the nearest main road. */
  const frontOf = (building: Shape) => {
    const edges = edgesOf(building.p).filter((e) => e.length > 6 * scale);
    let best = edges[0];
    let bestScore = Infinity;
    for (const e of edges) {
      const mx = (e.a[0] + e.b[0]) / 2 + e.normal[0] * 6;
      const mz = (e.a[1] + e.b[1]) / 2 + e.normal[1] * 6;
      const score = distanceToMainRoad(mx, mz) - e.length * 0.05;
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  };
  const onWall = (e: ReturnType<typeof edgesOf>[number], along: number, y: number, out: number) =>
    new THREE.Vector3(
      e.a[0] + (e.b[0] - e.a[0]) * along + e.normal[0] * out,
      y,
      e.a[1] + (e.b[1] - e.a[1]) * along + e.normal[1] * out,
    );

  // ---- CF Toronto Eaton Centre: the glass galleria roof and signs on Yonge. ----
  const eaton = named("CF Toronto Eaton Centre");
  if (eaton) {
    const low = partsOf(eaton).filter((p) => p.h < 40 * scale && !p.b);
    const roof = low.length ? Math.max(...low.map((p) => p.h)) : eaton.h;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < eaton.p.length; i += 2) {
      const t = eaton.p[i] * south[0] + eaton.p[i + 1] * south[1];
      min = Math.min(min, t);
      max = Math.max(max, t);
    }
    const [cx, cz] = centroid(eaton.p);
    const across = cx * east[0] + cz * east[1];
    const mid = (min + max) / 2;
    const vaultLength = (max - min) * 0.78;
    const radius = 8 * scale;
    const centre = new THREE.Vector3(south[0] * mid + east[0] * across, roof, south[1] * mid + east[1] * across);
    const along = Math.atan2(-south[1], south[0]);

    const glass = keep(
      new THREE.MeshLambertMaterial({
        color: "#cfe8ff",
        emissive: new THREE.Color("#5f9fd6"),
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    const vaultGeometry = keep(new THREE.CylinderGeometry(radius, radius, vaultLength, 20, 1, true, 0, Math.PI));
    vaultGeometry.rotateZ(Math.PI / 2);
    const vault = new THREE.Mesh(vaultGeometry, glass);
    vault.position.copy(centre);
    vault.rotation.y = along;
    group.add(vault);

    // White steel ribs every few metres, and glass ends.
    const steel = keep(new THREE.MeshLambertMaterial({ color: "#f4f6f8" }));
    const ribGeometry = keep(new THREE.TorusGeometry(radius, 0.12 + 0.1 * scale, 4, 18, Math.PI));
    const capGeometry = keep(new THREE.CircleGeometry(radius, 18, 0, Math.PI));
    const facing = Math.atan2(south[0], south[1]);
    for (let t = -vaultLength / 2; t <= vaultLength / 2 + 0.01; t += 7 * scale) {
      const rib = new THREE.Mesh(ribGeometry, steel);
      rib.position.set(centre.x + south[0] * t, roof, centre.z + south[1] * t);
      rib.rotation.y = facing;
      group.add(rib);
    }
    for (const end of [-1, 1]) {
      const cap = new THREE.Mesh(capGeometry, glass);
      cap.position.set(centre.x + (south[0] * vaultLength * end) / 2, roof, centre.z + (south[1] * vaultLength * end) / 2);
      cap.rotation.y = facing;
      group.add(cap);
    }

    // Big "CF Toronto Eaton Centre" signs on the longest walls facing Yonge.
    const signMaterial = keep(
      new THREE.MeshBasicMaterial({ map: keep(signTexture("Toronto Eaton Centre", { bg: "#14213d", logo: "CF" })) }),
    );
    edgesOf(eaton.p)
      .filter((e) => e.normal[0] * east[0] + e.normal[1] * east[1] > 0.75 && e.length > 25 * scale)
      .sort((a, b) => b.length - a.length)
      .slice(0, 2)
      .forEach((e) => {
        const y = Math.min(roof - 1.5, 9 * scale + 2);
        group.add(panel(11, 1.7, signMaterial, onWall(e, 0.5, y, 0.25), e.normal as [number, number], keep));
      });
  }

  // ---- Yonge & Dundas: giant billboard screens facing the crossing. ----
  const crossing = map.signs.find((s) => s.names.includes("Dundas St") && s.names.includes("Yonge St"));
  if (crossing) {
    const ads = ADS.map((ad) => keep(adTexture(ad)));
    const screens: { material: THREE.MeshBasicMaterial; offset: number }[] = [];
    const frame = keep(new THREE.MeshBasicMaterial({ color: "#111318" }));
    const candidates: { e: ReturnType<typeof edgesOf>[number]; d: number; building: Shape }[] = [];
    for (const building of map.buildings) {
      for (const e of edgesOf(building.p)) {
        if (e.length < 7 * scale) continue;
        const mx = (e.a[0] + e.b[0]) / 2;
        const mz = (e.a[1] + e.b[1]) / 2;
        const d = Math.hypot(crossing.x - mx, crossing.z - mz);
        if (d > 60 * scale) continue;
        const toward = ((crossing.x - mx) * e.normal[0] + (crossing.z - mz) * e.normal[1]) / (d || 1);
        if (toward > 0.3) candidates.push({ e, d, building });
      }
    }
    const perBuilding = new Map<Shape, number>();
    candidates
      .sort((a, b) => a.d - b.d)
      .forEach(({ e, building }) => {
        const count = perBuilding.get(building) ?? 0;
        if (count >= 2 || screens.length >= 10) return;
        // Big, like the real wall-sized screens at Yonge & Dundas.
        const width = Math.min(e.length * 0.9, 20);
        const height = Math.min(width * 0.55, 11);
        const bottom = 4.4 * scale + 0.6;
        const top = building.x ? Math.max(...partsOf(building).map((p) => p.h), building.h) : building.h;
        if (bottom + height > top - 0.5) return;
        perBuilding.set(building, count + 1);
        const material = keep(new THREE.MeshBasicMaterial({ map: ads[screens.length % ads.length] }));
        screens.push({ material, offset: screens.length * 1.3 });
        const y = bottom + height / 2 + count * (height + 0.8);
        group.add(panel(width + 0.5, height + 0.5, frame, onWall(e, 0.5, y, 0.2), e.normal as [number, number], keep));
        group.add(panel(width, height, material, onWall(e, 0.5, y, 0.27), e.normal as [number, number], keep));
      });
    updates.push((time) => {
      for (const screen of screens) {
        const index = Math.floor((time + screen.offset) / AD_SECONDS) % ads.length;
        if (screen.material.map !== ads[index]) {
          screen.material.map = ads[index];
          screen.material.needsUpdate = true;
        }
      }
    });
  }

  // ---- Old City Hall: clock faces on its real tower. ----
  const hall = named("Old City Hall");
  if (hall?.x) {
    const tower = partsOf(hall)
      .filter((p) => !p.b)
      .sort((a, b) => b.h - a.h)[0];
    if (tower) {
      let minS = Infinity;
      let maxS = -Infinity;
      let minE = Infinity;
      let maxE = -Infinity;
      for (let i = 0; i < tower.p.length; i += 2) {
        const s = tower.p[i] * south[0] + tower.p[i + 1] * south[1];
        const e = tower.p[i] * east[0] + tower.p[i + 1] * east[1];
        minS = Math.min(minS, s);
        maxS = Math.max(maxS, s);
        minE = Math.min(minE, e);
        maxE = Math.max(maxE, e);
      }
      const ms = (minS + maxS) / 2;
      const me = (minE + maxE) / 2;
      const size = Math.min(maxS - minS, maxE - minE) * 0.7;
      const clock = keep(
        texture(128, 128, (ctx) => {
          ctx.fillStyle = "#f8f1dc";
          ctx.beginPath();
          ctx.arc(64, 64, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#2a2522";
          ctx.lineWidth = 5;
          ctx.stroke();
          for (let h = 0; h < 12; h++) {
            const a = (h / 12) * Math.PI * 2;
            ctx.fillStyle = "#2a2522";
            ctx.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 2, 4, 4);
          }
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(64, 64);
          ctx.lineTo(64, 24);
          ctx.moveTo(64, 64);
          ctx.lineTo(92, 74);
          ctx.stroke();
        }),
      );
      const clockMaterial = keep(new THREE.MeshBasicMaterial({ map: clock, transparent: true }));
      const y = tower.h - size * 0.85;
      const faces: [number, number, number][] = [
        [1, 0, (maxS - minS) / 2],
        [-1, 0, (maxS - minS) / 2],
        [0, 1, (maxE - minE) / 2],
        [0, -1, (maxE - minE) / 2],
      ];
      for (const [ds, de, reach] of faces) {
        const nx = south[0] * ds + east[0] * de;
        const nz = south[1] * ds + east[1] * de;
        const at = new THREE.Vector3(
          south[0] * ms + east[0] * me + nx * (reach + 0.08),
          y,
          south[1] * ms + east[1] * me + nz * (reach + 0.08),
        );
        group.add(panel(size, size, clockMaterial, at, [nx, nz], keep));
      }
    }
  }

  // ---- Theatres: a marquee of chasing bulbs, and Ed Mirvish's tall blade sign. ----
  const theatre = (name: string, text: string, blade: string | null) => {
    const building = named(name);
    if (!building) return;
    const front = frontOf(building);
    if (!front) return;
    const width = Math.min(front.length * 0.7, 9);
    const looks = [0, 1].map((lit) =>
      keep(signTexture(text, { bg: "#5a0c18", color: "#ffd27a", bulbs: true, lit })),
    );
    const marquee = keep(new THREE.MeshBasicMaterial({ map: looks[0] }));
    const canopy = new THREE.Mesh(
      keep(new THREE.BoxGeometry(width, 0.35, 2.2)),
      keep(new THREE.MeshLambertMaterial({ color: "#2a1414" })),
    );
    canopy.position.copy(onWall(front, 0.5, 3.6, 1.1));
    canopy.rotation.y = Math.atan2(front.normal[0], front.normal[1]);
    group.add(canopy);
    group.add(panel(width, 1.2, marquee, onWall(front, 0.5, 4.35, 2.21), front.normal as [number, number], keep));

    const bladeLooks: THREE.CanvasTexture[] = [];
    if (blade) {
      // The blade sticks straight out from the wall, so it faces along the street.
      const along: [number, number] = [front.b[0] - front.a[0], front.b[1] - front.a[1]];
      const l = Math.hypot(along[0], along[1]);
      const sideways: [number, number] = [along[0] / l, along[1] / l];
      for (const lit of [0, 1]) {
        bladeLooks.push(keep(signTexture(blade, { width: 200, height: 1000, bg: "#5a0c18", color: "#ffd27a", bulbs: true, lit, vertical: true })));
      }
      const bladeMaterial = keep(new THREE.MeshBasicMaterial({ map: bladeLooks[0] }));
      const at = onWall(front, 0.12, 9, 1.1);
      group.add(panel(1.5, 7.5, bladeMaterial, at, sideways, keep, true));
      updates.push((time) => {
        const next = bladeLooks[Math.floor(time * 2.5) % 2];
        if (bladeMaterial.map !== next) {
          bladeMaterial.map = next;
          bladeMaterial.needsUpdate = true;
        }
      });
    }
    updates.push((time) => {
      const next = looks[Math.floor(time * 2.5) % 2];
      if (marquee.map !== next) {
        marquee.map = next;
        marquee.needsUpdate = true;
      }
    });
  };
  theatre("Massey Hall", "MASSEY HALL", null);
  theatre("Ed Mirvish Theatre", "ED MIRVISH THEATRE", "ED MIRVISH");

  // ---- Name signs on the front of a few well-known buildings. ----
  const nameSign = (name: string, text: string, bg: string, color: string) => {
    const building = named(name);
    if (!building) return;
    const front = frontOf(building);
    if (!front) return;
    const material = keep(new THREE.MeshBasicMaterial({ map: keep(signTexture(text, { bg, color })) }));
    const width = Math.min(front.length * 0.6, 9);
    group.add(panel(width, width * 0.156, material, onWall(front, 0.5, 4.4 * scale + 3.4, 0.25), front.normal as [number, number], keep));
  };
  nameSign("College Park", "COLLEGE PARK", "#3b2f22", "#f3d9a0");
  nameSign("Atrium", "ATRIUM ON BAY", "#16324f", "#ffffff");

  return {
    group,
    update: (time) => updates.forEach((u) => u(time)),
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
