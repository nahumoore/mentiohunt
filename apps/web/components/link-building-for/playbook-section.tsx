import { playbook } from "./data"

export function LinkBuildingForPlaybookSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-24 h-72 w-72 -translate-x-1/3 rounded-full bg-blaze-orange/6 blur-[110px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Operating Playbook
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            The same sequence, applied to your industry.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Every industry guide below follows this order. Skipping a step is
            usually why an outreach campaign underperforms.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-2">
          {playbook.map((item) => (
            <article
              key={item.step}
              className="relative overflow-hidden rounded-[1.8rem] border border-border bg-card p-6 shadow-sm transition-colors hover:border-[var(--color-blaze-orange)]/22 sm:p-7"
            >
              <p className="text-[0.65rem] font-bold text-[var(--color-princeton-orange)] uppercase">
                Step {item.step}
              </p>
              <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-balance">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
