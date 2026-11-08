"use client";

import { motion } from "framer-motion";
import { Holly } from "@/components/Holly";
import { SnowCap } from "@/components/SnowCap";
import { STICKERS } from "@/components/stickers";
import { config } from "@/config";

/**
 * To change what's on this page, edit `cuteStuff` in src/config.ts.
 * The instructions and maximums are written above it.
 */
export default function CutePage() {
  const { title, sections } = config.cuteStuff;

  return (
    <section className="flex h-full w-full flex-col items-center">
      <h1 className="script-title shrink-0 text-[2.8rem] text-gold">{title}</h1>
      <div className="scroll-fade min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-1 pt-4 pb-10">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="mb-3 text-center text-[0.8rem] font-extrabold tracking-[0.18em] text-gold uppercase">
              {section.title}
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              {section.stickers.map(({ sticker, name, note, featured }, i) => {
                const Sticker = STICKERS[sticker];
                return (
                  <motion.li
                    key={`${sticker}-${name}`}
                    data-featured={featured ? "" : undefined}
                    className={`group sticker-card ${featured ? "col-span-2 border-solid border-gold" : ""}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 6) * 0.06, duration: 0.35 }}
                    whileTap={{ scale: 0.95, rotate: i % 2 ? 2 : -2 }}
                  >
                    {featured && <SnowCap />}
                    {featured && <Holly className="absolute -top-3 -left-2 z-10 w-12" />}
                    <div
                      className={`flex w-full items-center justify-center ${featured ? "h-[130px]" : "h-[78px]"}`}
                    >
                      <Sticker className="max-h-full max-w-[80%]" />
                    </div>
                    <p className={`font-extrabold text-cream ${featured ? "text-[1.15rem]" : "text-[0.95rem]"}`}>
                      {name}
                    </p>
                    <p className="text-[0.76rem] leading-tight font-bold text-muted">{note}</p>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
