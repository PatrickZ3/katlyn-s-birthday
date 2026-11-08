import type { ReactNode } from "react";
import { Holly } from "./Holly";
import { SnowCap } from "./SnowCap";

/** The gold-edged note card, with snow on top and a sprig of holly. */
export function SnowCard({ children }: { children: ReactNode }) {
  return (
    <div className="note-card">
      <SnowCap />
      <Holly className="absolute -top-4 -left-3 z-10 w-14" />
      {children}
    </div>
  );
}
