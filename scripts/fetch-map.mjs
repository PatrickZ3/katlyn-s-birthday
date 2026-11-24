/**
 * Downloads the real streets, buildings and parks for the Explore Toronto
 * page from OpenStreetMap, and saves them to src/explore/map-data.json.
 *
 * The site never calls OpenStreetMap itself: it only reads that saved file.
 * Rerun this to refresh the map:   node scripts/fetch-map.mjs
 * To rebuild from a download saved earlier (no internet needed):
 *                                    node scripts/fetch-map.mjs saved-download.json
 *
 * Map data © OpenStreetMap contributors, available under the Open Database
 * License (https://www.openstreetmap.org/copyright). The page credits them.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

/** The four corners of the area she can walk around, at the middle of each intersection. */
const CORNERS = {
  bayCollege: [43.6608075, -79.3858484],
  yongeCollege: [43.6613715, -79.3830877],
  yongeQueen: [43.6524224, -79.3792612],
  bayQueen: [43.6518893, -79.3817339],
};

/** How far past the corner streets she can walk, so she can cross to the far sidewalk (metres). */
const WALK_MARGIN = 17;
/** Buildings this far outside the area are still drawn, so the edges don't look empty (metres). */
const SCENERY_MARGIN = 75;
/** Streets reaching this far outside are drawn too (metres). */
const ROAD_MARGIN = 140;

const ROAD_WIDTHS = {
  primary: 15,
  primary_link: 8,
  secondary: 13,
  secondary_link: 7,
  tertiary: 10,
  unclassified: 8,
  residential: 7.5,
  living_street: 6,
  service: 4.5,
  pedestrian: 5,
  // Queen & Yonge is dug up for the Ontario Line, so OpenStreetMap calls it "construction".
  construction: 12,
};

const BBOX = "43.6490,-79.3890,43.6635,-79.3765";
const QUERY = `[out:json][timeout:90];
(
  way["building"](${BBOX});
  relation["building"](${BBOX});
  way["building:part"](${BBOX});
  relation["building:part"](${BBOX});
  way["highway"](${BBOX});
  way["leisure"~"^(park|garden)$"](${BBOX});
  way["place"="square"](${BBOX});
  nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream|bank|pharmacy|cinema|theatre)$"](${BBOX});
  nwr["shop"](${BBOX});
);
out geom;`;

const lat0 = Object.values(CORNERS).reduce((s, c) => s + c[0], 0) / 4;
const lon0 = Object.values(CORNERS).reduce((s, c) => s + c[1], 0) / 4;
const M_PER_LAT = 111_132;
const M_PER_LON = 111_320 * Math.cos((lat0 * Math.PI) / 180);

/** Metres from the middle of the area: x goes east, z goes south (three.js style). */
const project = ({ lat, lon }) => [
  Math.round((lon - lon0) * M_PER_LON * 10) / 10,
  Math.round(-(lat - lat0) * M_PER_LAT * 10) / 10,
];

const quad = [CORNERS.bayCollege, CORNERS.yongeCollege, CORNERS.yongeQueen, CORNERS.bayQueen].map(
  ([lat, lon]) => project({ lat, lon }),
);

/** Pushes each side of a convex polygon outwards by `d` metres. */
function grow(poly, d) {
  const n = poly.length;
  const sign = signedArea(poly) > 0 ? 1 : -1;
  const lines = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Outward normal for this winding.
    const nx = (sign * (b[1] - a[1])) / len;
    const nz = (sign * -(b[0] - a[0])) / len;
    return [
      [a[0] + nx * d, a[1] + nz * d],
      [b[0] + nx * d, b[1] + nz * d],
    ];
  });
  return lines.map((line, i) => intersect(lines[(i - 1 + n) % n], line));
}

function intersect([p1, p2], [p3, p4]) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
  return [
    Math.round((p1[0] + t * (p2[0] - p1[0])) * 10) / 10,
    Math.round((p1[1] + t * (p2[1] - p1[1])) * 10) / 10,
  ];
}

