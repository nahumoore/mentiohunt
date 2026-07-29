import { LANDING_FAQS } from "@/consts/faq"

export function Faq() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
      aria-labelledby="faq-title"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 h-[26rem] w-[26rem] -translate-x-1/3 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[100px]" />
        <div className="absolute top-1/3 right-0 h-[20rem] w-[20rem] translate-x-1/4 rounded-full bg-[var(--color-amber-flame)]/7 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            FAQ
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2
            id="faq-title"
            className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]"
          >
            Common questions
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Everything you need to know before getting started with managed
            backlink placement.
          </p>
        </div>

        <dl className="mx-auto mt-14 max-w-6xl grid gap-px bg-border/70 overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FAQS.map((item, index) => (
            <div
              key={item.question}
              className="group flex flex-col gap-3 bg-background p-7 transition-colors duration-200 hover:bg-blaze-orange/3"
            >
              <span
                aria-hidden="true"
                className="font-heading text-sm font-bold tabular-nums text-blaze-orange/40 transition-colors duration-200 group-hover:text-(--color-blaze-orange)"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <dt className="text-sm font-semibold leading-6 text-foreground sm:text-base">
                {item.question}
              </dt>
              <dd className="text-sm leading-7 text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
