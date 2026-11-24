"use client";

import { usePathname } from "next/navigation";
import { FlaskTree, GlowBuddy, RoundBuddy } from "./Doodles";
import { Walkers } from "./Walkers";

const PINES = [
  { x: 34, y: 92, size: 1.05 },
  { x: 78, y: 84, size: 0.75 },
  { x: 402, y: 84, size: 0.8 },
  { x: 448, y: 92, size: 1.1 },
];

/** No scene here: these pages have their own backdrop, or scroll over the same spot. */
const PAGES_WITHOUT_SCENE = ["/note", "/final", "/cute", "/explore"];

function Pine({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <rect x="-3" y="-6" width="6" height="10" fill="#3a2114" />
      <path fill="#123f24" d="M0 -62L18 -32H9L24 -6H-24L-9 -32H-18Z" />
      <path fill="#fff" d="M0 -62L9 -47C5 -44 3 -47 0 -44C-3 -47 -5 -44 -9 -47Z" />
      <path fill="#fff" d="M-14 -25L-18 -17C-13 -19 -10 -17 -7 -20Z M14 -25L18 -17C13 -19 10 -17 7 -20Z" />
    </g>
  );
}

/** Snowy hills, pines and a little cabin along the bottom of outdoor pages. */
export function WinterScene() {
  const pathname = usePathname();
  if (PAGES_WITHOUT_SCENE.some((page) => pathname.startsWith(page))) return null;

  return (
    <svg
      viewBox="0 0 480 120"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-1 h-[min(15dvh,120px)] w-full"
    >
      <path fill="#b9c8dc" d="M0 86C70 64 150 70 240 84C320 96 410 66 480 80V120H0Z" />
      {PINES.map((pine) => (
        <Pine key={pine.x} {...pine} />
      ))}
      <g transform="translate(120 66)">
        <rect x="0" y="12" width="40" height="26" fill="#5a2e1a" />
        <rect x="14" y="20" width="12" height="11" fill="#ffd27a" />
        <path d="M20 20V31M14 25.5H26" stroke="#5a2e1a" strokeWidth="1.5" />
        <path fill="#fff" d="M-7 14L20 -6L47 14C42 17 38 15 34 15C28 18 24 15 20 15C14 18 10 15 6 15C2 17 -3 17 -7 14Z" />
      </g>
      <GlowBuddy x="130" y="38" width="20" height="26" />
      <RoundBuddy x="326" y="66" width="34" height="37" />
      <FlaskTree x="362" y="62" width="30" height="42" />
      <path fill="#eef3f9" d="M0 104C80 84 170 106 260 98C340 90 420 106 480 96V120H0Z" />
      <Walkers />
    </svg>
  );
}
