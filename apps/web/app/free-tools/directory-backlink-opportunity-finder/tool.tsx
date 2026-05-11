"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconExternalLink,
  IconFolderSearch,
  IconLock,
  IconLoader2,
  IconSearch,
  IconSend,
  IconSparkles,
  IconTargetArrow,
} from "@tabler/icons-react"

import type { Tables } from "@workspace/supabase/database-types"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type Directory = Tables<"directories">

const loadingStages = [
  "Reading your product URL",
  "Checking known startup directory indexes",
  "Comparing likely submission footprints",
  "Preparing directory backlink opportunities",
]

const mockDirectories: Directory[] = [
  {
    id: "dir_launching_next",
    name: "Launching Next",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "launchingnext.com",
    category: "Startup launch directory",
    submit_url: "https://www.launchingnext.com/submit",
    is_active: true,
    is_free: true,
  },
  {
    id: "dir_saashub",
    name: "SaaSHub",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "saashub.com",
    category: "Software comparison directory",
    submit_url: "https://www.saashub.com/submit",
    is_active: true,
    is_free: true,
  },
  {
    id: "dir_startup_stash",
    name: "Startup Stash",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "startupstash.com",
    category: "Curated founder resources",
    submit_url: "https://startupstash.com/suggest-tool/",
    is_active: true,
    is_free: false,
  },
  {
    id: "dir_betalist",
    name: "BetaList",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "betalist.com",
    category: "Early access startup directory",
    submit_url: "https://betalist.com/submissions/new",
    is_active: true,
    is_free: false,
  },
  {
    id: "dir_tool_finder",
    name: "Tool Finder",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "toolfinder.co",
    category: "Productivity tool directory",
    submit_url: "https://toolfinder.co/submit-your-tool",
    is_active: true,
    is_free: true,
  },
  {
    id: "dir_alternative_to",
    name: "AlternativeTo",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "alternativeto.net",
    category: "Alternative software directory",
    submit_url: "https://alternativeto.net/software/new/",
    is_active: true,
    is_free: true,
  },
  {
    id: "dir_futurepedia",
    name: "Futurepedia",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "futurepedia.io",
    category: "AI tool directory",
    submit_url: "https://www.futurepedia.io/submit-tool",
    is_active: true,
    is_free: false,
  },
  {
    id: "dir_insidr_ai",
    name: "Insidr AI",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "insidr.ai",
    category: "AI startup directory",
    submit_url: "https://www.insidr.ai/submit-tool",
    is_active: true,
    is_free: true,
  },
  {
    id: "dir_toolify",
    name: "Toolify",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "toolify.ai",
    category: "AI software directory",
    submit_url: "https://www.toolify.ai/submit",
    is_active: true,
    is_free: false,
  },
  {
    id: "dir_devpages",
    name: "DevPages",
    created_at: "2026-05-01T00:00:00.000Z",
    domain: "devpages.io",
    category: "Developer tool directory",
    submit_url: "https://devpages.io/submit",
    is_active: true,
    is_free: true,
  },
]

const proofPoints = [
  "Checks directory-style opportunities, not generic backlink lists.",
  "Prioritizes next actions founders can complete without an agency workflow.",
  "Designed to become a recurring backlink opportunity queue.",
]

function normalizeDomain(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}

function getDirectoryIconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

