"use client";

import { useEffect, useRef, useState } from "react";
import { config } from "@/config";
import { assetPath } from "@/lib/paths";
import { Boba, GlowBuddy, KimchiRice } from "./Doodles";
import { Holly } from "./Holly";
import { SnowCap } from "./SnowCap";

/** Shows the photo once it loads, and a placeholder if the file doesn't exist. */
export function Photo() {
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // The image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div className="candy-frame shrink-0">
      <SnowCap />
      <Holly className="absolute -right-3 -bottom-3 z-10 w-16" />
      <KimchiRice className="absolute -bottom-3 -left-6 z-10 w-[84px] drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
      <Boba className="absolute top-[18%] -right-6 z-10 w-9 rotate-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
      <GlowBuddy className="absolute -top-[30px] left-[16%] z-20 w-7" />
      <div className="relative aspect-[4/5] w-[min(74vw,290px,calc((100dvh-364px)*0.8))] overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,#3a0b17,#1c060b)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={assetPath(config.photo)}
        alt={config.photoAlt}
        onLoad={() => setLoaded(true)}
        className={`size-full object-cover ${loaded ? "" : "hidden"}`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[0.95rem] font-bold text-muted">
          <div className="text-5xl opacity-80">📷</div>
          <span>{config.landing.photoPlaceholder}</span>
        </div>
      )}
      </div>
    </div>
  );
}
