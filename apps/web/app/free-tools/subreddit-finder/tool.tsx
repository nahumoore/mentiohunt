"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconLoader2,
  IconLock,
  IconSend,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type Subreddit = {
  id: string
  name: string
  title: string
  members: number
  activityLevel: string
  score: number
  category: string
  reason: string
  url: string
}

type Summary = {
  found: number
  scored: number
  highFit: number
}

const loadingStages = [
  "Reading your website content",
  "Identifying your niche and audience",
  "Scanning Reddit communities",
  "Scoring community fit and engagement signals",
]

const proofPoints = [
  "Surfaces niche-relevant subreddits — not just the biggest ones.",
  "Each result includes a plain-language fit rationale.",
  "Ranked by audience overlap, not just subscriber count.",
]

const categoryColors: Record<string, string> = {
  "Founder Community":
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Industry Specific":
    "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Tool Discussion":
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Audience Community":
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

const activityColors: Record<string, string> = {
  "Very Active":
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Active:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Moderate:
    "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

function normalizeDomain(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}

function formatMembers(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`
  return String(count)
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : score >= 50
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase ${color}`}
    >
      {score} fit
    </span>
  )
}

export function SubredditFinder() {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [submittedUrl, setSubmittedUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [subreddits, setSubreddits] = useState<Subreddit[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const websiteDomain = submittedUrl ? normalizeDomain(submittedUrl) : "your site"

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return

    const timer = window.setTimeout(
      () => setStageIndex((current) => current + 1),
      stageIndex === 0 ? 650 : 850
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUrl = websiteUrl.trim()
    if (!trimmedUrl) return

    setSubmittedUrl(trimmedUrl)
    setStageIndex(0)
    setError(null)
    setPhase("loading")

    const [res] = await Promise.all([
      fetch("/api/free-tool/subreddit-finder", {
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
      subreddits: Subreddit[]
      summary: Summary
    }
    setSubreddits(data.subreddits)
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
                Free community tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Subreddit Finder
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Enter your website URL and discover the Reddit communities where
                your product fits best. Get a ranked list with fit rationale so
                you know exactly where to show up.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["URL in", "Paste your website"],
                  ["Scan", "Find relevant subreddits"],
                  ["Engage", "Reply where it fits"],
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
                        Run a scan
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Find your subreddits
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconBrandRedditNew className="size-6" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                    <label
                      htmlFor="website-url"
                      className="text-sm font-medium text-foreground"
                    >
                      Website URL
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        id="website-url"
                        type="url"
                        value={websiteUrl}
                        onChange={(event) => setWebsiteUrl(event.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                        required
                      />
                      <Button
                        type="submit"
                        size="lg"
                        disabled={phase === "loading"}
                        className="h-12 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                      >
                        {phase === "loading" ? "Scanning" : "Find subreddits"}
                        {phase === "loading" ? (
                          <IconLoader2 className="animate-spin" size={16} />
                        ) : (
                          <IconArrowRight size={16} stroke={2.5} />
                        )}
                      </Button>
                    </div>
                  </form>

                  {error ? (
                    <div className="mt-5 flex items-start gap-3 rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-3">
                      <IconAlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-destructive"
                        stroke={2.2}
                      />
                      <p className="text-sm leading-6 text-destructive">{error}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[1.4rem] border border-border bg-card p-4">
                    {phase === "idle" ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconBrandRedditNew className="size-5" />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when your URL is.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Enter your website URL to discover the best
                            subreddits for your product.
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
                              Scanning {websiteDomain}
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
                            Scan complete for {websiteDomain}.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {subreddits.length}{" "}
                            {subreddits.length === 1
                              ? "subreddit"
                              : "subreddits"}{" "}
                            ready below.
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
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                Results
              </p>
              <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                Communities worth showing up in.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                The scanner returns a ranked list of subreddits matched to your
                product — each one paired with a fit rationale so you know what
                threads to watch and how to contribute.
              </p>

              <div className="mt-7 space-y-3">
                {proofPoints.map((point) => (
                  <div key={point} className="flex gap-3 text-sm leading-6">
                    <IconCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--color-princeton-orange)]"
                      stroke={2.5}
                    />
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {!hasResults ? (
                <div className="rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconBrandRedditNew className="size-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Results appear after the scan.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Enter your website URL above to find the most relevant
                    subreddits for your product.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      [summary?.found ?? 0, "subreddits found"],
                      [summary?.scored ?? 0, "communities scored"],
                      [summary?.highFit ?? 0, "high fit"],
                    ].map(([value, label]) => (
                      <div
                        key={String(label)}
                        className="rounded-[1.45rem] border border-[var(--color-blaze-orange)]/20 bg-card p-5 shadow-sm"
                      >
                        <p className="font-heading text-3xl font-semibold tracking-[-0.05em] text-[var(--color-princeton-orange)]">
                          {value}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase text-muted-foreground/60">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {subreddits.length === 0 ? (
                    <div className="rounded-[2rem] border border-border bg-card/70 p-8 text-center">
                      <h3 className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                        No subreddits surfaced yet.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        We couldn&apos;t identify strong community matches from
                        this scan. Sign up to unlock deeper discovery with
                        keyword targeting and competitor analysis.
                      </p>
                    </div>
                  ) : (
                    subreddits.map((subreddit, index) => {
                      const categoryColor =
                        categoryColors[subreddit.category] ??
                        "border-border bg-background/70 text-muted-foreground"
                      const activityColor =
                        activityColors[subreddit.activityLevel] ??
                        "border-border bg-background/70 text-muted-foreground"

                      return (
                        <article
                          key={subreddit.id}
                          className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_22px_70px_-54px_rgba(255,96,0,0.65)] sm:p-6"
                        >
                          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

                          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-princeton-orange)]">
                                <IconBrandRedditNew className="size-6" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                                    {subreddit.name}
                                  </h3>
                                  <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <ScoreBadge score={subreddit.score} />
                                </div>
                                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <IconUsers size={13} stroke={2.2} />
                                  <span>{formatMembers(subreddit.members)} members</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryColor}`}
                              >
                                {subreddit.category}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityColor}`}
                              >
                                {subreddit.activityLevel}
                              </span>
                            </div>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {subreddit.reason}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                            <p className="truncate text-sm text-muted-foreground">
                              {subreddit.url}
                            </p>
                            <Link
                              href={subreddit.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 self-start rounded-full text-sm font-semibold text-foreground outline-none transition-colors hover:text-[var(--color-princeton-orange)] focus-visible:ring-3 focus-visible:ring-ring/30 sm:self-auto"
                            >
                              View subreddit
                              <IconBrandRedditNew className="size-4" />
                            </Link>
                          </div>
                        </article>
                      )
                    })
                  )}

                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                        Unlock continuous monitoring
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Get alerted when relevant threads go live — before the
                        window closes.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Mentiohunt watches your matched subreddits for posts
                        that fit your product and surfaces them with a suggested
                        reply — while the thread is still active.
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
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/20 bg-card p-7 shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                  More than one scan
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Turn community discovery into a recurring reply queue.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt monitors your matched subreddits continuously —
                  surfacing threads where your product is a natural fit and
                  drafting a suggested reply so you can engage while it matters.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">
                    Start monitoring
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
