"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Bow } from "@/components/Bow";
import { Capsule } from "@/components/Doodles";
import { Holly } from "@/components/Holly";
import { RxMark } from "@/components/RxMark";
import { SnowCap } from "@/components/SnowCap";
import { config } from "@/config";

/**
 * To change the gifts, edit `gift` in src/config.ts.
 * The instructions and maximums are written above it.
 */
const WRAPPING = ["gift-red", "gift-green", "gift-navy", "gift-candy"];

export default function GiftPage() {
  const { title, showRx, types } = config.gift;
  const [activeTab, setActiveTab] = useState(0);
  const active = types[activeTab];

  return (
    <section className="flex h-full w-full flex-col items-center">
      <div className="flex shrink-0 items-center gap-3">
        <Capsule className="w-10 -rotate-[24deg]" />
        <h1 className="script-title pb-2 text-[2.8rem] text-gold">{title}</h1>
        <Capsule className="w-10 rotate-[156deg]" />
      </div>

      <div role="tablist" className="gift-slider mt-[min(14px,2dvh)] shrink-0">
        <Holly className="absolute -top-4 -left-3 z-20 w-12" />
        {types.map((type, i) => (
          <button
            key={type.label}
            role="tab"
            aria-selected={i === activeTab}
            className="gift-tab"
            onClick={() => setActiveTab(i)}
          >
            {i === activeTab && (
              <motion.span
                layoutId="gift-thumb"
                className="gift-thumb"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              >
                <SnowCap />
              </motion.span>
            )}
            <span className="relative flex flex-col items-center leading-tight">
              <span aria-hidden className="text-[1.15rem] leading-6">
                {type.icon}
              </span>
              {type.label}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-[min(12px,1.8dvh)] shrink-0 text-center text-[0.85rem] font-bold text-muted italic">
        ❄ {active.dose} ❄
      </p>

      {/* The bottom margin stops the list above the snowy hills. */}
      <AnimatePresence mode="wait">
        <motion.ul
          key={active.label}
          className={`scroll-fade mb-[calc(min(15dvh,120px)-16px)] grid min-h-0 w-full flex-1 auto-rows-max content-center-safe gap-y-8 overflow-y-auto overscroll-contain px-1 pt-7 pb-5`}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {/* Each gift is a capsule pill wrapped like a present. */}
          {active.items.map((item, i) => (
              <motion.li
                key={item}
                className={`gift-box ${WRAPPING[i % WRAPPING.length]}`}
                initial={{ opacity: 0, y: -30, rotate: i % 2 ? 3 : -3 }}
                animate={{ opacity: 1, y: 0, rotate: i % 2 ? 0.8 : -0.8 }}
                transition={{
                  delay: Math.min(i, 5) * 0.09,
                  type: "spring",
                  stiffness: 180,
                  damping: 14,
                }}
              >
                <span className="pill-half" aria-hidden />
                <span className="pill-shine" aria-hidden />
                <SnowCap className="left-[17%] w-[66%]" />
                <Bow className="absolute -top-[23px] left-1/2 z-20 w-[66px] -translate-x-1/2" />
                <span className="gift-tag">
                  {showRx && <RxMark className="gift-rx" />}
                  {item}
                </span>
              </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
