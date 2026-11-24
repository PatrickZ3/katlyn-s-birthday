"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playSfx } from "@/audio/engine";
import { ExploreMap } from "@/components/ExploreMap";
import { Joystick } from "@/components/Joystick";
import { config } from "@/config";
import type { MapData } from "@/explore/geo";
import mapData from "@/explore/map-data.json";
import type { ExploreView, StickInput } from "@/explore/scene";

/**
 * A 3D walk around the real streets between Bay and Yonge, from College down
 * to Queen. The words on this page are in `explore` in src/config.ts.
 */
export default function ExplorePage() {
  const text = config.explore;
  const container = useRef<HTMLDivElement>(null);
  const stick = useRef<StickInput>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ExploreView | null>(null);
  const [failed, setFailed] = useState(false);
  const [place, setPlace] = useState("");
  const [showHint, setShowHint] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);

  // The 3D view covers the whole screen, so it's drawn straight onto the page body.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !container.current) return;
    let current: ExploreView | undefined;
    let cancelled = false;
    // three.js only loads on this page, so the rest of the site stays quick.
    import("@/explore/scene")
      .then(({ startExplore }) => {
        if (cancelled || !container.current) return;
        current = startExplore(container.current, {
          map: mapData as MapData,
          stick: stick.current,
          home: text.home,
          onPlace: setPlace,
          onStep: () => playSfx("step"),
        });
        setView(current);
      })
      .catch(() => setFailed(true));
    const hint = setTimeout(() => setShowHint(false), 8000);
    return () => {
      cancelled = true;
      clearTimeout(hint);
      current?.stop();
    };
  }, [mounted, text.home]);

  const openMap = () => {
    // Let go of the stick so she doesn't keep walking behind the map.
    stick.current.x = 0;
    stick.current.y = 0;
    setMapOpen(true);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="explore-root">
      <div ref={container} className="absolute inset-0" />

      {place && (
        <button className="explore-place" onClick={openMap} aria-label={`${place}. Open the map`}>
          <span aria-hidden>📍</span> {place} <span className="explore-place-map">Map</span>
        </button>
      )}

      {!view && !failed && <div className="explore-message">{text.loading}</div>}
      {failed && <div className="explore-message">{text.failed}</div>}

      {view && !mapOpen && (
        <>
          {showHint && <div className="explore-hint">{text.hint}</div>}
          <div className="explore-stick">
            <Joystick stick={stick.current} />
          </div>
        </>
      )}

      {view && mapOpen && (
        <ExploreMap view={view} title={text.mapTitle} closeLabel={text.mapClose} onClose={() => setMapOpen(false)} />
      )}

      <div className="explore-credit">{(mapData as MapData).attribution}</div>
    </div>,
    document.body,
  );
}
