"use client"

import { type FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconClipboard,
  IconClipboardCheck,
  IconExternalLink,
  IconLink,
  IconLoader2,
  IconLock,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

type LinkRelType = "nofollow" | "ugc" | "sponsored"

type PageLink = {
  href: string
  anchorText: string
  isDofollow: boolean
  relTypes: LinkRelType[]
  isInternal: boolean
}

type PageLinksResult = {
  finalUrl: string
  totalLinks: number
  dofollowCount: number
  nofollowCount: number
  internalCount: number
  externalCount: number
  wasTruncated: boolean
  links: PageLink[]
}

type FilterKey = "all" | "dofollow" | "nofollow" | "internal" | "external"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-7 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground/60 transition-colors hover:border-border hover:text-foreground"
    >
      {copied ? (
        <IconClipboardCheck
          size={13}
          stroke={2.4}
          className="text-[var(--color-princeton-orange)]"
        />
      ) : (
        <IconClipboard size={13} stroke={2.2} />
      )}
    </button>
  )
}

function RelBadge({ link }: { link: PageLink }) {
  if (link.isDofollow) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700 uppercase dark:text-emerald-300">
        Dofollow
      </span>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {link.relTypes.length > 0 ? (
        link.relTypes.map((rel) => (
          <span
            key={rel}
            className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[0.6rem] font-semibold text-rose-700 uppercase dark:text-rose-300"
          >
            {rel}
          </span>
        ))
      ) : (
        <span className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[0.6rem] font-semibold text-rose-700 uppercase dark:text-rose-300">
          Nofollow
        </span>
      )}
    </span>
  )
}

function LinkRow({ link }: { link: PageLink }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {link.anchorText}
        </p>
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">{link.href}</span>
          <IconExternalLink size={11} stroke={2.2} className="shrink-0" />
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[0.6rem] font-semibold text-muted-foreground uppercase">
          {link.isInternal ? "Internal" : "External"}
        </span>
        <RelBadge link={link} />
        <CopyButton text={link.href} />
      </div>
    </div>
  )
}

export function DofollowLinkChecker() {
  const [url, setUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [result, setResult] = useState<PageLinksResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) return

    setError(null)
    setPhase("loading")
    setFilter("all")

    try {
      const res = await fetch("/api/free-tool/dofollow-link-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = (await res.json()) as PageLinksResult & { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setPhase("idle")
        return
      }

      setResult(data)
      setPhase("results")
    } catch {
      setError("Could not reach that page. Check the URL and try again.")
      setPhase("idle")
    }
  }

  const filteredLinks = useMemo(() => {
    if (!result) return []

    switch (filter) {
      case "dofollow":
        return result.links.filter((link) => link.isDofollow)
      case "nofollow":
        return result.links.filter((link) => !link.isDofollow)
      case "internal":
        return result.links.filter((link) => link.isInternal)
      case "external":
        return result.links.filter((link) => !link.isInternal)
      default:
        return result.links
    }
  }, [result, filter])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconShieldCheck}
            title="Dofollow Link"
            highlight="Checker"
            description="Paste any page URL and see every outbound link on it — which are dofollow, which are nofollow, ugc, or sponsored, and which point internally versus off the site."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="page-url"
                  className="text-sm font-medium text-foreground"
                >
                  Page URL
                </label>
                <Input
                  id="page-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/blog/post"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  disabled={phase === "loading"}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={phase === "loading" || !url.trim()}
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                {phase === "loading" ? "Checking…" : "Check links"}
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
              {!result ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconLink size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your URL is.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Paste a page URL to scan every link on it.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconLink size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      {result.totalLinks} links found on this page.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Scroll down to filter and copy any link.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────── */}
      <section className="border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {!result ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconLink size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Links appear after scanning.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Paste a page URL above to see every dofollow, nofollow, ugc,
                and sponsored link on it.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold text-muted-foreground/60 uppercase">
                    Results
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {result.totalLinks} links on {new URL(result.finalUrl).hostname}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the copy icon on any row to copy the link.
                </p>
              </div>

              {result.wasTruncated ? (
                <p className="mb-4 text-xs text-muted-foreground">
                  This page has a lot of content — results were capped so the
                  scan stays fast.
                </p>
              ) : null}

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: "Total", value: result.totalLinks },
                  { label: "Dofollow", value: result.dofollowCount },
                  { label: "Nofollow", value: result.nofollowCount },
                  { label: "Internal", value: result.internalCount },
                  { label: "External", value: result.externalCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/70 bg-card p-3 text-center"
                  >
                    <p className="font-heading text-xl font-semibold tracking-[-0.03em]">
                      {stat.value}
                    </p>
                    <p className="text-[0.6rem] font-semibold text-muted-foreground/60 uppercase">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as FilterKey)}
              >
                <TabsList variant="line" className="mb-4">
                  <TabsTrigger value="all">All ({result.totalLinks})</TabsTrigger>
                  <TabsTrigger value="dofollow">
                    Dofollow ({result.dofollowCount})
                  </TabsTrigger>
                  <TabsTrigger value="nofollow">
                    Nofollow ({result.nofollowCount})
                  </TabsTrigger>
                  <TabsTrigger value="internal">
                    Internal ({result.internalCount})
                  </TabsTrigger>
                  <TabsTrigger value="external">
                    External ({result.externalCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredLinks.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
                  No links match this filter.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredLinks.map((link) => (
                    <LinkRow key={link.href} link={link} />
                  ))}
                </div>
              )}

              {/* Sign-up CTA */}
              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                <div className="relative mx-auto max-w-xl text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                    <IconLock size={23} stroke={2.5} />
                  </div>
                  <p className="mt-5 text-[0.65rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
                    Beyond one page
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Find sites worth getting a dofollow link from.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Mentiohunt surfaces backlink opportunities, finds the site
                    owner contact details, and drafts the outreach email per
                    opportunity — so you approve or reject, not check links by
                    hand.
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

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <AutomationCta
            eyebrow="More than one page"
            heading="Turn dofollow link checks into a recurring backlink queue."
            body="Mentiohunt finds the sites worth targeting, surfaces contact details, and generates the outreach draft — so you approve placements instead of checking links one page at a time."
          />
        </div>
      </section>
    </>
  )
}
