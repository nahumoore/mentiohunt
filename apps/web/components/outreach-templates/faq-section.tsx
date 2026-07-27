import type { OutreachTemplateDefinition } from "./data"

export function OutreachTemplateFaqSection({
  template,
}: {
  template: OutreachTemplateDefinition
}) {
  if (template.faqs.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            FAQ
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Common questions about this template.
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-5">
          {template.faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-heading text-base font-semibold tracking-tight">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
