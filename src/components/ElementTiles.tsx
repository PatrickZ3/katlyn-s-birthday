/** Iodine, livermorium and uranium: "I Lv U", spelled with the periodic table. */
const ELEMENTS = [
  { number: 53, symbol: "I" },
  { number: 116, symbol: "Lv" },
  { number: 92, symbol: "U" },
];

export function ElementTiles() {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      {ELEMENTS.map(({ number, symbol }) => (
        <span
          key={symbol}
          className="flex size-[34px] flex-col rounded-[5px] border border-gold/70 bg-bg/70 px-[3px] py-px text-left leading-none"
        >
          <span className="text-[0.55rem] font-bold text-muted">{number}</span>
          <span className="text-center text-[1.05rem] font-extrabold text-gold">{symbol}</span>
        </span>
      ))}
    </span>
  );
}
