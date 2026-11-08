import type { SVGProps } from "react";

/**
 * Small hand-drawn extras scattered around the site. They're plain SVGs, so
 * size them with a width class, or x/y/width/height inside another SVG.
 */
type Doodle = SVGProps<SVGSVGElement>;

const base = { "aria-hidden": true, overflow: "visible" } as const;

const RICE_GRAINS = [
  [24, 46], [34, 38], [44, 50], [84, 34], [92, 46], [76, 48], [62, 50], [50, 28], [98, 40], [20, 50], [70, 26],
];
const KIMCHI = [
  [28, 44, -20], [88, 40, 25], [72, 52, 10], [46, 47, -35], [98, 49, 15],
];
const SCALLION = [[38, 45], [80, 30], [60, 48], [94, 44], [24, 50]];

/** Kimchi fried rice in a bowl, topped with a fried egg. */
export function KimchiRice(props: Doodle) {
  return (
    <svg viewBox="0 0 120 104" {...base} {...props}>
      <g className="animate-hearth" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
        <path d="M42 14C36 8 48 5 42 -2" />
        <path d="M62 12C56 5 68 1 62 -7" />
        <path d="M82 14C76 8 88 5 82 -2" />
      </g>
      <path fill="#e2552b" d="M14 58C14 36 34 22 60 22C86 22 106 36 106 58Z" />
      <path fill="#c93f1e" d="M14 58C30 50 90 50 106 58C90 62 30 62 14 58Z" />
      {RICE_GRAINS.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.4" ry="1.8" fill="#ffc9a0" transform={`rotate(${x * 7} ${x} ${y})`} />
      ))}
      {KIMCHI.map(([x, y, turn]) => (
        <rect key={`${x}-${y}`} x={x - 5} y={y - 3} width="10" height="6" rx="1.5" fill="#a81616" transform={`rotate(${turn} ${x} ${y})`} />
      ))}
      {SCALLION.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="none" stroke="#58c14f" strokeWidth="1.8" />
      ))}
      <path fill="#fffdf6" stroke="#e9dcc2" d="M36 32C34 22 46 14 58 17C70 12 84 20 82 30C86 38 72 44 60 40C48 45 36 42 36 32Z" />
      <circle cx="59" cy="28" r="10" fill="#ffb31a" />
      <circle cx="56" cy="25" r="3" fill="#ffe08a" />
      <path fill="#fbf4e8" d="M10 56H110C108 84 88 100 60 100C32 100 12 84 10 56Z" />
      <path fill="#2f5f9e" d="M12.500 66H107.500C106.700 69 105.500 72 104 75H16C14.500 72 13.300 69 12.500 66Z" />
      <path fill="#000" opacity="0.1" d="M80 56H110C108 84 88 100 60 100C72 90 80 74 80 56Z" />
      <rect x="6" y="52" width="108" height="7" rx="3.5" fill="#fff" />
    </svg>
  );
}

/** A cup of milk tea with tapioca pearls and a little smile. */
export function Boba(props: Doodle) {
  const pearls = [[22, 96], [34, 99], [46, 97], [28, 86], [40, 88], [50, 86], [20, 84]];
  return (
    <svg viewBox="0 0 70 114" {...base} {...props}>
      <path d="M45 34L56 -2" stroke="#f26d8f" strokeWidth="7" strokeLinecap="round" />
      <path fill="#d9b48c" d="M12 30H58L52 106Q35 111 18 106Z" />
      <path fill="#fff" opacity="0.22" d="M17 34H26L28 104Q23 104 21 103Z" />
      {pearls.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5.500" fill="#3a2418" />
      ))}
      <path fill="#fff" opacity="0.75" d="M8 24C8 16 62 16 62 24V30H8Z" />
      <rect x="6" y="28" width="58" height="5" rx="2.500" fill="#fff" />
      <circle cx="27" cy="54" r="2.500" fill="#3a2418" />
      <circle cx="43" cy="54" r="2.500" fill="#3a2418" />
      <path d="M31 59Q35 63 39 59" fill="none" stroke="#3a2418" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="21" cy="60" rx="4" ry="2.500" fill="#f29a9a" opacity="0.8" />
      <ellipse cx="49" cy="60" rx="4" ry="2.500" fill="#f29a9a" opacity="0.8" />
    </svg>
  );
}

/** A tiny glowing figure hugging its knees, in the spirit of a Smiski. */
export function GlowBuddy(props: Doodle) {
  return (
    <svg
      viewBox="0 0 60 78"
      {...base}
      {...props}
      style={{ filter: "drop-shadow(0 0 5px rgba(217, 242, 166, 0.85))" }}
    >
      <g fill="#dcefae" stroke="#a9c778" strokeWidth="1.4">
        <path d="M14 42C14 34 46 34 46 42L48 66C48 74 12 74 12 66Z" />
        <path d="M10 62C8 54 18 50 24 56L28 68C28 74 12 74 10 62Z" />
        <path d="M50 62C52 54 42 50 36 56L32 68C32 74 48 74 50 62Z" />
        <circle cx="30" cy="24" r="20" />
        <path d="M15 44C20 54 24 58 29 58C31 56 30 53 28 52C24 50 22 46 21 42Z" />
        <path d="M45 44C40 54 36 58 31 58C29 56 30 53 32 52C36 50 38 46 39 42Z" />
      </g>
      <circle cx="23" cy="25" r="1.700" fill="#4e6134" />
      <circle cx="37" cy="25" r="1.700" fill="#4e6134" />
      <path d="M28 30Q30 31.500 32 30" fill="none" stroke="#4e6134" strokeWidth="1.300" strokeLinecap="round" />
    </svg>
  );
}

