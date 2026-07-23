"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconClipboard,
  IconClipboardCheck,
  IconExternalLink,
  IconLoader2,
  IconLock,
  IconMailSearch,
  IconShieldCheck,
  IconSparkles,
  IconUserSearch,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { getContactAvatarUrl } from "@/consts/contact-avatar"

import {
  type AuthorContactApiResponse,
  type ContactConfidence,
  extractDomain,
} from "./utils"

const loadingStages = [
  "Fetching the article page",
  "Locating the author byline",
  "Checking author bio and contact pages",
  "Resolving and verifying the most likely email",
]

const proofPoints = [
  "Reads the article byline, not just the domain's generic inbox.",
  "Every email is labelled with a confidence level, never presented as verified when it isn't.",
  "Falls back to a general contact when no direct author email exists.",
]

const confidenceCopy: Record<
  Exclude<ContactConfidence, "none">,
  {
    label: string
    className: string
    icon: typeof IconShieldCheck
    description: string
  }
> = {
  personalized: {
    label: "Verified personal email",
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: IconShieldCheck,
    description: "Personal email found and confirmed deliverable.",
  },
  "email-only": {
    label: "Verified email, no name",
    className:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    icon: IconMailSearch,
    description:
      "Email confirmed deliverable — no author name identified with confidence.",
  },
  generic: {
    label: "Verified general inbox",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: IconUserSearch,
    description:
      "General inbox confirmed deliverable — no personal address found.",
  },
  inferred: {
    label: "Pattern guess — unverified",
    className:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    icon: IconAlertCircle,
    description:
      "This domain accepts all addresses (catch-all), so this best-guess pattern could not be individually verified.",
  },
}

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
      className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground/60 transition-colors hover:border-border hover:text-foreground"
    >
      {copied ? (
        <IconClipboardCheck
          size={14}
          stroke={2.4}
          className="text-[var(--color-princeton-orange)]"
        />
      ) : (
        <IconClipboard size={14} stroke={2.2} />
      )}
    </button>
  )
}

