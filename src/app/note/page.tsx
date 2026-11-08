"use client";

import { useRouter } from "next/navigation";
import { Fireplace } from "@/components/Fireplace";
import { useGame } from "@/components/GameProvider";
import { SnowCap } from "@/components/SnowCap";
import { SnowCard } from "@/components/SnowCard";
import { config } from "@/config";

export default function NotePage() {
  const { note } = config;
  const router = useRouter();
  const { startSavedLevel } = useGame();

  return (
    <section className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="w-full shrink-0">
        <SnowCard>
          <div className="animate-bob text-[3rem] leading-tight">🎁</div>
          <h2 className="mt-1 mb-2 font-script text-[2.4rem] leading-tight text-gold">{note.title}</h2>
          <p className="mb-3 leading-normal">
            {note.body.split("**").map((text, i) => (i % 2 ? <b key={i}>{text}</b> : text))}
          </p>
          <p className="mb-[22px] text-[0.92rem] leading-normal text-muted">{note.howToPlay}</p>
          <button
            className="btn relative"
            onClick={() => {
              startSavedLevel();
              router.push("/play");
            }}
          >
            <SnowCap />
            {note.button}
          </button>
        </SnowCard>
      </div>
      <Fireplace className="min-h-0 w-full max-w-[300px] flex-1 [@media(max-height:620px)]:hidden" />
    </section>
  );
}
