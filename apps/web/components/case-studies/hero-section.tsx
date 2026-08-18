export function CaseStudiesHeroSection() {
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
            Case Studies
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl lg:text-[4.6rem] lg:leading-[0.9]">
            Real backlink numbers from founders running automated outreach.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            No agency retainers, no black-box reports — just the actual
            queue, the actual reply rate, and the actual links each founder
            earned running Mentiohunt.
          </p>
        </div>
      </div>
    </section>
  )
}
