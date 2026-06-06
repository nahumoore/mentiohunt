import { HeroContent } from "./hero-content"
import { HeroTicker } from "./hero-ticker"

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/8 blur-[150px]" />
        <div className="absolute right-0 top-1/3 h-[280px] w-[280px] rounded-full bg-[var(--color-amber-flame)]/5 blur-[90px]" />
        <div className="absolute left-0 top-2/3 h-[240px] w-[240px] rounded-full bg-[var(--color-blaze-orange)]/5 blur-[90px]" />
      </div>

      {/* Vertically centered copy block */}
      <div className="relative flex min-h-screen items-center">
        <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
          <HeroContent />
        </div>
      </div>

      {/* Opportunity ticker */}
      <HeroTicker />
    </section>
  )
}
