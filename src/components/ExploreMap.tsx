"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExploreView } from "@/explore/scene";
import { themeFor } from "@/explore/themes";

/** Landmarks named on the 2D map, with the shorter name to show. */
const MAP_LANDMARKS: Record<string, string> = {
  "CF Toronto Eaton Centre": "Eaton Centre",
  "College Park": "College Park",
  "Old City Hall": "Old City Hall",
  "Massey Hall": "Massey Hall",
  "Ed Mirvish Theatre": "Ed Mirvish Theatre",
  "Hudson's Bay/Saks Fifth Avenue": "Hudson's Bay",
  "Toronto Police Headquarters": "Police HQ",
  "Chelsea Hotel, Toronto": "Chelsea Hotel",
  Atrium: "Atrium",
};

/** How far in the map can zoom, and when shop names start showing. */
const MAX_ZOOM = 8;
const SHOP_NAMES_FROM = 2.6;
/** A finger moving less than this many pixels is a tap, not a drag. */
const TAP_SLOP = 8;

type Props = {
  view: ExploreView;
  title: string;
  closeLabel: string;
  onClose: () => void;
};

/**
 * A flat map of the area, turned so Bay and Yonge run straight up and down.
 * Pinch or scroll to zoom, drag to move around, tap a spot to go there.
 */
