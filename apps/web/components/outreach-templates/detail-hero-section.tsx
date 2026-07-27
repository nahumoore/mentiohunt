import {
  IconArrowLeft,
  IconBrandX,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import type { OutreachTemplateDefinition } from "./data"
import { getOutreachTemplateIcon } from "./icon-map"

function formatDate(date: string): string {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

export function OutreachTemplateDetailHeroSection({
  template,
}: {
  template: OutreachTemplateDefinition
}) {
  const Icon = getOutreachTemplateIcon(template.slug)

  return (
    <section className="relative overflow-hidden border-b border-border/60 pt-12 pb-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-24 right-8 h-96 w-96 rounded-full bg-[var(--color-princeton-orange)]/9 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-[var(--color-amber-glow)]/7 blur-3xl" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/outreach-templates"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft size={14} stroke={2} />
          Back to outreach templates
        </Link>

        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-princeton-orange)] uppercase">
              <Icon className="h-4 w-4" />
              Outreach Template
            </div>

            <h1 className="mt-5 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[3.45rem]">
              {template.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {template.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={14} stroke={2} />
                {template.readTime}
              </span>
              {template.date && (
                <span className="inline-flex items-center gap-1.5">
                  <IconCalendar size={14} stroke={2} />
                  {template.dateModified
                    ? `Updated ${formatDate(template.dateModified)}`
                    : formatDate(template.date)}
                </span>
              )}
              <a
                href="https://x.com/nicolasmore_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <IconBrandX size={14} stroke={2} />
                Nicolas More
              </a>
            </div>
          </div>

          {template.image && (
            <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-border bg-muted shadow-[0_28px_90px_-48px_rgba(255,133,0,0.58)]">
              <Image
                src={template.image}
                alt={template.imageAlt ?? template.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
