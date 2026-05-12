import Image from "next/image"

import heroImage from "@/public/landing/mentiohunt-hero.webp"

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/7 blur-3xl dark:bg-[var(--color-princeton-orange)]/10" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-card/95 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:bg-card">
        <Image
          src={heroImage}
          alt="Mentiohunt command center showing mention discovery, fit scoring, outreach drafts, and backlink opportunities."
          priority
          placeholder="blur"
          sizes="(min-width: 1280px) 1152px, (min-width: 1024px) 90vw, 100vw"
          className="h-auto w-full"
        />
      </div>
    </div>
  )
}
