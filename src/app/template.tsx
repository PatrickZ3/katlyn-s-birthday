"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fades each page in. Next.js remounts a template on every navigation. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex h-full flex-col items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
