const BULBS = 13;
const SWAGS = 6;
const COLORS = ["#ff3b5c", "#f3c969", "#4fe07a", "#fff3e6", "#6bb8ff"];

const WIRE_TOP = 6;
const CONTROL_DROP = 16;

const swagWidth = 100 / SWAGS;
const wirePath =
  `M0,${WIRE_TOP} ` +
  Array.from({ length: SWAGS }, (_, i) => {
    const start = i * swagWidth;
    return `Q${start + swagWidth / 2},${WIRE_TOP + CONTROL_DROP * 2} ${start + swagWidth},${WIRE_TOP}`;
  }).join(" ");

/** Height of the wire at `x` (0-100), so each bulb hangs from it. */
function wireY(x: number) {
  const t = (x % swagWidth) / swagWidth;
  return WIRE_TOP + 4 * CONTROL_DROP * t * (1 - t);
}

export function FairyLights() {
  return (
    <div className="pointer-events-none fixed top-[env(safe-area-inset-top)] left-1/2 z-3 h-[46px] w-full max-w-[480px] -translate-x-1/2">
      <svg
        viewBox="0 0 100 46"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <path
          d={wirePath}
          fill="none"
          stroke="#2c1a10"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = ((i + 0.5) / BULBS) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div
            key={i}
            className="bulb absolute h-[15px] w-2.5 animate-twinkle rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
            style={{
              left: `calc(${x}% - 5px)`,
              top: `${wireY(x) + 3}px`,
              background: color,
              boxShadow: `0 0 10px 3px ${color}`,
              animationDelay: `${(i * 0.37) % 1.6}s`,
            }}
          />
        );
      })}
    </div>
  );
}
