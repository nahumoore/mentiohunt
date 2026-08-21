import type { Edition } from "@/content/link-building-statistics/types"

import { ChartBody } from "./chart-body"
import type { ChartSpec } from "./chart-specs"
import { CHART_SCOPE, ChartTokens } from "./chart-tokens"
import { EditionProvider } from "./edition-context"
import { displayUrlFor, pageUrlFor } from "./links"

/**
 * What renders inside someone else's iframe. Deliberately minimal — no nav, no
 * CTA, no share controls — but the title, the sample size and a live link back to
 * the source page are non-negotiable, since that link is the reason the embed
 * exists.
 */
export function EmbedCard({ edition, spec }: { edition: Edition; spec: ChartSpec }) {
  const pageUrl = pageUrlFor(edition.year)
  const displayUrl = displayUrlFor(edition.year)

  return (
    <EditionProvider edition={edition}>
      <div className={`${CHART_SCOPE} min-h-screen bg-background px-5 py-6`}>
        <ChartTokens />

        <figure className="mx-auto max-w-3xl">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-(--color-princeton-orange)">
            Link building statistics
          </p>
          <h1 className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em] text-balance sm:text-2xl">
            {spec.title}
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {spec.subtitle}
          </p>

          <div className="mt-6">
            <ChartBody chartId={spec.id} />
          </div>

          <figcaption className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-3">
            <p className="text-xs">
              Source:{" "}
              {/* Deliberately `noopener` without `noreferrer`: the referrer is how we
                  see which sites embedded a chart. */}
              {/* eslint-disable-next-line react/jsx-no-target-blank */}
              <a
                href={`${pageUrl}#${spec.id}`}
                target="_blank"
                rel="noopener"
                className="font-semibold text-foreground underline decoration-dotted underline-offset-2"
              >
                {displayUrl}
              </a>
            </p>
            <p className="font-mono text-[0.65rem] text-muted-foreground/70">
              {spec.sourceLine}
            </p>
          </figcaption>
        </figure>
      </div>
    </EditionProvider>
  )
}
