"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconLayoutList,
  IconLoader2,
  IconLock,
  IconSearch,
  IconSend,
  IconSitemap,
  IconSparkles,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"

type KeywordOpportunity = {
  keyword: string
  volume: number
  difficulty: number
  position: number | null
  opportunity: "high" | "medium" | "low"
}

type SitemapPage = {
  id: string
  url: string
  title: string
  indexed: boolean
  keywords: KeywordOpportunity[]
}

type Summary = {
  total: number
  indexed: number
  notIndexed: number
  totalKeywords: number
  highOpportunities: number
}

const loadingStages = [
  "Fetching and parsing sitemap XML",
  "Checking Google index status for pages",
  "Analyzing keyword opportunities per page",
  "Scoring opportunities by search intent",
]

const proofPoints = [
  "Index status check reveals which pages Google hasn't discovered yet.",
  "Keyword gaps show where you rank on page 2+ and can push to page 1.",
  "Each opportunity comes with volume, difficulty, and current position.",
]

function normalizeDomain(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const color =
    difficulty <= 30
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : difficulty <= 55
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${color}`}>
      KD {difficulty}
    </span>
  )
}

function OpportunityBadge({ opportunity }: { opportunity: "high" | "medium" | "low" }) {
  const styles = {
    high: "border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]",
    medium: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    low: "border-border bg-background/70 text-muted-foreground",
  }

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${styles[opportunity]}`}>
      {opportunity} opp
    </span>
  )
}

