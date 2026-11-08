import type { Goals as GoalCounts } from "@/game/types";
import { SnowCap } from "./SnowCap";

export function Goals({ goals }: { goals: GoalCounts }) {
  return (
    <div className="relative flex w-full flex-wrap justify-center gap-2.5 rounded-2xl border border-gold/20 bg-bg/50 p-2.5">
      <SnowCap />
      {Object.entries(goals).map(([color, left]) => (
        <div key={color} className="flex min-w-[52px] items-center gap-1.5 font-extrabold">
          <span className={`ornament color-${color} size-[22px]`} />
          <b className={left <= 0 ? "text-done" : undefined}>{left <= 0 ? "✓" : left}</b>
        </div>
      ))}
    </div>
  );
}