function ContactCard({ contact }: { contact: AuthorContactApiResponse }) {
  if (contact.confidence === "none") return null

  const confidence = confidenceCopy[contact.confidence]
  const ConfidenceIcon = confidence.icon
  const title = contact.name ?? (contact.email ? "Site contact" : "Contact")
  const otherEmails = contact.otherEmails.filter(
    (e) => e.value.toLowerCase() !== contact.email?.toLowerCase()
  )
  const twitter = contact.socialLinks.twitter ?? contact.socialLinks.x
  const linkedin = contact.socialLinks.linkedin

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_22px_70px_-54px_rgba(255,96,0,0.65)] sm:p-6">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm">
            <img
              src={getContactAvatarUrl(contact.email ?? title)}
              alt=""
              className="size-full"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                {title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase ${confidence.className}`}
              >
                <ConfidenceIcon size={12} stroke={2.6} />
                {confidence.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {twitter ? (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35 hover:text-foreground"
            >
              <IconBrandX size={13} stroke={2} />
              Profile
            </a>
          ) : null}
          {linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35 hover:text-foreground"
            >
              <IconBrandLinkedin size={13} stroke={2} />
              LinkedIn
            </a>
          ) : null}
        </div>
      </div>

      {contact.bio ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {contact.bio}
        </p>
      ) : null}

      {contact.email ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
          <p className="truncate font-medium text-sm text-foreground">
            {contact.email}
          </p>
          <CopyButton text={contact.email} />
        </div>
      ) : contact.contactFormUrl ? (
        <a
          href={contact.contactFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35"
        >
          No direct email found — use their contact form
          <IconExternalLink size={14} stroke={2.2} />
        </a>
      ) : null}

      {otherEmails.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground/70">
            Also found on this page:
          </p>
          {otherEmails.map((e) => (
            <div
              key={e.value}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-1.5 text-xs"
            >
              <span className="truncate text-muted-foreground">
                {e.value}
              </span>
              <span className="shrink-0 text-muted-foreground/60 uppercase">
                {e.type}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-muted-foreground/70">
        {confidence.description}
      </p>
    </article>
  )
}

export function AuthorContactFinder() {
  const [articleUrl, setArticleUrl] = useState("")
  const [submittedUrl, setSubmittedUrl] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [result, setResult] = useState<AuthorContactApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const domain = submittedUrl ? extractDomain(submittedUrl) : "the article"

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return

    const timer = window.setTimeout(
      () => setStageIndex((current) => current + 1),
      stageIndex === 0 ? 900 : 4500
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

    const trimmedUrl = articleUrl.trim()
    if (!trimmedUrl) return

    let parsed: URL
    try {
      parsed = new URL(
        trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`
      )
    } catch {
      setError("Enter a valid article URL, including the domain.")
      return
    }
    if (parsed.pathname === "/" || parsed.pathname === "") {
      setError(
        "Enter a link to a specific article, not just a homepage — the author lives on the article page."
      )
      return
    }

    setSubmittedUrl(trimmedUrl)
    setStageIndex(0)
    setError(null)
    setResult(null)
    setPhase("loading")

    try {
      const res = await fetch("/api/free-tool/author-contact-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Lookup failed. Please try again."
        )
        setPhase("idle")
        return
      }

      setResult(data as AuthorContactApiResponse)
      setPhase("results")
    } catch {
      setError("Lookup failed. Please try again.")
      setPhase("idle")
    }
  }

  const hasResults = phase === "results" && result !== null
  const foundContact = hasResults && result.confidence !== "none"

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconUserSearch}
            title="Author Contact"
            highlight="Finder"
            description="Paste a link to any blog post and find the author's contact details — so you can reach out about a backlink placement without digging through the site yourself."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-3">
              <label
                htmlFor="article-url"
                className="text-sm font-medium text-foreground"
              >
                Article URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="article-url"
                  type="url"
                  value={articleUrl}
                  onChange={(event) => setArticleUrl(event.target.value)}
                  placeholder="https://example.com/blog/some-article"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={phase === "loading"}
                  className="h-12 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  {phase === "loading" ? "Searching" : "Find contact"}
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

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              {phase === "idle" ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconMailSearch size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your link is.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Paste an article URL to find the author&apos;s contact
                      details.
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
                        Searching {domain}
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
                      {foundContact
                        ? `Contact found for ${domain}.`
                        : `No public contact found for ${domain}.`}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {foundContact
                        ? "Review the confidence level below before reaching out."
                        : "The site may block automated crawling, or simply not list contact details publicly."}
                    </p>
                  </div>
                </div>
              ) : null}
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
                Know exactly who to email next.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                The author&apos;s name and most likely email — labelled with a
                confidence level, not presented as verified unless it actually
                is.
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
                    <IconUserSearch size={24} stroke={2.4} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Contact details appear after the search.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Paste an article URL above to find who wrote it and how to
                    reach them.
                  </p>
                </div>
              ) : !foundContact ? (
                <div className="rounded-[2rem] border border-dashed border-border bg-card/70 p-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <IconAlertCircle size={24} stroke={2.4} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    No contact info found.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    We couldn&apos;t find a deliverable email or author name
                    for {result?.domain}.
                  </p>
                  {result?.contactFormUrl ? (
                    <a
                      href={result.contactFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[var(--color-blaze-orange)]/35"
                    >
                      Try their contact form
                      <IconExternalLink size={14} stroke={2.2} />
                    </a>
                  ) : null}
                </div>
              ) : (
                <>
                  <ContactCard contact={result} />

                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                        Beyond one lookup
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Sign up to draft the outreach email too.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Mentiohunt finds the opportunity, surfaces the
                        contact, and drafts the email — daily, for every
                        article on your sitemap.
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
        <div className="container mx-auto max-w-6xl">
          <AutomationCta
            eyebrow="More than one lookup"
            heading="Turn author lookups into a recurring outreach queue."
            body="Mentiohunt finds where your articles fit, surfaces the contact, and drafts the outreach — so you approve or reject, instead of hunting for emails one article at a time."
          />
        </div>
      </section>
    </>
  )
}