export function ExploreMap({ view, title, closeLabel, onClose }: Props) {
  const { map } = view;
  const svgRef = useRef<SVGSVGElement>(null);
  const [me, setMe] = useState(view.position());
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setMe(view.position()), 300);
    return () => clearInterval(timer);
  }, [view]);

  const layout = useMemo(() => {
    // Turn the map so "south" (from College towards Queen) points down the screen.
    const [bc, yc, yq, bq] = map.corners;
    const angle = Math.atan2(bq[0] - bc[0], bq[1] - bc[1]);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const toScreen = (x: number, z: number): [number, number] => [x * cos - z * sin, x * sin + z * cos];
    const toWorld = (X: number, Y: number): [number, number] => [X * cos + Y * sin, -X * sin + Y * cos];
    const path = (flat: number[], close: boolean) => {
      let d = "";
      for (let i = 0; i < flat.length; i += 2) {
        const [X, Y] = toScreen(flat[i], flat[i + 1]);
        d += `${i ? "L" : "M"}${X.toFixed(1)} ${Y.toFixed(1)}`;
      }
      return close ? `${d}Z` : d;
    };

    const walk = map.walk.map(([x, z]) => toScreen(x, z));
    const xs = walk.map((p) => p[0]);
    const ys = walk.map((p) => p[1]);
    const box = {
      x: Math.min(...xs) - 45,
      y: Math.min(...ys) - 20,
      w: Math.max(...xs) - Math.min(...xs) + 90,
      h: Math.max(...ys) - Math.min(...ys) + 40,
    };

    // Street names: Bay and Yonge run down the sides; cross streets go across the middle.
    const mid = (a: number[], b: number[]) => toScreen((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    const labels: { text: string; at: [number, number]; vertical?: boolean }[] = [
      { text: "Bay St", at: mid(bc, bq), vertical: true },
      { text: "Yonge St", at: mid(yc, yq), vertical: true },
    ];
    const crossings = new Map<string, [number, number][]>();
    for (const sign of map.signs) {
      const other = sign.names.find((n) => n !== "Bay St" && n !== "Yonge St");
      if (!other || other === "Dundas Square" || sign.names.length < 2) continue;
      if (!crossings.has(other)) crossings.set(other, []);
      crossings.get(other)!.push(toScreen(sign.x, sign.z));
    }
    for (const [text, points] of crossings) {
      const x = points.reduce((s, p) => s + p[0], 0) / points.length;
      const y = points.reduce((s, p) => s + p[1], 0) / points.length;
      if (!labels.some((l) => Math.abs(l.at[1] - y) < 12 && !l.vertical)) labels.push({ text, at: [x, y] });
    }

    const landmarks = map.buildings
      .filter((b) => b.n && MAP_LANDMARKS[b.n])
      .map((b) => {
        let x = 0;
        let z = 0;
        for (let i = 0; i < b.p.length; i += 2) {
          x += b.p[i];
          z += b.p[i + 1];
        }
        return { text: MAP_LANDMARKS[b.n!], at: toScreen(x / (b.p.length / 2), z / (b.p.length / 2)) };
      });

    // Shops and restaurants, nudged off the wall onto the sidewalk.
    const shops = (map.pois ?? []).map((poi) => ({
      name: poi.n,
      icon: themeFor(poi).icon ?? "🛍️",
      at: toScreen(poi.x + Math.sin(poi.a) * 2.5, poi.z + Math.cos(poi.a) * 2.5),
    }));

    return {
      box,
      toScreen,
      toWorld,
      walkPath: path(map.walk.flat(), true),
      parks: map.parks.map((p) => path(p.p, true)),
      roads: map.roads.map((r) => ({ d: path(r.p, false), w: r.w, main: !!r.m })),
      buildings: map.buildings.map((b) => ({ d: path(b.p, true), landmark: !!(b.n && MAP_LANDMARKS[b.n]) })),
      labels,
      landmarks,
      shops,
    };
  }, [map]);

  const { box } = layout;
  const middle: [number, number] = center ?? [box.x + box.w / 2, box.y + box.h / 2];
  const viewW = box.w / zoom;
  const viewH = box.h / zoom;
  const viewX = middle[0] - viewW / 2;
  const viewY = middle[1] - viewH / 2;

  /** Keeps the view over the map, so it can't be dragged off into nothing. */
  const clampCenter = ([x, y]: [number, number], z: number): [number, number] => {
    const halfW = box.w / z / 2;
    const halfH = box.h / z / 2;
    return [
      Math.min(Math.max(x, box.x + halfW), box.x + box.w - halfW),
      Math.min(Math.max(y, box.y + halfH), box.y + box.h - halfH),
    ];
  };

  /** Zooms to `next`, keeping the map point under `anchor` (map units) in place. */
  const zoomTo = (next: number, anchor?: [number, number]) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    const [ax, ay] = anchor ?? middle;
    const k = zoom / z;
    setZoom(z);
    setCenter(clampCenter([ax + (middle[0] - ax) * k, ay + (middle[1] - ay) * k], z));
  };

  /** Screen pixels to map units. */
  const toMap = (clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current!;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(svg.getScreenCTM()!.inverse());
    return [local.x, local.y];
  };

  // Gestures: one finger drags, two fingers pinch, a quick still touch is a tap.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: false, multi: false, pinchStart: 0, zoomStart: 1 });

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { moved: false, multi: false, pinchStart: 0, zoomStart: zoom };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.multi = true;
      gesture.current.pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.zoomStart = zoom;
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);

    if (pointers.current.size === 2 && gesture.current.pinchStart > 0) {
      const [a, b] = [...pointers.current.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.pinchStart;
      zoomTo(gesture.current.zoomStart * ratio, toMap((a.x + b.x) / 2, (a.y + b.y) / 2));
      gesture.current.moved = true;
      return;
    }
    if (pointers.current.size !== 1) return;
    const dx = next.x - last.x;
    const dy = next.y - last.y;
    const total = gesture.current;
    if (!total.moved && Math.hypot(dx, dy) < TAP_SLOP / 2) return;
    total.moved = true;
    const scale = svgRef.current!.getScreenCTM()!.a;
    setCenter(clampCenter([middle[0] - dx / scale, middle[1] - dy / scale], zoom));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const wasOnlyFinger = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinchStart = 0;
    // A quick still tap with one finger teleports her there.
    if (wasOnlyFinger && !gesture.current.moved && !gesture.current.multi) {
      const [X, Y] = toMap(e.clientX, e.clientY);
      const [x, z] = layout.toWorld(X, Y);
      view.teleport(x, z);
      onClose();
    }
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    zoomTo(zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2), toMap(e.clientX, e.clientY));
  };

  const [meX, meY] = layout.toScreen(me[0], me[1]);
  const [homeX, homeY] = layout.toScreen(view.home[0], view.home[1]);
  // Keep text and markers the same size on screen however far in she zooms.
  const s = 1 / Math.sqrt(zoom);

  return (
    <div className="explore-map" role="dialog" aria-label={title}>
      <div className="explore-map-head">
        <span>{title}</span>
        <button className="explore-map-close" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
      <div className="explore-map-frame">
        <svg
          ref={svgRef}
          className="explore-map-svg"
          viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <rect x={box.x - box.w} y={box.y - box.h} width={box.w * 3} height={box.h * 3} fill="#cdd5e1" />
          <path d={layout.walkPath} fill="#f2f5f9" />
          {layout.parks.map((d, i) => (
            <path key={`p${i}`} d={d} fill="#d8ecd6" />
          ))}
          {layout.roads.map((r, i) => (
            <path
              key={`r${i}`}
              d={r.d}
              fill="none"
              stroke={r.main ? "#5a6172" : "#8a91a0"}
              strokeWidth={Math.max(2, r.w)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {layout.buildings.map((b, i) => (
            <path key={`b${i}`} d={b.d} fill={b.landmark ? "#d9c08f" : "#b7bfcc"} stroke="#8e97a6" strokeWidth={0.6 * s} />
          ))}
          {zoom >= SHOP_NAMES_FROM &&
            layout.shops.map((shop, i) => (
              <g key={`s${i}`} transform={`translate(${shop.at[0]} ${shop.at[1]}) scale(${s})`} className="explore-map-shop">
                <text x={0} y={0} fontSize={6}>
                  {shop.icon}
                </text>
                <text x={4} y={0.3} className="explore-map-shop-name">
                  {shop.name}
                </text>
              </g>
            ))}
          {layout.landmarks.map((l) => (
            <text key={l.text} x={l.at[0]} y={l.at[1]} className="explore-map-landmark" fontSize={7 * s}>
              {l.text}
            </text>
          ))}
          {layout.labels.map((l) => (
            <text
              key={l.text}
              x={l.at[0]}
              y={l.at[1]}
              className="explore-map-street"
              fontSize={9 * s}
              transform={l.vertical ? `rotate(-90 ${l.at[0]} ${l.at[1]})` : undefined}
            >
              {l.text}
            </text>
          ))}
          <text x={homeX} y={homeY} className="explore-map-home" fontSize={14 * s}>
            🏠
          </text>
          <circle cx={meX} cy={meY} r={9 * s} className="explore-map-me-ring" />
          <circle cx={meX} cy={meY} r={5.5 * s} fill="#e0283f" stroke="#fff" strokeWidth={2.2 * s} />
        </svg>
        <div className="explore-map-zoom">
          <button aria-label="Zoom in" onClick={() => zoomTo(zoom * 1.6)}>
            +
          </button>
          <button aria-label="Zoom out" onClick={() => zoomTo(zoom / 1.6)}>
            −
          </button>
          <button
            aria-label="Show where she is"
            onClick={() => {
              const z = Math.max(zoom, 3);
              setZoom(z);
              setCenter(clampCenter([meX, meY], z));
            }}
          >
            📍
          </button>
        </div>
      </div>
    </div>
  );
}
