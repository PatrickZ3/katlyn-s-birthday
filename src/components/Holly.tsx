/** Two holly leaves and three berries. Size it with a width class. */
export function Holly({ className }: { className?: string }) {
  const leaf =
    "M0 0 C6 -7 10 -5 13 -9 C15 -5 20 -6 23 -9 C24 -5 29 -4 33 -6 C32 -2 36 1 40 2 C34 5 33 8 33 11 C29 9 25 10 22 13 C20 9 15 9 12 11 C11 7 5 5 0 0 Z";
  return (
    <svg viewBox="0 0 96 56" aria-hidden className={`pointer-events-none ${className ?? ""}`}>
      <g stroke="#0e3d1f" strokeWidth="1.2" strokeLinejoin="round">
        <path d={leaf} fill="#1f8a44" transform="translate(50 30) rotate(-14)" />
        <path d={leaf} fill="#197338" transform="translate(46 30) rotate(194)" />
      </g>
      <g stroke="#7a0c20" strokeWidth="0.8">
        <circle cx="42" cy="36" r="7" fill="#e0213f" />
        <circle cx="54" cy="36" r="7" fill="#c4183a" />
        <circle cx="48" cy="26" r="7" fill="#f0304e" />
      </g>
    </svg>
  );
}
