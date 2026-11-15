import type { Metadata, Viewport } from "next";
import { Great_Vibes, Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { AudioUnlock } from "@/components/AudioUnlock";
import { FairyLights } from "@/components/FairyLights";
import { GameProvider } from "@/components/GameProvider";
import { Menu } from "@/components/Menu";
import { MotionProvider } from "@/components/MotionProvider";
import { Santa } from "@/components/Santa";
import { Sparkles } from "@/components/Sparkles";
import { WinterScene } from "@/components/WinterScene";
import { config } from "@/config";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nunito",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: config.pageTitle,
  // If she taps Share > Add to Home Screen, it opens full screen like an app.
  appleWebApp: { capable: true, title: config.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#12060a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${greatVibes.variable}`}>
      <body>
        <MotionProvider>
          <GameProvider>
            <AudioUnlock />
            <WinterScene />
            <Santa />
            <Sparkles />
            <FairyLights />
            <Menu />
            {/* Clips big background effects so the page can never scroll or wobble. */}
            <div className="fixed inset-0 z-2 overflow-hidden">
              <main className="relative mx-auto h-dvh max-w-[480px] px-4 pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]">
                {children}
              </main>
            </div>
          </GameProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
