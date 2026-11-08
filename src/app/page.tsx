import Link from "next/link";
import { Photo } from "@/components/Photo";
import { SnowCap } from "@/components/SnowCap";
import { config } from "@/config";

export default function LandingPage() {
  const { landing, name } = config;
  return (
    <section className="flex h-full flex-col items-center justify-center gap-[18px] text-center">
      <Photo />
      <h1 className="script-title text-[clamp(2.6rem,11vw,3.4rem)]">
        {landing.greeting}
        <br />
        <span className="text-gold">{name}</span>
      </h1>
      <p className="text-muted">{landing.subtitle}</p>
      <div className="mt-1.5 flex flex-col items-center gap-2.5">
        <p className="font-bold tracking-[0.02em]">{landing.prompt}</p>
        <Link href="/note" className="btn relative">
          <SnowCap />
          {landing.button}
        </Link>
      </div>
    </section>
  );
}