function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i];
    const [x2, z2] = poly[(i + 1) % poly.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

function inside([x, z], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

function distanceToSegment(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
}

const centroid = (ring) => [
  ring.reduce((s, p) => s + p[0], 0) / ring.length,
  ring.reduce((s, p) => s + p[1], 0) / ring.length,
];

/** Colour and material from OpenStreetMap, shortened. */
function looks(tags) {
  const out = {};
  if (tags["building:colour"]) out.c = tags["building:colour"];
  if (tags["roof:colour"]) out.r = tags["roof:colour"];
  if (tags["building:material"]) out.m = tags["building:material"];
  return out;
}

function minHeightOf(tags) {
  const h = parseFloat(tags.min_height);
  if (h > 0) return h;
  const level = parseFloat(tags["building:min_level"]);
  return level > 0 ? level * 3.4 : 0;
}

function heightOf(tags) {
  const h = parseFloat(tags.height);
  if (h > 0) return h;
  const levels = parseFloat(tags["building:levels"]);
  if (levels > 0) return levels * 3.4 + 1.5;
  if (tags.building === "retail" || tags.building === "commercial") return 18;
  if (tags.building === "church") return 16;
  if (tags.building === "house") return 8;
  return 12;
}

const shortName = (name) =>
  name
    .replace(/ Street( (East|West))?$/, " St")
    .replace(/ Avenue$/, " Ave")
    .replace(/ Lane$/, " Ln");

const underground = (tags) =>
  tags.tunnel === "yes" ||
  tags.indoor === "yes" ||
  tags.location === "underground" ||
  parseFloat(tags.layer) < 0 ||
  /^-/.test(tags.level ?? "");

/** Public OpenStreetMap servers. If one is busy, the next is tried. */
const SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function download() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const server = SERVERS[attempt % SERVERS.length];
    try {
      const response = await fetch(server, {
        method: "POST",
        headers: { "User-Agent": "katlyn-christmas-site (map builder)" },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(60_000),
      });
      if (response.ok) return (await response.json()).elements;
      console.log(`${server} said ${response.status}, trying again...`);
    } catch (error) {
      console.log(`${server} failed (${error.message}), trying again...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Couldn't reach OpenStreetMap. Try again in a few minutes.");
}

// Pass a saved download to skip the internet; otherwise download and keep a copy.
const saved = process.argv[2];
const elements = saved && existsSync(saved) ? JSON.parse(readFileSync(saved, "utf8")) : await download();
if (!saved) writeFileSync(new URL("./.map-download.json", import.meta.url), JSON.stringify(elements));

/**
 * The walkable area follows the real Bay and Yonge streets (Bay bends a bit
 * near Dundas), widened by WALK_MARGIN, and runs WALK_MARGIN past College and Queen.
 */
function walkArea() {
  const [bc, yc, yq, bq] = quad;
  const north = [(bc[0] + yc[0]) / 2, (bc[1] + yc[1]) / 2];
  const south = [(bq[0] + yq[0]) / 2, (bq[1] + yq[1]) / 2];
  const length = Math.hypot(south[0] - north[0], south[1] - north[1]);
  const u = [(south[0] - north[0]) / length, (south[1] - north[1]) / length]; // points south
  const n = [u[1], -u[0]]; // points east
  const along = (p, from) => (p[0] - from[0]) * u[0] + (p[1] - from[1]) * u[1];

  const edge = (street, from, side) => {
    const points = elements
      .filter((e) => e.type === "way" && e.tags?.name === street && e.tags.highway && e.geometry)
      .flatMap((e) => e.geometry.map(project))
      .filter((p) => along(p, from) > 0 && along(p, from) < length - 1)
      .sort((a, b) => along(a, from) - along(b, from));
    const ends = [
      [from[0] - u[0] * WALK_MARGIN, from[1] - u[1] * WALK_MARGIN],
      ...points,
      [from[0] + u[0] * (length + WALK_MARGIN), from[1] + u[1] * (length + WALK_MARGIN)],
    ];
    // Thin out so dual carriageways can't zigzag, then push sideways.
    const kept = ends.filter((p, i) => i === 0 || i === ends.length - 1 || along(p, from) - along(ends[i - 1], from) > 4);
    return kept.map((p) => [
      Math.round((p[0] + n[0] * side * WALK_MARGIN) * 10) / 10,
      Math.round((p[1] + n[1] * side * WALK_MARGIN) * 10) / 10,
    ]);
  };

  return [...edge("Bay Street", bc, -1), ...edge("Yonge Street", yc, 1).reverse()];
}

const walk = walkArea();
const scenery = grow(quad, SCENERY_MARGIN);
const roadArea = grow(quad, ROAD_MARGIN);

const buildings = [];
const parts = [];
const roads = [];
const parks = [];
const plazas = [];
const named = new Map();

const closedRing = (geometry) => {
  if (!geometry || geometry.length < 4) return null;
  const ring = geometry.map(project);
  const [a, b] = [ring[0], ring[ring.length - 1]];
  if (a[0] !== b[0] || a[1] !== b[1]) return null;
  ring.pop();
  return ring;
};

for (const el of elements) {
  const tags = el.tags ?? {};

  const isPart = tags["building:part"] && tags["building:part"] !== "no";
  if ((tags.building || isPart) && tags.building !== "roof" && tags["building:part"] !== "roof" && !underground(tags)) {
    const rings =
      el.type === "way"
        ? [closedRing(el.geometry)]
        : (el.members ?? []).filter((m) => m.role === "outer").map((m) => closedRing(m.geometry));
    for (const ring of rings) {
      if (!ring || !inside(centroid(ring), scenery)) continue;
      const area = Math.abs(signedArea(ring));
      if (area < 12) continue;
      const shape = {
        p: ring.flat(),
        h: Math.round(heightOf(tags) * 10) / 10,
        ...looks(tags),
      };
      const min = minHeightOf(tags);
      if (min > 0) shape.b = Math.round(min * 10) / 10;
      if (tags.shop || tags.building === "retail" || tags.building === "commercial") shape.s = 1;
      if (isPart) {
        parts.push(shape);
      } else {
        if (tags.name && area > 900) shape.n = tags.name;
        buildings.push(shape);
      }
    }
    continue;
  }

  if (el.type !== "way") continue;

  if (tags.leisure === "park" || tags.leisure === "garden" || tags.place === "square") {
    const ring = closedRing(el.geometry);
    if (ring && inside(centroid(ring), scenery)) parks.push({ p: ring.flat() });
    continue;
  }

  const width = ROAD_WIDTHS[tags.highway];
  if (!width || underground(tags)) continue;
  const line = el.geometry.map(project);
  if (!line.some((p) => inside(p, roadArea))) continue;

  if (tags.area === "yes") {
    const ring = closedRing(el.geometry);
    if (ring) plazas.push({ p: ring.flat() });
    continue;
  }

  roads.push({
    p: line.flat(),
    w: width,
    ...(tags.highway.startsWith("primary") || tags.highway.startsWith("secondary") ? { m: 1 } : {}),
    ...(tags.name === "Yonge Street" ? { yonge: true } : {}),
  });

  // Remember every named street's nodes so crossings can get street signs.
  if (tags.name && !["service", "pedestrian"].includes(tags.highway)) {
    const street = shortName(tags.name);
    el.nodes.forEach((id, i) => {
      if (!named.has(id)) named.set(id, { at: line[i], names: new Set() });
      named.get(id).names.add(street);
    });
  }
}

// A building split into detailed parts is drawn from its parts; its outline only blocks walking.
for (const building of buildings) {
  const ring = [];
  for (let i = 0; i < building.p.length; i += 2) ring.push([building.p[i], building.p[i + 1]]);
  const hasParts = parts.some((part) => {
    const partRing = [];
    for (let i = 0; i < part.p.length; i += 2) partRing.push([part.p[i], part.p[i + 1]]);
    return inside(centroid(partRing), ring);
  });
  if (hasParts) building.x = 1;
}

// Buildings facing Yonge get shopfronts, since nearly the whole street is shops.
const yonge = roads.filter((road, i) => road.yonge).map((road) => road.p);
for (const building of buildings) {
  for (let i = 0; i < building.p.length && !building.s; i += 2) {
    const [x, z] = [building.p[i], building.p[i + 1]];
    for (const line of yonge) {
      for (let j = 0; j + 3 < line.length; j += 2) {
        if (distanceToSegment(x, z, line[j], line[j + 1], line[j + 2], line[j + 3]) < 16) building.s = 1;
      }
    }
  }
}
for (const road of roads) delete road.yonge;

// Shops and restaurants at street level, each pinned to the wall of the building it's in.
const shopArea = grow(quad, 45);
const pois = [];
for (const el of elements) {
  const tags = el.tags ?? {};
  const kind = tags.amenity ?? (tags.shop && tags.shop !== "vacant" ? tags.shop : null);
  if (!kind || !tags.name) continue;
  // Skip shops underground (the PATH) or upstairs in malls.
  if (tags.level && !/^0(;|$)/.test(tags.level.trim())) continue;
  const at =
    el.type === "node"
      ? project(el)
      : el.geometry
        ? centroid(el.geometry.map(project))
        : el.center
          ? project(el.center)
          : null;
  if (!at || !inside(at, shopArea)) continue;

  // The nearest outside wall. Anything deeper than that inside a building is indoors.
  let best = null;
  for (const building of buildings) {
    const p = building.p;
    for (let i = 0; i < p.length; i += 2) {
      const j = (i + 2) % p.length;
      const [ax, az, bx, bz] = [p[i], p[i + 1], p[j], p[j + 1]];
      const d = distanceToSegment(at[0], at[1], ax, az, bx, bz);
      if (best && d >= best.d) continue;
      const len = Math.hypot(bx - ax, bz - az) || 1;
      const t = Math.max(0, Math.min(1, ((at[0] - ax) * (bx - ax) + (at[1] - az) * (bz - az)) / (len * len)));
      let nx = (bz - az) / len;
      let nz = -(bx - ax) / len;
      const mx = ax + (bx - ax) * t;
      const mz = az + (bz - az) * t;
      const ring = [];
      for (let k = 0; k < p.length; k += 2) ring.push([p[k], p[k + 1]]);
      if (inside([mx + nx * 0.1, mz + nz * 0.1], ring)) {
        nx = -nx;
        nz = -nz;
      }
      best = { d, x: mx, z: mz, nx, nz, building, wall: len };
    }
  }
  if (!best || best.d > 14 || best.wall < 3) continue;
  if (pois.some((o) => Math.hypot(o.x - best.x, o.z - best.z) < 3.2)) continue;
  best.building.s = 1;
  const poi = {
    x: Math.round(best.x * 10) / 10,
    z: Math.round(best.z * 10) / 10,
    a: Math.round(Math.atan2(best.nx, best.nz) * 1000) / 1000,
    n: tags.name,
    k: kind,
  };
  if (tags.cuisine) poi.q = tags.cuisine;
  const local = tags["name:ko"] ?? tags["name:ja"] ?? tags["name:zh"];
  if (local && local !== tags.name) poi.l = local;
  pois.push(poi);
}

// Street signs where two differently named streets cross inside the area.
const signs = [];
for (const { at, names } of named.values()) {
  if (names.size < 2 || !inside(at, walk)) continue;
  const label = [...names].slice(0, 2);
  if (signs.some((s) => Math.hypot(s.x - at[0], s.z - at[1]) < 25)) continue;
  signs.push({ x: at[0], z: at[1], names: label });
}

const data = {
  attribution: "Map data © OpenStreetMap contributors (ODbL)",
  origin: { lat: lat0, lon: lon0 },
  corners: quad,
  walk,
  spawn: quad[0],
  buildings,
  parts,
  roads,
  parks,
  plazas,
  signs,
  pois,
};

writeFileSync(new URL("../src/explore/map-data.json", import.meta.url), JSON.stringify(data));
console.log(
  `Saved ${buildings.length} buildings (${parts.length} detailed parts), ${roads.length} streets, ${parks.length} parks, ${plazas.length} squares, ${signs.length} street signs, ${pois.length} shops and restaurants.`,
);
