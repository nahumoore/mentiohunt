"use client"

import { type FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconLoader2,
  IconLock,
  IconMailCheck,
  IconSparkles,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"

const MAX_EMAILS_PER_CHECK = 50

type VerifyStatus = "valid" | "invalid" | "disposable" | "role-based" | "unknown"

interface EmailVerifyResult {
  email: string
  status: VerifyStatus
  reason: string
}

const STATUS_LABELS: Record<VerifyStatus, string> = {
  valid: "Valid",
  invalid: "Invalid",
  disposable: "Disposable",
  "role-based": "Role-based",
  unknown: "Unknown",
}

function statusBadgeClass(status: VerifyStatus): string {
  if (status === "valid")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "role-based")
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  if (status === "unknown")
    return "border-border/70 bg-muted/60 text-muted-foreground"
  return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
}

function parseEmails(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((token) => token.trim())
        .filter(Boolean)
    ),
  ]
}

export function BulkEmailVerifier() {
  const [raw, setRaw] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [results, setResults] = useState<EmailVerifyResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emailCount = useMemo(() => parseEmails(raw).length, [raw])
  const overLimit = emailCount > MAX_EMAILS_PER_CHECK
  const hasResults = results !== null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const emails = parseEmails(raw)
    if (emails.length === 0 || emails.length > MAX_EMAILS_PER_CHECK) return

    setError(null)
    setPhase("loading")

    try {
      const res = await fetch("/api/free-tool/bulk-email-verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      })

      const data = (await res.json()) as {
        results?: EmailVerifyResult[]
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setPhase("idle")
        return
      }

      setResults(data.results ?? [])
      setPhase("results")
    } catch {
      setError("Could not reach the verifier. Check your connection and try again.")
      setPhase("idle")
    }
  }

  const counts = useMemo(() => {
    if (!results) return null
    return results.reduce(
      (acc, r) => {
        acc[r.status] += 1
        return acc
      },
      { valid: 0, invalid: 0, disposable: 0, "role-based": 0, unknown: 0 } as Record<
        VerifyStatus,
        number
      >
    )
  }, [results])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconMailCheck}
            title="Bulk Email"
            highlight="Verifier"
            description="Paste a list of contact emails and check each one for syntax, disposable domains, and role-based addresses before you send outreach to it."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email-list"
                  className="text-sm font-medium text-foreground"
                >
                  Email addresses{" "}
                  <span className="text-muted-foreground/60">
                    (one per line, or comma-separated — up to{" "}
                    {MAX_EMAILS_PER_CHECK})
                  </span>
                </label>
                <Textarea
                  id="email-list"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={
                    "sarah@acme.com\neditor@saastools.io\ninfo@example.com"
                  }
                  rows={6}
                  className="rounded-2xl border-border bg-card px-4 py-3 text-sm shadow-sm"
                  disabled={phase === "loading"}
                  required
                />
                {overLimit ? (
                  <p className="text-xs font-medium text-destructive">
                    {emailCount} emails pasted — max {MAX_EMAILS_PER_CHECK} per
                    check. Trim your list to continue.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={phase === "loading" || emailCount === 0 || overLimit}
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                {phase === "loading"
                  ? "Verifying…"
                  : `Verify ${emailCount > 0 ? emailCount : ""} email${emailCount === 1 ? "" : "s"}`}
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
              {!hasResults ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconMailCheck size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your list is.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Paste up to {MAX_EMAILS_PER_CHECK} emails to check syntax,
                      disposable domains, and role-based addresses.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconMailCheck size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      {results.length} email{results.length === 1 ? "" : "s"}{" "}
                      checked.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Scroll down for the per-address breakdown.
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
          {!hasResults ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconMailCheck size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Results appear after you paste a list.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Paste your contact list above to see how each address gets
                flagged — valid, invalid, disposable, role-based, or unknown.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                    Results
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    {results.length} email{results.length === 1 ? "" : "s"}{" "}
                    checked
                  </h2>
                </div>
              </div>

              {counts ? (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(
                    [
                      ["valid", "Valid"],
                      ["invalid", "Invalid"],
                      ["disposable", "Disposable"],
                      ["role-based", "Role-based"],
                      ["unknown", "Unknown"],
                    ] as [VerifyStatus, string][]
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-border/70 bg-card p-3 text-center"
                    >
                      <p className="font-heading text-xl font-semibold tracking-[-0.03em]">
                        {counts[key]}
                      </p>
                      <p className="text-[0.6rem] font-semibold text-muted-foreground/60 uppercase">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.email}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {result.email}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {result.reason}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase ${statusBadgeClass(result.status)}`}
                    >
                      {STATUS_LABELS[result.status]}
                    </span>
                  </div>
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
                  <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                    Beyond a one-time check
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Contacts get verified before they ever reach your queue.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Mentiohunt finds the site owner's contact, verifies it
                    during enrichment, and drafts the outreach email — so you
                    review a ready opportunity, not a raw list.
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
            eyebrow="More than a clean list"
            heading="Turn verified contacts into a recurring outreach queue."
            body="Mentiohunt finds sites worth targeting, verifies the contact during enrichment, and drafts the outreach email — so you approve opportunities instead of cleaning lists by hand."
          />
        </div>
      </section>
    </>
  )
}
