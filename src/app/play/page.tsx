"use client";

import { GameBoard } from "@/components/GameBoard";
import { useGame } from "@/components/GameProvider";
import { Goals } from "@/components/Goals";
import { LevelOverlay } from "@/components/LevelOverlay";
import { SnowCap } from "@/components/SnowCap";
import { LEVELS } from "@/game/levels";

export default function PlayPage() {
  const { game } = useGame();
  if (!game) return null;

  return (
    <section className="flex h-full w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <div className="pill">
          <SnowCap />
          Level {game.levelIndex + 1} / {LEVELS.length}
        </div>
        <div className="pill">
          <SnowCap />
          Moves <b className="text-[1.15rem] text-gold">{game.moves}</b>
        </div>
      </div>
      <Goals goals={game.goals} />
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <GameBoard />
      </div>
      <LevelOverlay />
    </section>
  );
}
