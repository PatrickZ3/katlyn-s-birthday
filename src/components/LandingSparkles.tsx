"use client";

import { useEffect } from "react";
import { fireSparks } from "./Confetti";

/** Gold sparks puff out of the photo's four corners when the page opens. Pass the photo's id. */
export function LandingSparkles({ targetId }: { targetId: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const rect = document.getElementById(targetId)?.getBoundingClientRect();
      if (!rect) return;
      for (const x of [rect.left, rect.right]) {
        for (const y of [rect.top, rect.bottom]) fireSparks({ x, y }, 18, 1.2);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [targetId]);

  return null;
}
