import { IconCheck, IconMinus, IconX } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import { PreviewProof } from "@/components/onboarding/preview-proof"
import { StartOutreachButton } from "@/components/onboarding/start-outreach-button"
import { opportunityText, tierLabel } from "@/lib/onboarding/opportunity-copy"

import type { PreviewResultsProps } from "./types"

/**
 * The finished state of /onboarding/preview: the paywall where a user first
 * sees what discovery found.
 *
 * The objection at this point is never "are these good links" alone — it is
 * "is this worth paying for versus the two options I already know about."
 * pain-points.md documents both: DIY costs 5–15 hrs/week, agencies start at
 * $1,000/mo, and nothing managed exists in between. Naming that gap out loud
 * carries the page better than another feature list.
 *
 * Only rendered when there is at least one prospect — the empty and failed
 * states stay on the page itself.
 */

/** Ranges are the documented market spread in docs/mentiohunt/pain-points.md. */
const COMPARISON = [
  {
    option: "Do it yourself",
    cost: "$0–100/mo",
    time: "5–15 hrs a week",
    rows: [
      { label: "Finds the opportunities", state: "you" },
      { label: "Writes and sends every email", state: "you" },
      { label: "Chases the follow-ups", state: "you" },
      { label: "Keeps your domain clean", state: "no" },
    ],
  },
  {
    option: "Hire an agency",
    cost: "$1,000–5,000/mo",
    time: "Monthly check-ins",
    rows: [
      { label: "Finds the opportunities", state: "yes" },
      { label: "Writes and sends every email", state: "yes" },
      { label: "Chases the follow-ups", state: "yes" },
      { label: "Shows you the list before it sends", state: "no" },
    ],
  },
]

function StateIcon({ state }: { state: string }) {
  if (state === "yes")
    return <IconCheck size={14} className="shrink-0 text-primary" />
  if (state === "no")
    return <IconX size={14} className="shrink-0 text-muted-foreground/60" />
  return <IconMinus size={14} className="shrink-0 text-muted-foreground/60" />
}

export function PreviewResults({
  productName,
  siteHost,
  prospects,
  trialEndsOn,
  planPrice,
  trialDays,
  productId,
}: PreviewResultsProps) {
  return (
    <main className="min-h-screen bg-background px-5 pt-10 pb-32 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-ui text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">
          {prospects.length} opportunities found · free preview
        </p>

        <h1 className="font-heading mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-[3.25rem] sm:leading-[1.04]">
          Working these yourself is five hours a week.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Every site below already links to a competitor of {productName} or
          covers exactly what {siteHost} does. Finding them was the easy half.
          The half that kills link building is writing {prospects.length}{" "}
          personalised emails and then chasing every one of them for three
          weeks.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
            <p className="font-ui text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              Your queue
            </p>
            <p className="font-ui text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              Nothing sent yet
            </p>
          </div>

          <ul className="divide-y divide-border">
            {prospects.map((prospect) => {
              const copy = opportunityText(prospect.tier)
              return (
                <li
                  key={prospect.id}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] sm:items-center sm:gap-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
                      {/* Google's favicon service isn't in next.config remotePatterns. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${prospect.domain ?? siteHost}&sz=64`}
                        alt=""
                        className="h-[17px] w-[17px]"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {prospect.domain ?? "Relevant site"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tierLabel(prospect.tier)}
                      </p>
                    </div>
                  </div>

                  <p className="text-[13px] leading-5 text-muted-foreground">
                    {copy.reason}
                  </p>

                  <div className="flex shrink-0 items-center gap-1.5 text-xs">
                    {prospect.domain_rating !== null && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                        DR {prospect.domain_rating}
                      </span>
                    )}
                    {prospect.site_relevance_score !== null && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 font-semibold",
                          prospect.site_relevance_score >= 4
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        Fit {prospect.site_relevance_score}/5
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* The actual argument. */}
        <h2 className="font-heading mt-14 max-w-[26ch] text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          There are three ways to turn this list into links.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Two of them are why most founders quit link building in the first
          year.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {COMPARISON.map((column) => (
            <div
              key={column.option}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="font-ui text-sm font-semibold">{column.option}</p>
              <p className="font-heading mt-3 text-2xl font-semibold tracking-tight">
                {column.cost}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {column.time}
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                {column.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex gap-2 text-[13px] leading-5 text-muted-foreground"
                  >
                    <span className="mt-0.5">
                      <StateIcon state={row.state} />
                    </span>
                    {row.label}
                    {row.state === "you" && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-foreground">
                        You
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-[0_10px_40px_-16px_rgba(255,84,0,0.45)]">
            <span className="font-ui absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-white uppercase">
              This page
            </span>
            <p className="font-ui text-sm font-semibold">Mentiohunt</p>
            <p className="font-heading mt-3 text-2xl font-semibold tracking-tight">
              ${planPrice}/mo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Free for {trialDays} days
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
              {[
                "Finds the opportunities",
                "Writes and sends every email",
                "Chases the follow-ups",
                "Shows you the list before it sends",
              ].map((label) => (
                <li
                  key={label}
                  className="flex gap-2 text-[13px] leading-5 text-foreground"
                >
                  <IconCheck size={14} className="mt-0.5 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
          One more difference worth naming: agencies resell the same domain
          list to every client. Yours was generated from {siteHost} and the
          competitors you entered, so nobody else is getting pitched the same
          sites in your name.
        </p>

        <PreviewProof />
      </div>

      {/* Long page, so the ask travels with the reader. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Hand {prospects.length} opportunities to Mentiohunt
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              $0 today · ${planPrice}/mo after {trialEndsOn} · cancel from
              Billing any time
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <StartOutreachButton
              productId={productId}
              label={`Start free for ${trialDays} days`}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
