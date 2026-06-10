import { platformSurfaces } from "./data"

export function BacklinksFromHeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 px-4 pb-18 pt-14 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/10 blur-[120px]" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[var(--color-amber-glow)]/8 blur-[100px]" />
        <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/8 blur-[100px]" />
      </div>

      <div className="container relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Platform Playbooks
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl lg:text-[4.6rem] lg:leading-[0.9]">
            How to get backlinks from platforms that already have attention.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            A founder-friendly field guide to earning backlinks from Reddit,
            Medium, Quora, news sites, and other surfaces where relevance,
            timing, and useful source material matter more than brute-force
            outreach.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/18 bg-card/75 px-5 py-6 shadow-[0_28px_80px_-52px_rgba(255,133,0,0.42)] backdrop-blur-sm sm:px-8 sm:py-7">
          <p className="text-center font-heading text-xs font-semibold text-muted-foreground uppercase sm:text-sm">
            Platform surfaces founders can realistically target
          </p>
          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="relative mx-auto mt-8 overflow-hidden rounded-[1.65rem] border border-[var(--color-blaze-orange)]/12 bg-gradient-to-br from-background/85 via-card/90 to-[var(--color-amber-flame)]/8 py-4 sm:py-5">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-card via-card/95 to-transparent backdrop-blur-[2px] sm:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-card via-card/95 to-transparent backdrop-blur-[2px] sm:w-28" />
            <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-amber-glow)]/18 blur-2xl" />
            <div className="pointer-events-none absolute right-0 top-1/2 z-10 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--color-blaze-orange)]/16 blur-2xl" />

            <div className="flex w-max animate-[discovery-surfaces-marquee-right_36s_linear_infinite] items-center motion-reduce:animate-none">
              {[0, 1].map((loopIndex) => (
                <div
                  key={loopIndex}
                  aria-hidden={loopIndex === 1}
                  className="flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4 lg:gap-5 lg:pr-5"
                >
                  {platformSurfaces.map(({ name, Icon }) => (
                    <span
                      key={`${loopIndex}-${name}`}
                      aria-label={loopIndex === 0 ? name : undefined}
                      className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-[var(--color-blaze-orange)]/14 bg-background/85 text-[var(--color-princeton-orange)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_16px_36px_-30px_rgba(255,84,0,0.7)] ring-1 ring-foreground/5 sm:size-16"
                      role={loopIndex === 0 ? "img" : undefined}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/65 via-transparent to-[var(--color-amber-flame)]/12" />
                      <Icon className="relative z-10 size-8 opacity-90 drop-shadow-[0_8px_14px_rgba(255,84,0,0.12)] saturate-[1.08] sm:size-9" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
