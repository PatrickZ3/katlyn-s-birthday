"use client";

import { AnimatePresence, motion } from "framer-motion";
import { config } from "@/config";
import { isLastLevel } from "@/game/game";
import { LEVELS } from "@/game/levels";
import { Boba, FlaskTree, GlowBuddy, KimchiRice, RoundBuddy } from "./Doodles";
import { useGame } from "./GameProvider";
import { SnowCard } from "./SnowCard";

/** A treat for each level beaten. */
const TREATS = [Boba, GlowBuddy, KimchiRice, RoundBuddy];

export function LevelOverlay() {
  const { game, nextLevel, restartLevel } = useGame();
  const text = config.game;
  if (!game) return null;

  const level = game.levelIndex;
  const won = game.status === "won" && !isLastLevel(level);
  const lost = game.status === "lost";
  const Treat = won ? TREATS[level % TREATS.length] : FlaskTree;

  return (
    <AnimatePresence>
      {(won || lost) && (
        <motion.div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(10,2,5,0.7)] p-6 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <SnowCard>
            <div className="animate-bob">
              <Treat className="mx-auto h-[86px]" />
            </div>
            <h2 className="mt-1.5 mb-2 font-script text-[2.4rem] text-gold">
              {won ? `Level ${level + 1} complete!` : text.loseTitle}
            </h2>
            <p className="mb-3 leading-normal">
              {!won
                ? text.loseText
                : level + 1 === LEVELS.length - 1
                  ? text.lastLevelNextText
                  : text.levelWinText}
            </p>
            <button className="btn" onClick={won ? nextLevel : restartLevel}>
              {won ? text.nextButton : text.retryButton}
            </button>
            </SnowCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
