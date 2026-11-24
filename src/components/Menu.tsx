"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { isMuted, setMuted } from "@/audio/engine";
import { useEffect, useRef, useState } from "react";
import { config } from "@/config";
import { useGame } from "./GameProvider";

const edge = "right-[max(12px,calc(50%-228px))]";

export function Menu() {
  const [open, setOpen] = useState(false);
  const [muted, setMutedLabel] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { restartLevel } = useGame();

  // Storage only exists in the browser, so the saved choice is read after mounting.
  useEffect(() => setMutedLabel(isMuted()), []);

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeIfOutside);
    return () => document.removeEventListener("pointerdown", closeIfOutside);
  }, [open]);

  const items = [
    { label: "🏠 Home", run: () => router.push("/") },
    {
      label: "🔄 Restart level",
      run: () => {
        restartLevel();
        router.push("/play");
      },
    },
    { label: "🎄 Pick a level", run: () => router.push("/levels") },
    { label: "🧸 Cute stuff", run: () => router.push("/cute") },
    { label: config.explore.menuLabel, run: () => router.push("/explore") },
    { label: "🎁 Unlock gift", run: () => router.push("/final") },
    {
      label: muted ? "🔊 Turn sound on" : "🔇 Turn sound off",
      run: () => {
        setMuted(!muted);
        setMutedLabel(!muted);
      },
    },
  ];

  return (
    <div ref={root}>
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`fixed top-[calc(10px+env(safe-area-inset-top))] ${edge} z-40 flex size-[42px] flex-col items-center justify-center gap-[5px] rounded-xl border border-gold/35 bg-bg/60 backdrop-blur-sm`}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-0.5 w-5 rounded-xs bg-gold" />
        ))}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            className={`fixed top-[calc(58px+env(safe-area-inset-top))] ${edge} z-40 min-w-[190px] rounded-[14px] border border-gold/35 bg-[rgba(30,8,14,0.95)] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {items.map(({ label, run }) => (
              <button
                key={label}
                className="block w-full rounded-[10px] px-3.5 py-3 text-left font-bold text-cream hover:bg-red/35 active:bg-red/35"
                onClick={() => {
                  setOpen(false);
                  run();
                }}
              >
                {label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
