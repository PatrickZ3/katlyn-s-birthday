"use client";

import { useRef, useState } from "react";
import type { StickInput } from "@/explore/scene";

const SIZE = 124;
const KNOB = 54;
const REACH = (SIZE - KNOB) / 2;

/**
 * A thumb stick. Writes into `stick` (x and y from -1 to 1) as she drags,
 * and springs back to the middle when she lets go.
 */
export function Joystick({ stick }: { stick: StickInput }) {
  const base = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const track = (e: React.PointerEvent) => {
    const rect = base.current!.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    if (length > REACH) {
      dx = (dx / length) * REACH;
      dy = (dy / length) * REACH;
    }
    stick.x = dx / REACH;
    stick.y = dy / REACH;
    setKnob({ x: dx, y: dy });
  };

  const release = (e: React.PointerEvent) => {
    if (e.pointerId !== finger.current) return;
    finger.current = null;
    stick.x = 0;
    stick.y = 0;
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div
      ref={base}
      role="slider"
      aria-label="Walk"
      aria-valuetext="Drag to walk"
      className="joystick"
      style={{ width: SIZE, height: SIZE, touchAction: "none" }}
      onPointerDown={(e) => {
        if (finger.current !== null) return;
        finger.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        track(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === finger.current) track(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="joystick-knob"
        style={{ width: KNOB, height: KNOB, transform: `translate(${knob.x}px, ${knob.y}px)` }}
      >
        ❄
      </div>
    </div>
  );
}
