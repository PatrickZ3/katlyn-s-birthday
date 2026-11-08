import { config } from "@/config";

function Reindeer({ x, y, delay, rudolph }: { x: number; y: number; delay: string; rudolph?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="santa-deer" style={{ animationDelay: delay }}>
        <path
          fill="none"
          stroke="#f4e4c8"
          strokeWidth="1.800"
          strokeLinecap="round"
          d="M15 -15L12 -24M12.800 -20L8 -23M18 -15L20 -25M19 -20L24 -23"
        />
        <g fill="none" stroke="#c9975f" strokeWidth="3.200" strokeLinecap="round">
          <path d="M-10 3L-18 11" />
          <path d="M-7 4L-12 13" />
          <path d="M8 4L15 12" />
          <path d="M11 3L20 8" />
        </g>
        <ellipse rx="14" ry="7" fill="#e2b483" />
        <path fill="#e2b483" d="M7 -5L13 -14L20 -11L14 3Z" />
        <ellipse cx="18" cy="-13" rx="7.500" ry="5" fill="#efc898" />
        <path fill="#fff" d="M-14 -3C-19 -5 -20 -1 -16 1Z" />
        <circle cx="19" cy="-15" r="1.200" fill="#2a1710" />
        <circle cx="25" cy="-12" r={rudolph ? 2.800 : 1.700} fill={rudolph ? "#ff3048" : "#3a2114"} />
        <path fill="none" stroke="#ffd27a" strokeWidth="2.400" d="M8 -7L14 3" />
      </g>
    </g>
  );
}

/** Santa, his sleigh and two reindeer. They face right. */
function SantaSleigh() {
  return (
    <svg viewBox="0 0 200 70" className="block w-full overflow-visible">
      <path
        fill="none"
        stroke="#ffd27a"
        strokeOpacity="0.8"
        strokeWidth="1.200"
        d="M72 31L132 36M132 36L172 28"
      />
      <Reindeer x={126} y={38} delay="-0.25s" />
      <Reindeer x={168} y={32} delay="0s" rudolph />

      {/* Sack of presents. */}
      <circle cx="30" cy="20" r="13" fill="#2f8f4e" />
      <rect x="20" y="4" width="13" height="12" rx="1.500" fill="#ffd27a" />
      <path stroke="#c4183a" strokeWidth="2.500" d="M26.500 4V16" />

      {/* Santa. */}
      <path fill="#e0283f" d="M42 42C40 26 46 18 56 18C66 18 70 28 68 42Z" />
      <circle cx="57" cy="15" r="8.500" fill="#ffd9bd" />
      <path fill="#fff" d="M48 16C47 30 57 34 66 16C63 21 59 21 57 19C55 21 51 21 48 16Z" />
      <path fill="#e0283f" d="M48 12C50 2 60 -1 66 10C60 8 54 8 48 12Z" />
      <path fill="#e0283f" d="M51 6C46 2 41 5 39 11L44 13C46 9 48 8 52 10Z" />
      <circle cx="39" cy="12" r="3.200" fill="#fff" />
      <path fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" d="M49 11C54 8 60 8 65 11" />
      <circle cx="60" cy="15" r="1.100" fill="#2a1710" />
      <path fill="none" stroke="#e0283f" strokeWidth="5" strokeLinecap="round" d="M62 26L71 31" />
      <circle cx="72" cy="31" r="3" fill="#fff" />

      {/* Sleigh. */}
      <path
        fill="#c4183a"
        stroke="#ffd27a"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M8 22C6 38 14 50 28 50H64C76 50 82 42 88 32C82 32 78 35 72 35H34C24 35 20 28 8 22Z"
      />
      <path
        fill="none"
        stroke="#ffd27a"
        strokeWidth="2.600"
        strokeLinecap="round"
        d="M28 50V58M64 50V58M12 58H82C90 58 93 53 92 48"
      />
    </svg>
  );
}

/** Flies across the strip above every page, just in front of the fairy lights. */
export function Santa() {
  if (!config.decorations.santa) return null;

  return (
    <div aria-hidden className="moving-decor pointer-events-none fixed inset-0 z-4 overflow-hidden">
      <div className="santa-flight">
        <div className="santa-bob">
          <SantaSleigh />
        </div>
      </div>
    </div>
  );
}
