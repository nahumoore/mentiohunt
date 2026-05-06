import { HeroContent } from "./hero-content"

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-background pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-32"
    >
      {/* Warm glow source at top-center */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 flex justify-center">
        <div className="h-[380px] w-[760px] rounded-full bg-[var(--color-princeton-orange)]/9 blur-[110px] dark:bg-[var(--color-princeton-orange)]/12" />
      </div>

      {/* Concentric rings radiating from top-center */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden">
        <svg
          className="w-full max-w-5xl"
          viewBox="0 0 1000 700"
          fill="none"
          aria-hidden="true"
        >
          {[130, 240, 350, 460, 570, 680, 790, 900].map((r, i) => (
            <ellipse
              key={r}
              cx="500"
              cy="0"
              rx={r}
              ry={r * 0.56}
              stroke="var(--princeton-orange)"
              strokeWidth="0.8"
              opacity={Math.max(0.04, 0.12 - i * 0.011)}
            />
          ))}
        </svg>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-background" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <HeroContent />
      </div>
    </section>
  )
}
