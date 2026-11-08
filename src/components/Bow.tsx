import type { SVGProps } from "react";

/** A gold ribbon bow for the top of a wrapped gift. */
export function Bow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 86 46" aria-hidden {...props}>
      <g stroke="#9a6d12" strokeWidth="1.2" strokeLinejoin="round">
        <path fill="#e7b43e" d="M38 30L26 44L22 36L13 37L30 24Z" />
        <path fill="#e7b43e" d="M48 30L60 44L64 36L73 37L56 24Z" />
        <path fill="#f3c969" d="M43 24C30 4 8 0 4 8C0 18 22 32 43 27Z" />
        <path fill="#f3c969" d="M43 24C56 4 78 0 82 8C86 18 64 32 43 27Z" />
        <rect x="35" y="17" width="16" height="15" rx="5" fill="#ffe29a" />
      </g>
    </svg>
  );
}