function PageCard({ page, index }: { page: SitemapPage; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const highCount = page.keywords.filter((k) => k.opportunity === "high").length

  return (
    <article
      className={`group overflow-hidden rounded-[1.75rem] border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${
        page.indexed
          ? "border-border hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_22px_70px_-54px_rgba(255,96,0,0.65)]"
          : "border-rose-500/20 hover:border-rose-500/35"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
      >
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-[1rem] border ${
            page.indexed
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {page.indexed ? (
            <IconCircleCheck size={18} stroke={2.2} />
          ) : (
            <IconCircleX size={18} stroke={2.2} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-base font-semibold tracking-[-0.03em] truncate max-w-[220px] sm:max-w-none">
              {page.title}
            </span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase ${
                page.indexed
                  ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/8 text-rose-700 dark:text-rose-300"
              }`}
            >
              {page.indexed ? "Indexed" : "Not indexed"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.url}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {highCount > 0 ? (
            <span className="hidden rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-2.5 py-1 text-[0.62rem] font-semibold text-[var(--color-princeton-orange)] sm:inline-block">
              {highCount} high
            </span>
          ) : null}
          <div className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors group-hover:bg-muted">
            {expanded ? (
              <IconChevronUp size={14} stroke={2.2} />
            ) : (
              <IconChevronDown size={14} stroke={2.2} />
            )}
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border/60 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          {!page.indexed ? (
            <div className="mb-4 flex items-start gap-3 rounded-[1rem] border border-rose-500/25 bg-rose-500/8 px-4 py-3">
              <IconAlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" stroke={2.2} />
              <p className="text-sm leading-6 text-muted-foreground">
                This page is not indexed by Google. Submit it via Google Search Console and check for
                crawl errors or noindex directives.
              </p>
            </div>
          ) : null}

          {page.keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keyword opportunities detected for this page.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                Keyword opportunities — {page.keywords.length} found
              </p>
              {page.keywords.map((kw) => (
                <div
                  key={kw.keyword}
                  className="flex flex-col gap-3 rounded-[1.1rem] border border-border/70 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold tracking-[-0.025em]">
                      {kw.keyword}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{kw.volume.toLocaleString()} / mo</span>
                      <span className="text-border">·</span>
                      {kw.position !== null ? (
                        <span>Currently #{kw.position}</span>
                      ) : (
                        <span>Not yet ranking</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DifficultyBadge difficulty={kw.difficulty} />
                    <OpportunityBadge opportunity={kw.opportunity} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}

type InputMode = "sitemap" | "urls"

export function GoogleIndexChecker() {
  const [inputMode, setInputMode] = useState<InputMode>("sitemap")
  const [sitemapUrl, setSitemapUrl] = useState("")
  const [urlsInput, setUrlsInput] = useState("")
  const [submittedUrl, setSubmittedUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [pages, setPages] = useState<SitemapPage[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const activeInput = inputMode === "sitemap" ? sitemapUrl : urlsInput
  const domain = submittedUrl
    ? normalizeDomain(submittedUrl.split("\n")[0] ?? submittedUrl)
    : "your pages"

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return

    const timer = window.setTimeout(
      () => setStageIndex((current) => current + 1),
      stageIndex === 0 ? 700 : 900
    )

    return () => window.clearTimeout(timer)
  }, [phase, stageIndex])

  useEffect(() => {
    if (phase !== "results") return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
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

    const trimmed = activeInput.trim()
    if (!trimmed) return

    setSubmittedUrl(trimmed)
    setStageIndex(0)
    setError(null)
    setPhase("loading")

    const [res] = await Promise.all([
      fetch("/api/free-tool/google-index-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      }),
      new Promise((resolve) => window.setTimeout(resolve, 4000)),
    ])

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Something went wrong. Please try again.")
      setPhase("idle")
      return
    }

    const data = (await res.json()) as { pages: SitemapPage[]; summary: Summary }
    setPages(data.pages)
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
                Free SEO tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Google Index Checker
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Paste your sitemap URL and instantly see which pages Google has indexed,
                which aren&apos;t discovered yet, and where keyword opportunities exist —
                free, no login required.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Paste sitemap", "Drop your sitemap.xml URL"],
                  ["Check index", "See which pages Google found"],
                  ["Find gaps", "Keyword opportunities per page"],
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
                        Run a check
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Check Google index
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconSitemap size={22} stroke={2.2} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <Tabs
                      value={inputMode}
                      onValueChange={(v) => {
                        setInputMode(v as InputMode)
                        setError(null)
                      }}
                    >
                      <TabsList variant="line" className="mb-4 w-full">
                        <TabsTrigger value="sitemap" className="gap-1.5">
                          <IconSitemap size={14} stroke={2.2} />
                          Sitemap
                        </TabsTrigger>
                        <TabsTrigger value="urls" className="gap-1.5">
                          <IconLayoutList size={14} stroke={2.2} />
                          Page URLs
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="sitemap" className="space-y-1.5">
                        <label
                          htmlFor="sitemap-url"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Sitemap URL
                        </label>
                        <Input
                          id="sitemap-url"
                          type="url"
                          value={sitemapUrl}
                          onChange={(e) => setSitemapUrl(e.target.value)}
                          placeholder="https://yoursite.com/sitemap.xml"
                          className="h-11 rounded-xl border-border bg-card px-4 text-sm shadow-sm"
                          required={inputMode === "sitemap"}
                          disabled={phase === "loading"}
                        />
                        <p className="text-[0.68rem] text-muted-foreground/60">
                          Usually at <span className="font-mono text-foreground/50">/sitemap.xml</span> — supports sitemap index files too.
                        </p>
                      </TabsContent>

                      <TabsContent value="urls" className="space-y-1.5">
                        <label
                          htmlFor="page-urls"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Page URLs <span className="text-muted-foreground/50">(one per line, up to 20)</span>
                        </label>
                        <Textarea
                          id="page-urls"
                          value={urlsInput}
                          onChange={(e) => setUrlsInput(e.target.value)}
                          placeholder={"https://yoursite.com/\nhttps://yoursite.com/blog/post-1\nhttps://yoursite.com/pricing"}
                          className="min-h-[96px] resize-none rounded-xl border-border bg-card px-4 py-3 font-mono text-xs shadow-sm leading-6"
                          required={inputMode === "urls"}
                          disabled={phase === "loading"}
                        />
                      </TabsContent>
                    </Tabs>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={phase === "loading" || !activeInput.trim()}
                      className="h-11 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                    >
                      {phase === "loading" ? "Checking…" : "Check index"}
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
                      <p className="text-sm leading-6 text-destructive">{error}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[1.4rem] border border-border bg-card p-4">
                    {phase === "idle" ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconSearch size={20} stroke={2.2} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when your sitemap is.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Usually at{" "}
                            <span className="font-mono text-[0.75rem] text-foreground/70">/sitemap.xml</span>
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
                              Scanning {domain}
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
                            Scan complete.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {summary?.total} pages checked — results below.
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
                Index status and keyword gaps.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                See exactly which pages Google has indexed and where search volume is
                waiting — filtered to the opportunities worth acting on first.
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
                    <IconTrendingUp size={22} stroke={2.2} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Results appear after the check.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Paste your sitemap URL above and hit Check sitemap to get started.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {([
                      {
                        value: summary?.total ?? 0,
                        label: "Pages found",
                        icon: IconSitemap,
                        accent: "border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-princeton-orange)]",
                      },
                      {
                        value: summary?.indexed ?? 0,
                        label: "Indexed",
                        icon: IconCircleCheck,
                        accent: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      },
                      {
                        value: summary?.notIndexed ?? 0,
                        label: "Not indexed",
                        icon: IconCircleX,
                        accent: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      },
                      {
                        value: summary?.highOpportunities ?? 0,
                        label: "High opps",
                        icon: IconTargetArrow,
                        accent: "border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-princeton-orange)]",
                      },
                    ] as const).map(({ value, label, icon: Icon, accent }) => (
                      <div
                        key={label}
                        className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm"
                      >
                        <div className="px-5 py-4">
                          <div className={`mb-3 flex size-10 items-center justify-center rounded-[1rem] border ${accent}`}>
                            <Icon size={18} stroke={2} />
                          </div>
                          <p className="font-heading text-2xl font-semibold tracking-[-0.05em] text-[var(--color-princeton-orange)]">
                            {value}
                          </p>
                          <p className="mt-0.5 text-[0.62rem] uppercase text-muted-foreground/60">
                            {label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pages.map((page, index) => (
                    <PageCard key={page.id} page={page} index={index} />
                  ))}

                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                        Go deeper
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Turn index gaps into a weekly fix list with Mentiohunt.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Get recurring index monitoring, keyword ranking alerts, and backlink
                        opportunities surfaced daily — not just a one-off snapshot.
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
                  Know when new pages go unindexed before they cost you traffic.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt monitors your sitemap continuously, surfaces keyword ranking
                  gaps as they open, and connects both signals to your backlink outreach queue.
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
                  <Link href="/free-tools">
                    <IconExternalLink size={15} stroke={2.2} />
                    All free tools
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
