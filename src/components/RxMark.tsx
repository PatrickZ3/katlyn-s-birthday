/**
 * The real prescription symbol: a serif capital R with a line crossing its
 * leg. It's drawn by hand because most fonts don't include this character.
 */
export function RxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 30" role="img" aria-label="Prescription" className={className}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path strokeWidth="3.4" d="M7.500 3.500V21" />
        <path strokeWidth="2" d="M3 2.800H14C21 2.800 21 13.200 14 13.200H7.500M3.500 21.500H11" />
        <path strokeWidth="3" d="M11.500 13.500L22.500 27.500" />
        <path strokeWidth="2" d="M14.500 27.500L23.500 16.500" />
      </g>
    </svg>
  );
}
