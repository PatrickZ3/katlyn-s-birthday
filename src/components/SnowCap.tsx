/**
 * A drift of snow that sits along the top edge. The parent must be position: relative.
 * `className` sets where it sits across the top (its left edge and width).
 */
export function SnowCap({ className = "left-[9%] w-[82%]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden
      className={`pointer-events-none absolute -top-[7px] z-10 h-[15px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] ${className}`}
    >
      <path
        fill="#dbe7f3"
        d="M0 13 C8 3 20 1 34 3 C50 0 62 1 78 3 C96 0 112 0 128 3 C146 0 160 1 172 3 C186 2 196 6 200 13 C194 20 186 19 180 14 C172 20 162 19 156 14 C146 19 134 20 126 14 C116 19 102 20 94 14 C84 19 72 20 64 14 C54 20 44 19 36 14 C26 20 12 20 0 13 Z"
      />
      <path
        fill="#fff"
        d="M2 12 C10 3 20 1 34 2 C50 0 62 0 78 2 C96 0 112 0 128 2 C146 0 160 0 172 2 C186 1 194 5 198 11 C190 15 184 14 178 11 C170 15 162 15 154 11 C144 15 134 15 124 11 C114 15 104 15 92 11 C82 15 72 15 62 11 C52 15 44 15 34 11 C24 16 12 16 2 12 Z"
      />
    </svg>
  );
}
