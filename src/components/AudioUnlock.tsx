"use client";

import { useEffect } from "react";
import { playSfx, unlockAudio } from "@/audio/engine";

/**
 * Starts the audio on her first tap and clicks every button. Listens in the
 * capture phase so audio is ready before a button's own handler plays a sound.
 * Buttons with their own sound opt out with data-own-sound.
 */
export function AudioUnlock() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      unlockAudio();
      const control = (e.target as Element).closest?.("a, button");
      if (control && !control.hasAttribute("data-own-sound")) playSfx("tap");
    };
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("touchend", unlockAudio, { capture: true });
    return () => {
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("touchend", unlockAudio, { capture: true });
    };
  }, []);

  return null;
}
