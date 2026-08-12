"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import {
  IconActivity,
  IconAlertCircle,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconLoader2,
  IconLock,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react"

import { AutomationCta, StatCard, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type BacklinkCheckStatus = "live" | "nofollow" | "removed" | "page_dead" | "check_failed"

type BacklinkCheckRow = {
  url: string
  status: BacklinkCheckStatus
  httpStatus: number | null
  finalUrl: string | null
  redirected: boolean
  anchorText: string | null
  href: string | null
  rel: string[] | null
}

type Summary = {
  checked: number
  live: number
  nofollow: number
  removed: number
  pageDead: number
  checkFailed: number
}

const MAX_URLS = 15

const statusCopy: Record<
  BacklinkCheckStatus,
  { label: string; className: string }
> = {
  live: {
    label: "Live · dofollow",
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  nofollow: {
    label: "Live · nofollow",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  removed: {
    label: "Link removed",
    className:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  page_dead: {
    label: "Page down",
    className:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  check_failed: {
    label: "Couldn't check",
    className: "border-border bg-muted/60 text-muted-foreground",
  },
}

function parseUrls(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_URLS)
}

export function BacklinkMonitor() {
  const [domain, setDomain] = useState("")
  const [urlsInput, setUrlsInput] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [rows, setRows] = useState<BacklinkCheckRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsedUrls = parseUrls(urlsInput)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedDomain = domain.trim()
    if (!trimmedDomain || parsedUrls.length === 0) return

    setError(null)
    setPhase("loading")

    try {
      const res = await fetch("/api/free-tool/backlink-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmedDomain, urls: parsedUrls }),
      })

      const data = (await res.json()) as {
        rows?: BacklinkCheckRow[]
        summary?: Summary
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setPhase("idle")
        return
      }

      setRows(data.rows ?? [])
      setSummary(data.summary ?? null)
      setPhase("results")
    } catch {
      setError("Could not reach the checker. Please try again.")
      setPhase("idle")
    }
  }

  const hasResults = phase === "results"

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconActivity}
            title="Backlink"
            highlight="Monitor"
            description="Paste your domain and the pages where you have backlinks — check right now which ones are still live, gone nofollow, or dropped."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="target-domain"
                  className="text-sm font-medium text-foreground"
                >
                  Your domain
                </label>
                <Input
                  id="target-domain"
                  type="text"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="yourwebsite.com"
                  className="h-11 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  disabled={phase === "loading"}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="source-urls"
                  className="flex items-center justify-between text-sm font-medium text-foreground"
                >
                  <span>Pages where you have a backlink</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {parsedUrls.length}/{MAX_URLS}
                  </span>
                </label>
                <textarea
                  id="source-urls"
                  value={urlsInput}
                  onChange={(event) => setUrlsInput(event.target.value)}
                  placeholder={"https://siteA.com/blog/post\nhttps://siteB.com/resources"}
                  rows={5}
                  disabled={phase === "loading"}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-blaze-orange/40"
                  required
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  One URL per line, up to {MAX_URLS}. We&apos;ll check each page
                  live for a link to your domain.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={
                  phase === "loading" || !domain.trim() || parsedUrls.length === 0
                }
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                {phase === "loading" ? "Checking…" : "Check my backlinks"}
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

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              {phase === "idle" ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconShieldCheck size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your links are.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Paste the pages you&apos;re expecting a link on.
                    </p>
                  </div>
                </div>
              ) : null}

              {phase === "loading" ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                    <IconLoader2 className="animate-spin" size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Checking {parsedUrls.length} page
                      {parsedUrls.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fetching each page live and looking for your link.
                    </p>
                  </div>
                </div>
              ) : null}

              {hasResults ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconCircleCheck size={20} stroke={2.5} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Checked {summary?.checked ?? 0} pages.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {(summary?.removed ?? 0) + (summary?.pageDead ?? 0)}{" "}
                      link{(summary?.removed ?? 0) + (summary?.pageDead ?? 0) === 1 ? "" : "s"}{" "}
                      need attention.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {!hasResults ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconActivity size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Results will show up here.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Run a check above and every page gets a live status: still
                linking, gone nofollow, or dropped.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  label="Live"
                  value={String(summary?.live ?? 0)}
                  icon={IconCircleCheck}
                  tone="success"
                  footnote="dofollow, still there"
                />
                <StatCard
                  label="Nofollow"
                  value={String(summary?.nofollow ?? 0)}
                  icon={IconShieldCheck}
                  tone="amber"
                  footnote="present, no ranking credit"
                />
                <StatCard
                  label="Removed"
                  value={String(summary?.removed ?? 0)}
                  icon={IconCircleX}
                  tone="orange"
                  footnote="page loads, link is gone"
                />
                <StatCard
                  label="Page down"
                  value={String(summary?.pageDead ?? 0)}
                  icon={IconCircleX}
                  tone="orange"
                  footnote="source page unreachable"
                />
              </div>

              <div className="space-y-2">
                {rows.map((row) => {
                  const copy = statusCopy[row.status]
                  return (
                    <div
                      key={row.url}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-1 truncate text-sm font-medium text-foreground hover:text-(--color-princeton-orange)"
                        >
                          <span className="truncate">{row.url}</span>
                          <IconExternalLink
                            size={12}
                            stroke={2.2}
                            className="shrink-0"
                          />
                        </a>
                        {row.anchorText ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            Anchor: &ldquo;{row.anchorText}&rdquo;
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {row.httpStatus ? (
                          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-muted-foreground">
                            HTTP {row.httpStatus}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${copy.className}`}
                        >
                          {copy.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                <div className="relative mx-auto max-w-xl text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                    <IconLock size={23} stroke={2.5} />
                  </div>
                  <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                    A one-time check finds problems late
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Get alerted the day a link drops, not next time you remember to check.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Link Tracker runs this same check daily on up to 200 backlinks
                    per site and emails you the moment one goes nofollow, gets
                    removed, or the page dies.
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
          )}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <AutomationCta
            eyebrow="Stop checking links by hand"
            heading="Let Link Tracker watch your backlinks every day."
            body="We find the sites, verify the owner's contact, draft the outreach, and schedule it automatically. Once a link is live, Link Tracker keeps checking it daily so you find out the day it drops — not months later."
          />
        </div>
      </section>
    </>
  )
}
