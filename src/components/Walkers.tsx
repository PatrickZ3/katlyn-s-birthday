import { config } from "@/config";

/** The top edge of the front snowy hill in WinterScene, plus a bit off each side. */
const HILL_TOP = "M-50 112L0 104C80 84 170 106 260 98C340 90 420 106 480 96L530 90";

/**
 * One full loop. The first buddy walks during the first half and the second
 * during the second half, so only one is out at a time. Bigger means slower.
 */
const LOOP_SECONDS = 50;

function Walk({ keyPoints, children }: { keyPoints: string; children: React.ReactNode }) {
  return (
    <g>
      <animateMotion
        path={HILL_TOP}
        dur={`${LOOP_SECONDS}s`}
        repeatCount="indefinite"
        calcMode="linear"
        keyPoints={keyPoints}
        keyTimes="0;0.5;1"
      />
      {children}
    </g>
  );
}

/** The green glowing buddy in a Santa hat. Its feet are at 0,0. */
function WalkingGlowBuddy() {
  return (
    <g className="walker-sway" style={{ filter: "drop-shadow(0 0 3px rgba(217, 242, 166, 0.8))" }}>
      <g fill="#dcefae" stroke="#a9c778" strokeWidth="0.800">
        <path className="walker-leg" d="M-5 -10L-6 -1C-6 1 -1 1 -1 -1L-1 -10Z" />
        <path className="walker-leg walker-leg-2" d="M1 -10L1 -1C1 1 6 1 6 -1L5 -10Z" />
        <path d="M-7 -16C-7 -20 7 -20 7 -16L7 -8C7 -5 -7 -5 -7 -8Z" />
        <path className="walker-leg walker-leg-2" d="M-7 -16L-11 -8C-11 -6 -8 -6 -7 -8L-5 -13Z" />
        <path className="walker-leg" d="M7 -16L11 -8C11 -6 8 -6 7 -8L5 -13Z" />
        <circle cy="-26" r="10" />
      </g>
      <circle cx="-1" cy="-26" r="1" fill="#4e6134" />
      <circle cx="6" cy="-26" r="1" fill="#4e6134" />
      <path d="M1.500 -22.500Q3 -21.500 4.500 -22.500" fill="none" stroke="#4e6134" strokeWidth="0.800" strokeLinecap="round" />
      <path fill="#e0283f" d="M-9 -31C-7 -41 5 -40 8 -32C2 -35 -4 -35 -9 -31Z" />
      <path fill="#e0283f" d="M-3 -38C-8 -41 -12 -38 -13 -33L-10 -32C-9 -35 -7 -36 -3 -35Z" />
      <circle cx="-13" cy="-32" r="2" fill="#fff" />
      <path fill="none" stroke="#fff" strokeWidth="2.600" strokeLinecap="round" d="M-8 -31C-3 -34 3 -34 7 -32" />
    </g>
  );
}

/** The little round white buddy in a red scarf. Its feet are at 0,0. */
function WalkingRoundBuddy() {
  return (
    <g transform="scale(-1 1)">
      <g className="walker-sway">
        <g fill="#fffdf8" stroke="#6b5a50" strokeWidth="1">
          <ellipse className="walker-leg" cx="-5" cy="-2.500" rx="3.500" ry="3" />
          <ellipse className="walker-leg walker-leg-2" cx="5" cy="-2.500" rx="3.500" ry="3" />
          <circle cx="-9" cy="-31" r="3.800" />
          <circle cx="9" cy="-31" r="3.800" />
          <path d="M-10 -14C-12 -8 -10 -2 -6 -2H6C10 -2 12 -8 10 -14Z" />
          <circle cy="-21" r="13" />
        </g>
        <circle cx="0" cy="-22" r="1.300" fill="#3a2d26" />
        <circle cx="8" cy="-22" r="1.300" fill="#3a2d26" />
        <path d="M2.500 -19Q4 -17.500 5.500 -19" fill="none" stroke="#6b5a50" strokeWidth="0.900" strokeLinecap="round" />
        <circle cx="-2" cy="-18.500" r="2" fill="#ffb7b7" fillOpacity="0.7" />
        <path fill="#e0283f" d="M-11 -11C-5 -8 5 -8 11 -11L11 -7C5 -5 -5 -5 -11 -7Z" />
        <path fill="#e0283f" d="M-9 -8L-13 -1L-8 -1L-5 -7Z" />
      </g>
    </g>
  );
}

/** Goes inside the WinterScene drawing, so the buddies stay on top of the hill. */
export function Walkers() {
  if (!config.decorations.walkers) return null;

  return (
    <g className="moving-decor walkers">
      <Walk keyPoints="0;1;1">
        <WalkingGlowBuddy />
      </Walk>
      <Walk keyPoints="1;1;0">
        <WalkingRoundBuddy />
      </Walk>
    </g>
  );
}
