"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { config } from "@/config";
import { Holly } from "./Holly";

/** The letter from config.letter, unfolding over the page like Christmas paper. */
export function Letter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { letter } = config;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="letter-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={letter.opening}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.article
            className="letter-paper"
            initial={{ scaleY: 0.05, y: 40, rotate: -2, opacity: 0 }}
            animate={{ scaleY: 1, y: 0, rotate: -0.6, opacity: 1 }}
            exit={{ scaleY: 0.05, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Holly className="absolute -top-5 -left-4 z-10 w-14" />
            <span aria-hidden className="letter-stamp">
              🎄
            </span>
            <div className="letter-scroll">
              <h2 className="letter-opening">{letter.opening}</h2>
              {letter.body.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i} className="letter-body">
                  {paragraph}
                </p>
              ))}
              <p className="letter-signoff">{letter.signOff}</p>
              {letter.ps && <p className="letter-ps">{letter.ps}</p>}
            </div>
            <button className="letter-close" onClick={onClose}>
              <span aria-hidden className="letter-close-seal">
                ❤
              </span>
              {letter.close}
            </button>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
