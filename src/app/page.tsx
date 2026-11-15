import Link from "next/link";
import { LandingSparkles } from "@/components/LandingSparkles";
import { Photo } from "@/components/Photo";
import { SnowCap } from "@/components/SnowCap";
import { config } from "@/config";

/** Twinkling stars around the photo: where (as % of the photo) and how big. */
const TWINKLES = [
  { left: "-7%", top: "12%", size: "1.1rem", delay: "0s" },
  { left: "104%", top: "4%", size: "0.8rem", delay: "0.5s" },
  { left: "-9%", top: "58%", size: "0.75rem", delay: "1.1s" },
  { left: "106%", top: "70%", size: "1.15rem", delay: "0.3s" },
  { left: "30%", top: "-7%", size: "0.7rem", delay: "0.8s" },
  { left: "78%", top: "103%", size: "0.85rem", delay: "1.4s" },
];

export default function LandingPage() {
  const { landing, name } = config;
  return (
    <section className="flex h-full flex-col items-center justify-center gap-[18px] text-center">
      <div id="landing-photo" className="relative shrink-0">
        <div aria-hidden className="photo-aura" />
        <Photo />
        {TWINKLES.map((star) => (
          <span
            key={star.left + star.top}
            aria-hidden
            className="pointer-events-none absolute z-20 -translate-1/2 animate-twinkle text-gold [text-shadow:0_0_8px_rgba(255,214,120,0.9)]"
            style={{ left: star.left, top: star.top, fontSize: star.size, animationDelay: star.delay }}
          >
            ✦
          </span>
        ))}
      </div>
      <LandingSparkles targetId="landing-photo" />
      <h1 className="script-title text-[clamp(2.6rem,11vw,3.4rem)]">
        {landing.greeting}
        <br />
        <span className="shimmer-gold">{name}</span>
      </h1>
      <p className="text-muted">{landing.subtitle}</p>
      <div className="mt-1.5 flex flex-col items-center gap-2.5">
        <p className="font-bold tracking-[0.02em]">{landing.prompt}</p>
        <Link href="/note" className="btn btn-shine relative">
          <SnowCap />
          {landing.button}
        </Link>
      </div>
    </section>
  );
}
