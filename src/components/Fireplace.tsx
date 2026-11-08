import { Boba, GlowBuddy, KimchiRice, SpicySock } from "./Doodles";

const FLAMES = [
  { fill: "#e8502a", scale: 1, delay: "0s" },
  { fill: "#f7a02c", scale: 0.74, delay: "-0.25s" },
  { fill: "#ffe08a", scale: 0.46, delay: "-0.45s" },
];

const STOCKINGS = [
  { x: 42, color: "#c4183a" },
  { x: 254, color: "#1d7a3a" },
];

const GARLAND_LIGHTS = ["#ff3b5c", "#f3c969", "#6bb8ff", "#4fe07a"];

/** A brick fireplace with a living fire, a snowy mantel and three stockings. */
export function Fireplace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -44 320 254" aria-hidden className={className}>
      <defs>
        <pattern id="bricks" width="36" height="20" patternUnits="userSpaceOnUse">
          <rect width="36" height="20" fill="#6e2f24" />
          <path d="M0 0H36M0 10H36M12 0V10M30 10V20" stroke="#47190f" strokeWidth="1.4" />
        </pattern>
        <radialGradient id="fire-glow">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ff6a1f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="26" y="30" width="268" height="168" fill="url(#bricks)" />
      <path d="M86 198V126Q86 88 124 88H196Q234 88 234 126V198Z" fill="#c9b8a4" />
      <path d="M96 198V128Q96 98 126 98H194Q224 98 224 128V198Z" fill="#150706" />

      <ellipse className="animate-hearth" cx="160" cy="170" rx="74" ry="56" fill="url(#fire-glow)" />
      {FLAMES.map(({ fill, scale, delay }) => (
        <g key={fill} transform={`translate(160 186) scale(${scale}) translate(-160 -186)`}>
          <path
            className="animate-flicker"
            style={{
              transformBox: "fill-box",
              transformOrigin: "50% 100%",
              animationDelay: delay,
            }}
            fill={fill}
            d="M160 188C126 188 118 160 136 138C138 152 146 150 147 134C148 118 160 112 164 100C168 118 184 126 185 148C190 144 192 138 192 134C206 158 196 188 160 188Z"
          />
        </g>
      ))}
      <g stroke="#2a130a" strokeWidth="1.5">
        <rect x="116" y="182" width="88" height="11" rx="5.5" fill="#6b3f22" transform="rotate(-7 160 188)" />
        <rect x="116" y="182" width="88" height="11" rx="5.5" fill="#7d4a28" transform="rotate(7 160 188)" />
      </g>

      <rect x="10" y="194" width="300" height="14" rx="3" fill="#8d8078" />
      <rect x="10" y="194" width="300" height="3" rx="1.5" fill="#b0a59c" />

      <rect x="8" y="20" width="304" height="16" rx="3" fill="#6b3f22" />
      <rect x="8" y="33" width="304" height="4" rx="2" fill="#4a2a15" />
      <path
        fill="#fff"
        d="M8 21C12 11 24 13 36 13C60 8 84 12 108 11C134 8 158 12 184 11C212 8 240 12 266 11C286 10 308 12 312 21C304 26 298 24 290 22C278 26 266 25 256 22C240 26 226 25 214 22C196 26 180 25 168 22C150 26 136 26 122 22C104 26 90 25 78 22C60 26 48 25 36 22C26 26 14 26 8 21Z"
      />

      <KimchiRice x="34" y="-40" width="66" height="57" />
      <GlowBuddy x="150" y="-22" width="28" height="36" />
      <Boba x="236" y="-34" width="32" height="52" />

      <SpicySock x="136" y="33" width="50" height="70" />
      {STOCKINGS.map(({ x, color }) => (
        <g key={x} transform={`translate(${x} 36)`}>
          <path
            fill={color}
            stroke="rgba(0,0,0,0.35)"
            d="M3 6H25V32C25 37 29 39 33 41C40 45 38 54 29 54C20 54 12 51 6 45C2 41 3 36 3 31Z"
          />
          <rect x="0" y="0" width="28" height="11" rx="4" fill="#fff6ec" />
        </g>
      ))}

      {[...Array(13).keys()].map((i) => (
        <circle
          key={i}
          className="animate-twinkle"
          style={{ animationDelay: `${(i * 0.31) % 1.6}s` }}
          cx={22 + i * 23}
          cy={i % 2 ? 29 : 31}
          r="2.6"
          fill={GARLAND_LIGHTS[i % GARLAND_LIGHTS.length]}
        />
      ))}
    </svg>
  );
}
