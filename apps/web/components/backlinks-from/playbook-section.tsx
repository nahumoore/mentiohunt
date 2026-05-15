import { playbook } from "./data"

export function BacklinksFromPlaybookSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-24 h-72 w-72 -translate-x-1/3 rounded-full bg-blaze-orange/6 blur-[110px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Operating Playbook
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            A practical sequence for platform-based link building.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            The order matters. Most bad outreach starts because the sender
            skipped the context work and jumped straight to asking for a link.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-2">
          {playbook.map((item) => {
            const Icon = item.Icon

            return (
              <article
                key={item.step}
                className="relative overflow-hidden rounded-[1.8rem] border border-border bg-card p-6 shadow-sm transition-colors hover:border-[var(--color-blaze-orange)]/22 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <Icon size={22} stroke={2.15} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[0.65rem] font-bold tracking-[0.18em] text-[var(--color-princeton-orange)] uppercase">
                      Step {item.step}
                    </p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-balance">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      {item.text}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
