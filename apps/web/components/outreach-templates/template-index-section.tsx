import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import type { OutreachTemplateDefinition } from "./data"

function formatDate(date?: string): string {
  if (!date) return ""

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

export function OutreachTemplatesIndexSection({
  templates,
  query,
}: {
  templates: OutreachTemplateDefinition[]
  query: string
}) {
  return (
    <section className="relative overflow-hidden bg-background pb-20 sm:pb-24 lg:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 border-b border-border pb-5">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Newest first
          </h2>
          <span className="text-sm text-muted-foreground">
            Updated weekly · sorted by date added
          </span>
        </div>

        {templates.length > 0 ? (
          <div className="mx-auto mt-7 grid max-w-6xl gap-5 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
            {templates.map((template) => (
              <Link
                key={template.slug}
                href={`/outreach-templates/${template.slug}`}
                className="group flex flex-col gap-3.5 rounded-[1.25rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/28 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-blaze-orange)]/8 px-2.75 py-1 text-xs font-semibold text-[var(--color-princeton-orange)]">
                    Outreach Template
                  </span>
                  {template.date && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(template.date)}
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-lg leading-snug font-semibold tracking-[-0.02em] text-balance text-foreground">
                  {template.title}
                </h3>
                <p className="flex-1 text-sm leading-6 text-muted-foreground">
                  {template.description}
                </p>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
                  <span className="text-xs text-muted-foreground">
                    {template.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-princeton-orange)] transition-all duration-200 group-hover:gap-2">
                    Read template
                    <IconArrowRight size={15} stroke={2.4} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-14 text-center text-base text-muted-foreground">
            No template matches “{query}”. Try “guest post” or “broken link”.
          </p>
        )}
      </div>
    </section>
  )
}
