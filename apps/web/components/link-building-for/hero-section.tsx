import { getNicheCardIcon } from "./data"

const featuredNiches = ["Lawyers", "SaaS", "Real Estate", "Startups", "Ecommerce"]

export function LinkBuildingForHeroSection() {
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
            Industry Playbooks
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl lg:text-[4.6rem] lg:leading-[0.9]">
            Link building playbooks built for how your industry actually links.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Generic outreach templates ignore how your niche actually publishes
            and cites sources. These guides break down the sites, tactics, and
            angles that work for founders in specific industries.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/18 bg-card/75 px-5 py-6 shadow-[0_28px_80px_-52px_rgba(255,133,0,0.42)] backdrop-blur-sm sm:px-8 sm:py-7">
          <p className="text-center font-heading text-xs font-semibold text-muted-foreground uppercase sm:text-sm">
            Industries covered so far
          </p>
          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {featuredNiches.map((niche) => {
              const Icon = getNicheCardIcon(niche.toLowerCase().replace(/\s+/g, "-"))

              return (
                <span
                  key={niche}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/14 bg-background/85 px-4 py-2 text-sm font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
                >
                  <Icon
                    size={16}
                    stroke={2}
                    className="text-[var(--color-princeton-orange)]"
                  />
                  {niche}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
