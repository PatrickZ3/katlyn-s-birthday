"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { playSfx } from "@/audio/engine";
import { GlowBuddy, RoundBuddy } from "@/components/Doodles";
import { ElementTiles } from "@/components/ElementTiles";
import { useGame } from "@/components/GameProvider";
import { Present } from "@/components/Present";
import { PresentGlow } from "@/components/PresentGlow";
import { burstSparkles } from "@/components/Sparkles";
import { config } from "@/config";

const OPEN_MS = 760;

export default function FinalPage() {
  const { final, name } = config;
  const router = useRouter();
  const { playAgain } = useGame();
  const [opening, setOpening] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    burstSparkles(200);
    return () => clearTimeout(openTimer.current);
  }, []);

  const openPresent = () => {
    if (opening) return;
    setOpening(true);
    playSfx("gift");
    burstSparkles(160);
    openTimer.current = setTimeout(() => router.push("/gift"), OPEN_MS);
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
        <motion.button
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
    </section>
  );
}
