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
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
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

        <div className="mx-auto mt-14 max-w-5xl rounded-[2rem] border border-[var(--color-blaze-orange)]/18 bg-card/75 px-5 py-6 shadow-[0_28px_80px_-52px_rgba(255,133,0,0.42)] backdrop-blur-sm sm:px-8 sm:py-7">
          <p className="text-center font-heading text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase sm:text-sm">
            Platform surfaces founders can realistically target
          </p>
          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="mt-8 grid grid-cols-3 items-end gap-x-7 gap-y-9 px-2 text-muted-foreground/65 sm:grid-cols-4 sm:gap-x-9 lg:grid-cols-6 lg:gap-x-10 xl:grid-cols-11 xl:gap-x-8">
            {platformSurfaces.map(({ name, Icon, className }) => (
              <span
                key={name}
                aria-label={name}
                className="group inline-flex flex-col items-center justify-end gap-2 transition duration-200 hover:text-[var(--color-princeton-orange)]"
                role="img"
              >
                <Icon className={`${className} opacity-60 grayscale transition duration-200 group-hover:opacity-100`} />
                <span className="font-heading text-[0.62rem] leading-none font-medium tracking-[0.16em] uppercase opacity-70 transition duration-200 group-hover:opacity-100">
                  {name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
