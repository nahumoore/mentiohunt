"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconLock,
  IconLoader2,
  IconSearch,
  IconSend,
  IconSparkles,
  IconSwords,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type BacklinkGap = {
  id: string
  domain: string
  name: string | null
  da: number | null
  url: string | null
  type: string
  reason: string | null
}

type Competitor = {
  id: string
  domain: string
  name: string
  da: number | null
  totalBacklinks: number
  gapCount: number
  gaps: BacklinkGap[]
}

type Summary = {
  competitorsFound: number
  totalGaps: number
  highPriority: number
}

const loadingStages = [
  "Analyzing your website",
  "Generating likely competitors",
  "Fetching competitor backlinks",
  "Building your gap report",
]

const gapTypeColors: Record<string, string> = {
  "Resource Page":
    "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Blog Mention":
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Link Roundup":
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Niche Blog":
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Community:
    "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "Competitor Blog":
    "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
}

function normalizeDomain(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}

function getFaviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

export function CompetitorBacklinkGap() {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [submittedUrl, setSubmittedUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)

  const websiteDomain = submittedUrl ? normalizeDomain(submittedUrl) : "your site"

  const allGapRows = competitors.flatMap((competitor) =>
    competitor.gaps.map((gap) => ({
      competitorDomain: competitor.domain,
      competitorName: competitor.name,
      ...gap,
    }))
  )

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return

    const timer = window.setTimeout(
      () => setStageIndex((current) => current + 1),
      stageIndex === 0 ? 650 : 1800
    )

    return () => window.clearTimeout(timer)
  }, [phase, stageIndex])

  useEffect(() => {
    if (phase !== "results") return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  async function handleCopyAll() {
    if (allGapRows.length === 0) return

    try {
      const exportText = [
        ["competitor", "source_domain", "title", "type", "dr", "url"].join("\t"),
        ...allGapRows.map((gap) =>
          [
            gap.competitorDomain,
            gap.domain,
            (gap.name ?? "").replace(/\s+/g, " ").trim(),
            gap.type,
            gap.da === null ? "" : String(gap.da),
            gap.url ?? "",
          ].join("\t")
        ),
      ].join("\n")

      await navigator.clipboard.writeText(exportText)
      setCopiedAll(true)
      window.setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUrl = websiteUrl.trim()
    if (!trimmedUrl) return

    setSubmittedUrl(trimmedUrl)
    setStageIndex(0)
    setCopiedAll(false)
    setError(null)
    setPhase("loading")

    const [res] = await Promise.all([
      fetch("/api/free-tool/competitor-backlink-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      }),
      new Promise((resolve) => window.setTimeout(resolve, 3800)),
    ])

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Something went wrong. Please try again.")
      setPhase("idle")
      return
    }

    const data = (await res.json()) as {
      competitors: Competitor[]
      summary: Summary
    }
    setCompetitors(data.competitors)
    setSummary(data.summary)
    setPhase("results")
  }

  const hasResults = phase === "results"

  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,var(--color-amber-glow)_0,transparent_23rem),radial-gradient(circle_at_86%_16%,var(--color-blaze-orange)_0,transparent_21rem)] opacity-[0.12]" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <div className="max-w-3xl">
              <Link
                href="/free-tools"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)] transition-colors hover:bg-[var(--color-blaze-orange)]/12"
              >
                <IconBolt size={13} stroke={2.6} />
                Free backlink tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Competitor Backlink Gap Analysis
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Enter your website URL and see which sites link to likely
                competitors but not to you. Built for founders who want to
                close real gaps, not guess at outreach targets.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["URL in", "Paste your site URL"],
                  ["Find gaps", "AI finds likely competitors"],
                  ["Reach out", "Target missing links"],
                ].map(([label, text]) => (
                  <div
                    key={label}
                    className="rounded-[1.25rem] border border-border bg-card/70 p-4 shadow-sm backdrop-blur"
                  >
                    <p className="font-heading text-lg font-semibold tracking-[-0.035em]">
                      {label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[var(--color-amber-glow)]/16 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 left-10 h-44 w-44 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/25 bg-card p-4 shadow-[0_36px_120px_-56px_rgba(255,96,0,0.75)]">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />

                <div className="rounded-[1.75rem] border border-border/80 bg-background/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                        Run a gap analysis
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Find competitor backlinks
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconSwords size={25} stroke={2.4} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div>
                      <label
                        htmlFor="website-url"
                        className="text-sm font-medium text-foreground"
                      >
                        Your website URL
                      </label>
                      <Input
                        id="website-url"
                        type="url"
                        value={websiteUrl}
                        onChange={(event) => setWebsiteUrl(event.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="mt-1.5 h-11 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                        required
                      />
                    </div>

                    <p className="text-xs leading-5 text-muted-foreground">
                      We&apos;ll read your homepage and generate likely competitors
                      automatically before checking backlink gaps.
                    </p>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={phase === "loading"}
                      className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                    >
                      {phase === "loading" ? "Analyzing" : "Find gaps"}
                      {phase === "loading" ? (
                        <IconLoader2 className="animate-spin" size={16} />
                      ) : (
                        <IconArrowRight size={16} stroke={2.5} />
                      )}
                    </Button>
                  </form>

                  {error ? (
                    <div className="mt-5 flex items-start gap-3 rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-3">
                      <IconAlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-destructive"
                        stroke={2.2}
                      />
                      <p className="text-sm leading-6 text-destructive">
                        {error}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[1.4rem] border border-border bg-card p-4">
                    {phase === "idle" ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconSearch size={20} stroke={2.4} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when your URLs are.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Enter your website to find real backlink gaps.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {phase === "loading" ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                            <IconLoader2
                              className="animate-spin"
                              size={20}
                              stroke={2.4}
                            />
                          </div>
                          <div>
                            <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                              Analyzing {websiteDomain}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {loadingStages[stageIndex]}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 space-y-2">
                          {loadingStages.map((stage, index) => (
                            <div
                              key={stage}
                              className="flex items-center justify-between gap-3 rounded-full bg-muted/60 px-3 py-2 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {stage}
                              </span>
                              {index < stageIndex ? (
                                <IconCheck
                                  size={15}
                                  className="text-[var(--color-princeton-orange)]"
                                  stroke={2.6}
                                />
                              ) : index === stageIndex ? (
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-princeton-orange)]" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-border" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {hasResults ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconCheck size={20} stroke={2.5} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Gap analysis complete for {websiteDomain}.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {summary?.totalGaps ?? 0} backlink gaps found
                            across {summary?.competitorsFound ?? 0} competitors.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={resultsRef}
        className="scroll-mt-24 border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-4">
              {!hasResults ? (
                <div className="rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center shadow-sm">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconTargetArrow size={24} stroke={2.4} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Results will show up here.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Run the analysis above and this section will populate with a
                    table of filtered backlink opportunities.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/22 bg-card shadow-[0_28px_90px_-58px_rgba(255,96,0,0.7)]">
                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-amber-glow)_0,transparent_18rem)] opacity-[0.08]" />

                    <div className="relative border-b border-border/70 px-5 py-5 sm:px-7">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-princeton-orange)]">
                            Live Gap Table
                          </p>
                          <h3 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                            Every high-authority link opportunity in one list.
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                            {summary?.totalGaps ?? 0} opportunities across {summary?.competitorsFound ?? 0} AI-discovered competitors. Export includes competitor, source domain, page title, type, DR, and URL.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-princeton-orange)]">
                            DR 20-65 only
                          </div>
                          <div className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                            {competitors.length} competitors scanned
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative px-5 py-4 sm:px-7">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                          Tab-separated export, ready for Sheets or outreach workflows
                        </p>

                        <button
                          type="button"
                          onClick={handleCopyAll}
                          disabled={allGapRows.length === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/22 bg-[var(--color-blaze-orange)]/8 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-[var(--color-blaze-orange)]/40 hover:bg-[var(--color-blaze-orange)]/14 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copiedAll ? (
                            <>
                              <IconCheck size={15} stroke={2.6} className="text-[var(--color-princeton-orange)]" />
                              Copied full export
                            </>
                          ) : (
                            <>
                              <IconCopy size={15} stroke={2.2} />
                              Copy all rows
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="hidden border-t border-border/70 md:block">
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed border-separate border-spacing-0 text-left">
                          <thead>
                            <tr className="bg-[var(--color-blaze-orange)]/6 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground/75">
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                Competitor
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                Source domain
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                Page
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                Type
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                DR
                              </th>
                              <th className="sticky top-0 z-10 border-b border-border/70 px-6 py-4 font-medium backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-amber-glow)_12%)]">
                                Link
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allGapRows.map((gap, index) => {
                              const typeColor =
                                gapTypeColors[gap.type] ??
                                "border-border bg-background/70 text-muted-foreground"

                              return (
                                <tr
                                  key={`${gap.competitorDomain}-${gap.id}`}
                                  className="group bg-card/90 transition-colors hover:bg-[var(--color-blaze-orange)]/[0.035]"
                                >
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    <div className="flex items-center gap-3">
                                      <span
                                        aria-hidden="true"
                                        className="size-8 rounded-xl border border-border bg-background bg-contain bg-center bg-no-repeat shadow-sm"
                                        style={{
                                          backgroundImage: `url(${getFaviconUrl(gap.competitorDomain)})`,
                                        }}
                                      />
                                      <div className="min-w-0">
                                        <p className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
                                          {gap.competitorName}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                          {gap.competitorDomain}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    <div className="flex items-center gap-3">
                                      <span
                                        aria-hidden="true"
                                        className="size-8 rounded-xl border border-border bg-background bg-contain bg-center bg-no-repeat shadow-sm"
                                        style={{
                                          backgroundImage: `url(${getFaviconUrl(gap.domain)})`,
                                        }}
                                      />
                                      <div>
                                        <p className="font-medium text-foreground">{gap.domain}</p>
                                        <p className="text-xs text-muted-foreground">#{String(index + 1).padStart(2, "0")}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    <div className="space-y-1">
                                      <p className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                                        {gap.name ?? gap.domain}
                                      </p>
                                      {gap.reason ? (
                                        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                          {gap.reason}
                                        </p>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${typeColor}`}>
                                      {gap.type}
                                    </span>
                                  </td>
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    <span className="inline-flex min-w-12 justify-center rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-princeton-orange)]">
                                      {gap.da ?? "-"}
                                    </span>
                                  </td>
                                  <td className="border-b border-border/60 px-6 py-5 align-top">
                                    {gap.url ? (
                                      <Link
                                        href={gap.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35 hover:text-[var(--color-princeton-orange)]"
                                      >
                                        Open
                                        <IconExternalLink size={14} stroke={2.3} />
                                      </Link>
                                    ) : null}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border/70 p-4 md:hidden">
                      {allGapRows.map((gap, index) => {
                        const typeColor =
                          gapTypeColors[gap.type] ??
                          "border-border bg-background/70 text-muted-foreground"

                        return (
                          <article
                            key={`${gap.competitorDomain}-${gap.id}`}
                            className="rounded-[1.6rem] border border-border bg-background/70 p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-princeton-orange)]">
                                  {gap.competitorDomain}
                                </p>
                                <h4 className="mt-2 font-heading text-xl font-semibold tracking-[-0.04em]">
                                  {gap.name ?? gap.domain}
                                </h4>
                                <p className="mt-1 text-sm text-muted-foreground">{gap.domain}</p>
                              </div>
                              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${typeColor}`}>
                                {gap.type}
                              </span>
                              <span className="inline-flex rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-princeton-orange)]">
                                DR {gap.da ?? "-"}
                              </span>
                            </div>

                            {gap.url ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                  href={gap.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35 hover:text-[var(--color-princeton-orange)]"
                                >
                                  Open
                                  <IconExternalLink size={14} stroke={2.3} />
                                </Link>
                              </div>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>

                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                        Unlock the full gap list
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Sign up to track all competitor backlinks and close gaps
                        faster.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Get a recurring backlink gap queue that updates as your
                        competitors earn new links — so you always have a
                        prioritized outreach list.
                      </p>
                      <Button
                        asChild
                        size="lg"
                        className="mt-6 h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                      >
                        <Link href="/signup">
                          Sign up to continue
                          <IconSparkles size={16} stroke={2.4} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/20 bg-card p-7 shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                  More than a one-off check
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Turn gap analysis into a recurring outreach queue.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt tracks your competitors&apos; new backlinks and
                  surfaces fresh gaps as they appear — so you always have a
                  prioritized list of outreach targets.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">
                    Build your queue
                    <IconSend size={16} stroke={2.4} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-7 text-sm hover:bg-[var(--color-blaze-orange)]/8"
                >
                  <Link href="/free-tools">Back to free tools</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