/** A tiny round white creature with a red scarf, in the spirit of Chiikawa. */
export function RoundBuddy(props: Doodle) {
  return (
    <svg viewBox="0 0 80 86" {...base} {...props}>
      <g fill="#fffdf8" stroke="#6b5a50" strokeWidth="2">
        <circle cx="20" cy="17" r="8" />
        <circle cx="60" cy="17" r="8" />
        <path d="M24 56C20 66 22 80 30 82H50C58 80 60 66 56 56Z" />
        <path d="M22 60C14 62 12 70 18 71C22 72 26 66 28 62Z" />
        <path d="M58 60C66 62 68 70 62 71C58 72 54 66 52 62Z" />
        <ellipse cx="40" cy="38" rx="31" ry="27" />
      </g>
      <circle cx="28" cy="38" r="4.500" fill="#2b2320" />
      <circle cx="52" cy="38" r="4.500" fill="#2b2320" />
      <circle cx="29.500" cy="36.500" r="1.500" fill="#fff" />
      <circle cx="53.500" cy="36.500" r="1.500" fill="#fff" />
      <path d="M36 44Q40 48 44 44" fill="none" stroke="#6b5a50" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="19" cy="46" rx="6" ry="3.500" fill="#f6a6b2" />
      <ellipse cx="61" cy="46" rx="6" ry="3.500" fill="#f6a6b2" />
      <path fill="#c4183a" d="M23 60C32 66 48 66 57 60L58 66C48 72 32 72 22 66Z" />
      <path fill="#a50f2b" d="M49 66L56 78L48 79L44 68Z" />
    </svg>
  );
}

/** A black Christmas sock in the style of a fire-noodle packet: flames, chili, red cuff. */
export function SpicySock(props: Doodle) {
  return (
    <svg viewBox="0 0 84 118" {...base} {...props}>
      <path fill="#17120f" stroke="#000" d="M8 18H52V68C52 76 62 80 70 84C84 92 80 112 62 112C44 112 26 106 15 94C7 86 8 76 8 66Z" />
      <path fill="#e8261c" d="M8 80C14 72 16 86 24 78C28 72 28 88 36 82C42 76 42 92 50 84C54 78 58 92 66 84C70 82 78 92 76 98C74 112 64 112 62 112C44 112 26 106 15 94C10 88 8 86 8 80Z" />
      <path fill="#ff9a1f" d="M16 90C22 84 24 94 32 90C38 84 38 98 48 94C54 90 56 100 66 96C70 96 72 100 70 104C66 112 60 111 52 110C38 108 26 102 16 90Z" />
      <path fill="#d9141a" d="M38 34C46 34 48 42 44 50C40 60 30 68 18 68C28 62 30 52 30 44C30 38 33 34 38 34Z" />
      <path d="M38 34C38 30 41 28 44 27" fill="none" stroke="#3fae49" strokeWidth="3.500" strokeLinecap="round" />
      <path d="M36 42C34 48 32 52 28 56" fill="none" stroke="#ff8d84" strokeWidth="2.200" strokeLinecap="round" />
      <rect x="2" y="2" width="56" height="20" rx="5" fill="#d9141a" />
      <text x="30" y="17" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">불닭</text>
    </svg>
  );
}

/** An Erlenmeyer flask of green solution that doubles as a Christmas tree. */
export function FlaskTree(props: Doodle) {
  const ornaments = [
    { x: 35, y: 62, fill: "#ff3b5c" },
    { x: 24, y: 76, fill: "#f3c969" },
    { x: 46, y: 77, fill: "#6bb8ff" },
    { x: 35, y: 84, fill: "#fff3e6" },
  ];
  return (
    <svg viewBox="0 0 70 96" {...base} {...props}>
      <path fill="#f3c969" stroke="#fff3c4" strokeWidth="0.800" d="M35 0L38 7L46 7L40 12L42 20L35 15L28 20L30 12L24 7L32 7Z" />
      <rect x="27" y="20" width="16" height="6" rx="2" fill="#d6c2a8" />
      <path fill="#2fae5e" d="M28 46L12 82C9 90 13 93 19 93H51C57 93 61 90 58 82L42 46Z" />
      <path fill="#fff" opacity="0.5" d="M28 46H42L43 49H27Z" />
      <path fill="none" stroke="#e8f3fb" strokeOpacity="0.9" strokeWidth="2.500" strokeLinejoin="round" d="M29 26V44L10 82C6 91 12 95 19 95H51C58 95 64 91 60 82L41 44V26" />
      {ornaments.map(({ x, y, fill }) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.300" fill={fill} />
      ))}
      <g fill="#fff" opacity="0.7">
        <circle cx="33" cy="38" r="2" />
        <circle cx="38" cy="33" r="1.400" />
      </g>
    </svg>
  );
}

