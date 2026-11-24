"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { playSfx } from "@/audio/engine";
import { GlowBuddy, RoundBuddy } from "@/components/Doodles";
import { Letter } from "@/components/Letter";
import { ElementTiles } from "@/components/ElementTiles";
import { useGame } from "@/components/GameProvider";
import { Present } from "@/components/Present";
import { PresentGlow } from "@/components/PresentGlow";
import { fireConfetti, rainConfetti } from "@/components/Confetti";
import { burstSparkles } from "@/components/Sparkles";
import { config } from "@/config";

/** When the present lands after popping in: the fanfare and confetti go off then. */
const ENTRANCE_DELAY_S = 0.35;
const CELEBRATE_MS = 650;

function centerOf(element: Element | null) {
  const rect = element?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
}

export default function FinalPage() {
  const { final, name } = config;
  const router = useRouter();
  const { playAgain } = useGame();
  const [opening, setOpening] = useState(false);
  const [landed, setLanded] = useState(false);
  const [reading, setReading] = useState(false);
  const present = useRef<HTMLButtonElement>(null);

  // The present pops in, then the fanfare plays and confetti flies everywhere.
  useEffect(() => {
    burstSparkles(200);
    const celebrate = setTimeout(() => {
      setLanded(true);
      playSfx("fanfare");
      fireConfetti(150, centerOf(present.current));
      rainConfetti(110);
    }, CELEBRATE_MS);
    return () => {
      clearTimeout(celebrate);
    };
  }, []);

  const openPresent = () => {
    if (opening) return;
    setOpening(true);
    playSfx("gift");
    burstSparkles(160);
    fireConfetti(120, centerOf(present.current));
    // The letter opens straight away, over the present. Closing it goes on
    // to the gifts.
    setReading(true);
  };

  return (
    <section className="flex h-full w-full flex-col items-center gap-[min(10px,1.6dvh)] text-center">
      <div className="relative z-10 flex flex-col items-center gap-[min(8px,1.2dvh)]">
        <div className="text-[0.8rem] font-extrabold tracking-[0.2em] text-gold uppercase">
          {final.badge}
        </div>
        <h1 className="script-title text-[clamp(2.4rem,10vw,3.2rem)]">
          {final.greeting}
          <br />
          <span className="text-gold">{name}</span>
        </h1>
        <p className="flex items-center gap-2 text-[1.2rem] font-extrabold">
          {final.message}
          <span className="inline-block animate-beat text-[1.4rem] leading-none text-red">❤</span>
          <ElementTiles />
        </p>
      </div>

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <PresentGlow opening={opening} />
        <RoundBuddy className="pointer-events-none absolute bottom-[6%] left-[3%] z-10 w-[54px]" />
        <GlowBuddy className="pointer-events-none absolute right-[6%] bottom-[6%] z-10 w-[38px]" />
        {/* A ring of light bursts out when the present lands. */}
        {landed && (
          <motion.span
            aria-hidden
            className="blast-ring pointer-events-none absolute top-1/2 left-1/2 z-10 aspect-square w-[min(58vw,31dvh,270px)] -translate-1/2"
            initial={{ scale: 0.4, opacity: 1 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0, y: 70, rotate: -14 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 11, delay: ENTRANCE_DELAY_S }}
        >
        <motion.button
          ref={present}
          data-own-sound
          aria-label={final.presentLabel}
          className="relative z-10 aspect-[200/210] w-[min(58vw,31dvh,270px)]"
          animate={opening ? { scale: 1.08 } : { y: [0, -8, 0], rotate: [0, -1.5, 1.5, 0] }}
          transition={opening ? { duration: 0.3 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.93 }}
          onClick={openPresent}
        >
          <Present opening={opening} />
        </motion.button>
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-[min(10px,1.6dvh)]">
        <p className="font-extrabold text-gold [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
          {final.presentHint}
        </p>
        <button
          className="btn-quiet"
          onClick={() => {
            playAgain();
            router.push("/");
          }}
        >
          {final.button}
        </button>
      </div>
      <Letter open={reading} onClose={() => router.push("/gift")} />
    </section>
  );
}
