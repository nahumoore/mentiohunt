"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconClipboard,
  IconClipboardCheck,
  IconLink,
  IconLock,
  IconSparkles,
  IconTextSize,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  SAFETY_LABELS,
  TYPE_LABELS,
  type AnchorVariant,
  generateAnchors,
} from "./generate"

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
        <IconClipboardCheck size={13} stroke={2.4} className="text-[var(--color-princeton-orange)]" />
      ) : (
        <IconClipboard size={13} stroke={2.2} />
      )}
    </button>
  )
}

function safetyBadgeClass(safety: AnchorVariant["safety"]): string {
  if (safety === "safe")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (safety === "use-sparingly")
    return "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
}

function typeBadgeClass(_type: AnchorVariant["type"]): string {
  return "border-border/70 bg-muted/60 text-muted-foreground"
}

function AnchorCard({ variant }: { variant: AnchorVariant }) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-heading text-base font-semibold tracking-[-0.03em] break-all">
          {variant.text}
        </p>
        <CopyButton text={variant.text} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${typeBadgeClass(variant.type)}`}
        >
          {TYPE_LABELS[variant.type]}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${safetyBadgeClass(variant.safety)}`}
        >
          {SAFETY_LABELS[variant.safety]}
        </span>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{variant.note}</p>
    </div>
  )
}

export function AnchorTextGenerator() {
  const [keyword, setKeyword] = useState("")
  const [url, setUrl] = useState("")
  const [results, setResults] = useState<AnchorVariant[] | null>(null)
  const [submittedKw, setSubmittedKw] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const kw = keyword.trim()
    if (!kw) return
    setError(null)

    const anchors = generateAnchors(kw, url.trim() || undefined)
    if (anchors.length === 0) {
      setError("Could not generate anchors. Enter a keyword to continue.")
      return
    }

    setSubmittedKw(kw)
    setResults(anchors)
  }

  const hasResults = results !== null && results.length > 0

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconTextSize}
            title="Anchor Text"
            highlight="Generator"
            description="Enter a keyword and an optional target URL. Get a full set of anchor text variants — exact match, partial, branded, LSI, and generic — each labelled with a safety rating and a plain-language note on how to use it."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="anchor-keyword"
                  className="text-sm font-medium text-foreground"
                >
                  Keyword / topic
                </label>
                <Input
                  id="anchor-keyword"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. link building tool"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="anchor-url"
                  className="text-sm font-medium text-foreground"
                >
                  Target URL{" "}
                  <span className="text-muted-foreground/60">(optional — for branded anchors)</span>
                </label>
                <Input
                  id="anchor-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                Generate anchors
                <IconArrowRight size={16} stroke={2.5} />
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
              {!hasResults ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconTextSize size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your keyword is.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Enter a keyword to generate a full anchor text set
                      with safety labels.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconCheck size={20} stroke={2.5} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      {results.length} anchors generated for &ldquo;{submittedKw}&rdquo;.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Scroll down to copy and review each variant.
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
        <div className="container mx-auto max-w-7xl">
          {!hasResults ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconLink size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Anchors appear after generation.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Enter a keyword above — optionally a target URL — to generate a
                full set of labelled anchor text variants.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                    Results
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {results.length} anchor variants for &ldquo;{submittedKw}&rdquo;
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the copy icon on any card to copy the anchor text.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((variant, i) => (
                  <AnchorCard key={i} variant={variant} />
                ))}
              </div>

              {/* Safety legend */}
              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-border/70 bg-muted/30 px-5 py-4">
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase">Safety guide:</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/70" />
                  Safe — use freely
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500/70" />
                  Use sparingly — keep under ~5% of profile
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500/70" />
                  Avoid overuse — signals a manipulated profile at scale
                </span>
              </div>

              {/* Sign-up CTA */}
              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                <div className="relative mx-auto max-w-xl text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                    <IconLock size={23} stroke={2.5} />
                  </div>
                  <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                    Beyond anchor text
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Find the sites worth building links from.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Mentiohunt surfaces backlink opportunities, contact details,
                    and ready-to-send outreach drafts — so you spend time on
                    placements, not prep.
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
            eyebrow="More than anchor text"
            heading="Turn anchor diversity into a recurring link building queue."
            body="Mentiohunt finds the sites worth targeting, surfaces contact details, and schedules the outreach automatically — so you monitor the queue instead of hunting for them."
          />
        </div>
      </section>
    </>
  )
}
