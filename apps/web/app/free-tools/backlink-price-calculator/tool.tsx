"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBolt,
  IconCalculator,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconCurrencyDollar,
  IconGlobe,
  IconInfoCircle,
  IconLink,
  IconLoader2,
  IconLock,
  IconSend,
  IconSparkles,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  type BacklinkMetrics,
  type ContentType,
  type LinkType,
  type Permanence,
  type Placement,
  type PricingOptions,
  buildReasoning,
  estimatePrice,
} from "./pricing"

const loadingStages = [
  "Looking up domain",
  "Fetching authority metrics via Ahrefs",
  "Fetching organic traffic data",
  "Building price estimate",
]

function normalizeDomain(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? rawUrl
  }
}

function formatNumber(n: number | null): string {
  if (n === null) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toFixed(0)
}

function formatPrice(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n}`
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

function SelectField({ id, label, value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-11 w-full appearance-none rounded-[1rem] border border-border bg-card py-0 pl-4 pr-10 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <IconChevronDown
          size={15}
          stroke={2.4}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
        />
      </div>
    </div>
  )
}

export function BacklinkPriceCalculator() {
  const [url, setUrl] = useState("")
  const [submittedDomain, setSubmittedDomain] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [metrics, setMetrics] = useState<BacklinkMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const [linkType, setLinkType] = useState<LinkType>("dofollow")
  const [placement, setPlacement] = useState<Placement>("body")
  const [contentType, setContentType] = useState<ContentType>("niche_edit")
  const [permanence, setPermanence] = useState<Permanence>("permanent")

  const opts: PricingOptions = { linkType, placement, contentType, permanence }

  const estimate = useMemo(
    () => (metrics ? estimatePrice(metrics, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, linkType, placement, contentType, permanence]
  )

  const reasoning = useMemo(
    () => (metrics ? buildReasoning(metrics, opts) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, linkType, placement, contentType, permanence]
  )

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return
    const timer = window.setTimeout(
      () => setStageIndex((s) => s + 1),
      stageIndex === 0 ? 600 : 900
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return

    setSubmittedDomain(normalizeDomain(trimmedUrl))
    setStageIndex(0)
    setError(null)
    setMetrics(null)
    setPhase("loading")

    try {
      const res = await fetch("/api/free-tool/backlink-price-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setPhase("idle")
        return
      }

      setMetrics(data as BacklinkMetrics)
      setPhase("results")
    } catch {
      setError("Network error. Check your connection and try again.")
      setPhase("idle")
    }
  }

  const hasResults = phase === "results" && metrics !== null && estimate !== null
  const dofollowRatio =
    metrics?.dofollowReferringDomains != null && metrics?.referringDomains != null && metrics.referringDomains > 0
      ? metrics.dofollowReferringDomains / metrics.referringDomains
      : null

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
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
            {/* Left: copy */}
            <div className="max-w-3xl">
              <Link
                href="/free-tools"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)] transition-colors hover:bg-[var(--color-blaze-orange)]/12"
              >
                <IconBolt size={13} stroke={2.6} />
                Free backlink tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Backlink Price Calculator
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Enter the URL of a site you want a backlink from. We pull
                real authority metrics via Ahrefs and estimate a fair market
                price based on DR, traffic, and your link preferences.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Enter URL", "Site you want a link from"],
                  ["Pull metrics", "DR, traffic, referring domains"],
                  ["Get estimate", "Fair price range per link"],
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

            {/* Right: form card */}
            <div className="relative">
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[var(--color-amber-glow)]/16 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 left-10 h-44 w-44 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/25 bg-card p-4 shadow-[0_36px_120px_-56px_rgba(255,96,0,0.75)]">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />

                <div className="rounded-[1.75rem] border border-border/80 bg-background/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                        Estimate a price
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Backlink Price Calculator
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconCalculator size={25} stroke={2.4} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="backlink-url"
                        className="text-sm font-medium text-foreground"
                      >
                        Website URL (the site linking to you)
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="backlink-url"
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                          required
                          disabled={phase === "loading"}
                        />
                        <Button
                          type="submit"
                          size="lg"
                          disabled={phase === "loading"}
                          className="h-12 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                        >
                          {phase === "loading" ? "Analyzing" : "Estimate price"}
                          {phase === "loading" ? (
                            <IconLoader2 className="animate-spin" size={16} />
                          ) : (
                            <IconArrowRight size={16} stroke={2.5} />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SelectField
                        id="link-type"
                        label="Link type"
                        value={linkType}
                        onChange={(v) => setLinkType(v as LinkType)}
                        disabled={phase === "loading"}
                        options={[
                          { value: "dofollow", label: "Dofollow" },
                          { value: "nofollow", label: "Nofollow" },
                        ]}
                      />
                      <SelectField
                        id="placement"
                        label="Link placement"
                        value={placement}
                        onChange={(v) => setPlacement(v as Placement)}
                        disabled={phase === "loading"}
                        options={[
                          { value: "body", label: "In-article body" },
                          { value: "homepage", label: "Homepage" },
                          { value: "bio", label: "Author bio / byline" },
                          { value: "sidebar", label: "Sidebar / footer" },
                        ]}
                      />
                      <SelectField
                        id="content-type"
                        label="Content type"
                        value={contentType}
                        onChange={(v) => setContentType(v as ContentType)}
                        disabled={phase === "loading"}
                        options={[
                          { value: "niche_edit", label: "Niche edit / link insertion" },
                          { value: "guest_post", label: "New guest post" },
                        ]}
                      />
                      <SelectField
                        id="permanence"
                        label="Duration"
                        value={permanence}
                        onChange={(v) => setPermanence(v as Permanence)}
                        disabled={phase === "loading"}
                        options={[
                          { value: "permanent", label: "Permanent" },
                          { value: "rented", label: "Rented / yearly" },
                        ]}
                      />
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
                          <IconCalculator size={20} stroke={2.4} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when your URL is.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Enter a URL to pull real Ahrefs metrics and calculate
                            an estimated backlink price.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {phase === "loading" ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                            <IconLoader2 className="animate-spin" size={20} stroke={2.4} />
                          </div>
                          <div>
                            <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                              Analyzing {submittedDomain}
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
                              <span className="text-muted-foreground">{stage}</span>
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
                            Analysis complete for {submittedDomain}.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Adjust the selects above to update the estimate instantly.
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

      {/* ── Results ──────────────────────────────────────────────── */}
      <section
        ref={resultsRef}
        className="scroll-mt-24 border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="container mx-auto max-w-7xl">
          {!hasResults ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconTargetArrow size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Estimate appears after analysis.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Enter a website URL above to pull authority metrics and
                calculate a fair backlink price range.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              {/* Left: metrics */}
              <div className="lg:sticky lg:top-28 space-y-4">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                    Site metrics
                  </p>
                  <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                    {submittedDomain}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Pulled live from Ahrefs. Adjust the link options in the
                    form above to update the price estimate.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm space-y-4">
                  {[
                    {
                      label: "Domain Rating",
                      value: metrics.domainRating !== null ? String(metrics.domainRating) : "—",
                      icon: IconTargetArrow,
                      note: "Ahrefs DR (0–100 scale)",
                    },
                    {
                      label: "Backlinks",
                      value: formatNumber(metrics.backlinks),
                      icon: IconLink,
                      note: "Total inbound links",
                    },
                    {
                      label: "Referring domains",
                      value: formatNumber(metrics.referringDomains),
                      icon: IconGlobe,
                      note:
                        dofollowRatio !== null
                          ? `${Math.round(dofollowRatio * 100)}% dofollow`
                          : "Unique linking domains",
                    },
                    {
                      label: "Organic traffic",
                      value: metrics.traffic !== null ? formatNumber(metrics.traffic) : "N/A",
                      icon: IconChartBar,
                      note:
                        metrics.traffic !== null
                          ? "Monthly organic visits"
                          : "Traffic data unavailable",
                    },
                  ].map(({ label, value, icon: Icon, note }) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm text-muted-foreground">
                        <Icon size={18} stroke={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground/60">
                          {label}
                        </p>
                        <p className="font-heading text-xl font-semibold tracking-[-0.04em]">
                          {value}
                        </p>
                        <p className="text-xs text-muted-foreground">{note}</p>
                      </div>
                    </div>
                  ))}

                  {dofollowRatio !== null && dofollowRatio < 0.3 ? (
                    <div className="flex items-start gap-2 rounded-[0.85rem] border border-amber-500/25 bg-amber-500/8 px-3 py-2">
                      <IconInfoCircle size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" stroke={2.2} />
                      <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                        Mostly nofollow referring-domain profile — investigate before buying.
                      </p>
                    </div>
                  ) : null}

                  {metrics.traffic === null ? (
                    <div className="flex items-start gap-2 rounded-[0.85rem] border border-border bg-muted/40 px-3 py-2">
                      <IconInfoCircle size={15} className="mt-0.5 shrink-0 text-muted-foreground/60" stroke={2.2} />
                      <p className="text-xs leading-5 text-muted-foreground">
                        Traffic data unavailable. A neutral ×1.0 traffic multiplier is applied.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right: price estimate */}
              <div className="space-y-5">
                {/* Price range */}
                <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-7">
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.10]" />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-md shadow-primary/25">
                        <IconCurrencyDollar size={24} stroke={2.4} />
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                          Estimated price range
                        </p>
                        <p className="mt-1 font-heading text-5xl font-semibold tracking-[-0.06em] text-[var(--color-princeton-orange)] sm:text-6xl">
                          {formatPrice(estimate.low)}
                          <span className="mx-2 text-3xl text-muted-foreground/40 sm:text-4xl">–</span>
                          {formatPrice(estimate.high)}
                        </p>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Point estimate: <strong className="text-foreground">{formatPrice(estimate.mid)}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                  <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                    Price factors
                  </p>
                  <div className="mt-4 space-y-3">
                    {estimate.factors.map((factor) => (
                      <div
                        key={factor.label}
                        className="flex items-start justify-between gap-4 rounded-[1rem] border border-border/70 bg-background/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {factor.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                            {factor.note}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {factor.multiplier !== null ? (
                            <span
                              className={
                                factor.multiplier >= 1
                                  ? "rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--color-princeton-orange)]"
                                  : "rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground"
                              }
                            >
                              ×{factor.multiplier}
                            </span>
                          ) : (
                            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground">
                              base
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                {reasoning ? (
                  <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                    <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                      Plain-language read
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{reasoning}</p>
                  </div>
                ) : null}

                {/* Disclaimer */}
                <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/30 px-4 py-3">
                  <IconInfoCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground/60" stroke={2.2} />
                  <p className="text-xs leading-6 text-muted-foreground">
                    This is a market estimate, not a guaranteed price. Many sites do not sell links.
                    Actual prices vary based on negotiation, niche, and the site owner&apos;s preferences.
                  </p>
                </div>

                {/* Sign-up CTA */}
                <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                  <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                  <div className="relative mx-auto max-w-xl text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                      <IconLock size={23} stroke={2.5} />
                    </div>
                    <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                      Beyond price estimates
                    </p>
                    <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                      Find the backlink opportunities worth paying for.
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                      Get competitor backlink gaps, contact details, and a recurring
                      opportunity queue built around your product.
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
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/20 bg-card p-7 shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                  More than an estimate
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Turn price checks into a recurring backlink outreach queue.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt surfaces backlink opportunities from your competitors,
                  keywords, and content — so you always know which links to chase next.
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
