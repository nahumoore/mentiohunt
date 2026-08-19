import type { ReactNode } from "react"

import { CopyStatButton } from "./copy-stat-button"

export function StatSection({
  id,
  eyebrow,
  title,
  description,
  copyStat,
  minSampleNote,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  copyStat: string
  minSampleNote?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-border/70 px-4 py-14 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-(--color-princeton-orange)">
              {eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
          <CopyStatButton stat={copyStat} />
        </div>

        <div className="mt-7">{children}</div>

        {minSampleNote ? (
          <p className="mt-4 text-xs leading-6 text-muted-foreground/70">
            {minSampleNote}
          </p>
        ) : null}
      </div>
    </section>
  )
}
