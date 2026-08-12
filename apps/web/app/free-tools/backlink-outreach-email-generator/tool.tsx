"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconClipboard,
  IconClipboardCheck,
  IconLock,
  IconMail,
  IconSparkles,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import {
  TYPE_LABELS,
  type OutreachEmail,
  type OutreachInput,
  generateOutreachEmails,
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

function EmailCard({ email }: { email: OutreachEmail }) {
  const fullText = `Subject: ${email.subject}\n\n${email.body}`

  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
          {TYPE_LABELS[email.type]}
        </span>
        <CopyButton text={fullText} />
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
          Subject
        </p>
        <p className="mt-1 font-heading text-sm font-semibold tracking-[-0.02em]">
          {email.subject}
        </p>
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
          Body
        </p>
        <p className="mt-1 text-xs leading-6 whitespace-pre-line text-foreground/90">
          {email.body}
        </p>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-[0.65rem] font-semibold uppercase text-muted-foreground/60 select-none">
          Follow-up (if no reply)
        </summary>
        <div className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background p-3">
          <p className="text-xs leading-6 whitespace-pre-line text-foreground/90">
            {email.followUp}
          </p>
          <CopyButton text={email.followUp} />
        </div>
      </details>

      <p className="border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">
        {email.note}
      </p>
    </div>
  )
}

export function BacklinkOutreachEmailGenerator() {
  const [yourName, setYourName] = useState("")
  const [yourCompany, setYourCompany] = useState("")
  const [targetSite, setTargetSite] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [articleTopic, setArticleTopic] = useState("")
  const [articleUrl, setArticleUrl] = useState("")
  const [results, setResults] = useState<OutreachEmail[] | null>(null)
  const [submittedSite, setSubmittedSite] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const input: OutreachInput = {
      yourName: yourName.trim(),
      yourCompany: yourCompany.trim(),
      targetSite: targetSite.trim(),
      recipientName: recipientName.trim() || undefined,
      articleTopic: articleTopic.trim(),
      articleUrl: articleUrl.trim() || undefined,
    }

    const emails = generateOutreachEmails(input)
    if (emails.length === 0) {
      setError(
        "Fill in your name, company, target site, and article topic to generate emails."
      )
      return
    }

    setSubmittedSite(input.targetSite)
    setResults(emails)
  }

  const hasResults = results !== null && results.length > 0

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconMail}
            title="Backlink Outreach Email"
            highlight="Generator"
            description="Enter your details and the target site. Get four ready-to-send outreach emails — guest post, broken link, resource page, and unlinked mention — each with a follow-up and guidance on when to use it."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="your-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Your name
                  </label>
                  <Input
                    id="your-name"
                    type="text"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="your-company"
                    className="text-sm font-medium text-foreground"
                  >
                    Your company
                  </label>
                  <Input
                    id="your-company"
                    type="text"
                    value={yourCompany}
                    onChange={(e) => setYourCompany(e.target.value)}
                    placeholder="e.g. Mentiohunt"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="target-site"
                  className="text-sm font-medium text-foreground"
                >
                  Target site name
                </label>
                <Input
                  id="target-site"
                  type="text"
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  placeholder="e.g. saastools.blog"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recipient-name"
                  className="text-sm font-medium text-foreground"
                >
                  Recipient name{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Input
                  id="recipient-name"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="article-topic"
                  className="text-sm font-medium text-foreground"
                >
                  Your article / topic
                </label>
                <Input
                  id="article-topic"
                  type="text"
                  value={articleTopic}
                  onChange={(e) => setArticleTopic(e.target.value)}
                  placeholder="e.g. a guide to SaaS onboarding emails"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="article-url"
                  className="text-sm font-medium text-foreground"
                >
                  Article URL{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Input
                  id="article-url"
                  type="text"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://yoursite.com/blog/post"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                Generate outreach emails
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
                    <IconMail size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your details are.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Fill in the form to generate four outreach emails with
                      follow-ups.
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
                      {results.length} emails generated for &ldquo;
                      {submittedSite}&rdquo;.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Scroll down to copy and review each angle.
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
                <IconMail size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Emails appear after generation.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Fill in the form above to generate four outreach emails — one
                per angle — each with a follow-up.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold text-muted-foreground/60 uppercase">
                    Results
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {results.length} outreach emails for &ldquo;{submittedSite}
                    &rdquo;
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the copy icon on any card to copy the full email.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((email) => (
                  <EmailCard key={email.type} email={email} />
                ))}
              </div>

              {/* Sign-up CTA */}
              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                <div className="relative mx-auto max-w-xl text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                    <IconLock size={23} stroke={2.5} />
                  </div>
                  <p className="mt-5 text-[0.65rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
                    Beyond the email draft
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Find the opportunity and the contact first.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Mentiohunt surfaces backlink opportunities, finds the site
                    owner contact details, and drafts the outreach email per
                    opportunity — so you monitor the queue and cancel bad fits,
                    not write from scratch.
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
            eyebrow="More than one email"
            heading="Turn one outreach email into a recurring backlink queue."
            body="Mentiohunt finds the sites worth targeting, surfaces contact details, and schedules personalized outreach — so you monitor the queue instead of writing every email by hand."
          />
        </div>
      </section>
    </>
  )
}
