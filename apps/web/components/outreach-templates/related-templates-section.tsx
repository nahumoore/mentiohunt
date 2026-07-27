import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import type { OutreachTemplateDefinition } from "./data"
import { getOutreachTemplateIcon } from "./icon-map"

export function OutreachTemplateRelatedSection({
  templates,
}: {
  templates: OutreachTemplateDefinition[]
}) {
  if (templates.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 bottom-0 h-80 w-80 translate-x-1/4 rounded-full bg-princeton-orange/7 blur-[110px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Other Angles
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Not quite the right fit? Try another angle.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
          {templates.map((template) => {
            const Icon = getOutreachTemplateIcon(template.slug)

            return (
              <Link
                key={template.slug}
                href={`/outreach-templates/${template.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/28"
              >
                <div className="flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.68rem] font-bold text-[var(--color-princeton-orange)] uppercase w-fit">
                  <Icon className="h-4 w-4" />
                  Outreach Template
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-[-0.03em] text-foreground transition-colors group-hover:text-[var(--color-princeton-orange)]">
                  {template.title}
                </h3>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-1.5">
                  View example
                  <IconArrowRight size={13} stroke={2.4} />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