export function DirectoryBacklinkOpportunityFinder() {
  const [productUrl, setProductUrl] = useState("")
  const [submittedUrl, setSubmittedUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const resultsRef = useRef<HTMLElement>(null)

  const productDomain = useMemo(
    () => (submittedUrl ? normalizeDomain(submittedUrl) : "your product"),
    [submittedUrl]
  )

  useEffect(() => {
    if (phase !== "loading") return

    const timer = window.setTimeout(
      () => {
        if (stageIndex < loadingStages.length - 1) {
          setStageIndex((current) => current + 1)
          return
        }

        setPhase("results")
      },
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUrl = productUrl.trim()
    if (!trimmedUrl) return

    setSubmittedUrl(trimmedUrl)
    setStageIndex(0)
    setPhase("loading")
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
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-princeton-orange)] transition-colors hover:bg-[var(--color-blaze-orange)]/12"
              >
                <IconBolt size={13} stroke={2.6} />
                Free backlink tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Directory Backlink Opportunity Finder
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Enter your product URL and prepare a focused scan for startup
                directories worth applying to next. Built for founders who want
                directory backlink opportunities without sorting a giant generic
                list.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["URL in", "Paste your product"],
                  ["Scan", "Review directory fit"],
                  ["Apply", "Work the list"],
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
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                        Run a scan
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Find directory gaps
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconFolderSearch size={25} stroke={2.4} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                    <label
                      htmlFor="product-url"
                      className="text-sm font-medium text-foreground"
                    >
                      Product URL
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        id="product-url"
                        type="url"
                        value={productUrl}
                        onChange={(event) => setProductUrl(event.target.value)}
                        placeholder="https://yourproduct.com"
                        className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                        required
                      />
                      <Button
                        type="submit"
                        size="lg"
                        disabled={phase === "loading"}
                        className="h-12 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                      >
                        {phase === "loading" ? "Scanning" : "Find opportunities"}
                        {phase === "loading" ? (
                          <IconLoader2 className="animate-spin" size={16} />
                        ) : (
                          <IconArrowRight size={16} stroke={2.5} />
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-7 rounded-[1.4rem] border border-border bg-card p-4">
                    {phase === "idle" ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconSearch size={20} stroke={2.4} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when your URL is.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Enter a product URL to start the directory
                            opportunity scan flow.
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
                              Scanning {productDomain}
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
                            Demo scan complete for {productDomain}.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {mockDirectories.length} unapplied
                            directory opportunities are ready below.
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
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Results
              </p>
              <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                Directories your startup can work through next.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                The scanner returns a clear queue of directory backlink
                opportunities, why each directory might fit, and the next
                preparation step before applying.
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
                    <IconTargetArrow size={24} stroke={2.4} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Results appear after the scan.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Enter a product URL above to start the directory backlink
                    opportunity scan.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      [mockDirectories.length, "directories found"],
                      [mockDirectories.filter((directory) => directory.is_free).length, "free submissions"],
                      [mockDirectories.filter((directory) => directory.is_active).length, "active directories"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[1.45rem] border border-[var(--color-blaze-orange)]/20 bg-card p-5 shadow-sm"
                      >
                        <p className="font-heading text-3xl font-semibold tracking-[-0.05em] text-[var(--color-princeton-orange)]">
                          {value}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {mockDirectories.map((directory, index) => (
                    <article
                      key={directory.domain}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_22px_70px_-54px_rgba(255,96,0,0.65)] sm:p-6"
                    >
                      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-border bg-background shadow-sm">
                            <span
                              aria-hidden="true"
                              className="size-7 rounded-md bg-contain bg-center bg-no-repeat"
                              style={{
                                backgroundImage: `url(${getDirectoryIconUrl(directory.domain)})`,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                                {directory.name}
                              </h3>
                              <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-princeton-orange)]">
                                Not applied
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {directory.domain}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                            {directory.category ?? "Directory"}
                          </span>
                          <span
                            className={
                              directory.is_free
                                ? "rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                : "rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive"
                            }
                          >
                            {directory.is_free ? "Free submission" : "Paid listing"}
                          </span>
                          {directory.is_active ? (
                            <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="truncate text-sm text-muted-foreground">
                          Submit URL: {directory.submit_url}
                        </p>
                        <Link
                          href={directory.submit_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 self-start rounded-full text-sm font-semibold text-foreground outline-none transition-colors hover:text-[var(--color-princeton-orange)] focus-visible:ring-3 focus-visible:ring-ring/30 sm:self-auto"
                        >
                          Submit
                          <IconExternalLink size={16} stroke={2.4} />
                        </Link>
                      </div>
                    </article>
                  ))}

                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-princeton-orange)]">
                        Unlock deeper backlink opportunities
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Sign up to find more powerful backlinks beyond directory submissions.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Get competitor backlink gaps, unlinked mentions, and a
                        recurring opportunity queue built around your product.
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
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                  More than one scan
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Turn directory checks into a recurring backlink queue.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt is built to keep surfacing backlink opportunities
                  from your product, competitors, keywords, and content so you
                  always know what to apply for or pitch next.
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