/** A candy-striped capsule. */
export function Capsule(props: Doodle) {
  return (
    <svg viewBox="0 0 72 30" {...base} {...props}>
      <path fill="#fff6ec" d="M36 2H15C7 2 2 8 2 15C2 22 7 28 15 28H36Z" />
      <path fill="#d9142f" d="M36 2H57C65 2 70 8 70 15C70 22 65 28 57 28H36Z" />
      <path fill="#d9142f" d="M9 4L15 2L25 28H18ZM24 2H31L36 15V28H34Z" />
      <path fill="#fff" opacity="0.4" d="M40 6H58C62 6 65 8 66 11H40Z" />
    </svg>
  );
}

/** A benzene ring. */
export function Benzene(props: Doodle) {
  return (
    <svg viewBox="0 0 80 84" {...base} {...props}>
      <g fill="none" stroke="#fff3e6" strokeWidth="4" strokeLinejoin="round">
        <path d="M40 6L72 24V60L40 78L8 60V24Z" />
        <circle cx="40" cy="42" r="19" stroke="#f3c969" />
      </g>
    </svg>
  );
}

/** Aspirin (acetylsalicylic acid) as a skeletal formula. */
export function Aspirin(props: Doodle) {
  return (
    <svg viewBox="0 0 128 98" {...base} {...props}>
      <g fill="none" stroke="#fff3e6" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round">
        {/* Ring, with its three double bonds drawn inside. */}
        <path d="M44 38L63 49V71L44 82L25 71V49Z" />
        <path d="M58 52.500V67.500M44 76.500L31 69M31 51L44 43.500" />
        {/* Carboxylic acid on the top carbon. */}
        <path d="M44 38V20" />
        <path d="M42.600 22.200L29.600 14.700M44.600 18.800L31.600 11.300" />
        <path d="M44 20L58 12" />
        {/* Ester on the next carbon round: O, then C(=O), then the methyl group. */}
        <path d="M63 49L76 41.500" />
        <path d="M86 41.500L99 49" />
        <path d="M99 49L118 38" />
        <path d="M96.500 49V66M101.500 49V66" />
      </g>
      <g fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
        <text x="25" y="14" fill="#ff7a8a">O</text>
        <text x="70" y="14" fill="#ff7a8a">OH</text>
        <text x="81" y="43" fill="#ff7a8a">O</text>
        <text x="99" y="79" fill="#ff7a8a">O</text>
      </g>
    </svg>
  );
}

/** A rack of three test tubes in Christmas colours. */
export function TestTubes(props: Doodle) {
  const tubes = [
    { x: 16, fill: "#e8334f", top: 34 },
    { x: 44, fill: "#2fae5e", top: 44 },
    { x: 72, fill: "#f3c969", top: 28 },
  ];
  return (
    <svg viewBox="0 0 104 96" {...base} {...props}>
      {tubes.map(({ x, fill, top }) => (
        <g key={x}>
          <path fill={fill} d={`M${x} ${top}H${x + 16}V76C${x + 16} 88 ${x} 88 ${x} 76Z`} />
          <circle cx={x + 6} cy={top + 14} r="2" fill="#fff" opacity="0.7" />
          <circle cx={x + 10} cy={top + 24} r="1.400" fill="#fff" opacity="0.7" />
          <path fill="none" stroke="#e8f3fb" strokeWidth="2.400" d={`M${x - 2} 8H${x + 18}M${x} 8V76C${x} 90 ${x + 16} 90 ${x + 16} 76V8`} />
        </g>
      ))}
      <rect x="4" y="50" width="96" height="7" rx="2" fill="#a8703f" />
      <rect x="4" y="88" width="96" height="7" rx="2" fill="#8a5a30" />
      <rect x="4" y="50" width="6" height="45" fill="#a8703f" />
      <rect x="94" y="50" width="6" height="45" fill="#a8703f" />
    </svg>
  );
}

/** A microscope. */
export function Microscope(props: Doodle) {
  return (
    <svg viewBox="0 0 84 96" {...base} {...props}>
      <path fill="none" stroke="#c9d3df" strokeWidth="8" strokeLinecap="round" d="M50 22C74 34 72 70 44 78" />
      <rect x="12" y="80" width="62" height="11" rx="4" fill="#8f9bab" />
      <rect x="14" y="62" width="40" height="6" rx="2" fill="#8f9bab" />
      <rect x="22" y="58" width="16" height="3.500" fill="#6bb8ff" />
      <g transform="rotate(-20 40 30)">
        <rect x="31" y="8" width="16" height="36" rx="3" fill="#eef3f9" />
        <rect x="34" y="-2" width="10" height="11" rx="2" fill="#2b2f36" />
        <rect x="35" y="44" width="8" height="10" rx="1.500" fill="#2b2f36" />
        <rect x="31" y="22" width="16" height="5" fill="#c4183a" />
      </g>
    </svg>
  );
}
