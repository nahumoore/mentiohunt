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
  IconNews,
  IconSparkles,
} from "@tabler/icons-react"

import { AutomationCta, ToolHero } from "@/components/free-tools"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  TYPE_LABELS,
  type AnnouncementType,
  type PressRelease,
  generatePressRelease,
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
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
    >
      {copied ? (
        <>
          <IconClipboardCheck
            size={14}
            stroke={2.4}
            className="text-[var(--color-princeton-orange)]"
          />
          Copied
        </>
      ) : (
        <>
          <IconClipboard size={14} stroke={2.2} />
          Copy full release
        </>
      )}
    </button>
  )
}

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "launch",
  "funding",
  "partnership",
  "milestone",
]

export function PressReleaseGenerator() {
  const [companyName, setCompanyName] = useState("")
  const [announcementType, setAnnouncementType] =
    useState<AnnouncementType>("launch")
  const [headline, setHeadline] = useState("")
  const [city, setCity] = useState("")
  const [keyDetails, setKeyDetails] = useState("")
  const [quotePerson, setQuotePerson] = useState("")
  const [quoteTitle, setQuoteTitle] = useState("")
  const [quoteText, setQuoteText] = useState("")
  const [boilerplate, setBoilerplate] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [result, setResult] = useState<PressRelease | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const release = generatePressRelease({
      companyName: companyName.trim(),
      announcementType,
      headline: headline.trim(),
      city: city.trim(),
      keyDetails: keyDetails.trim(),
      quotePerson: quotePerson.trim() || undefined,
      quoteTitle: quoteTitle.trim() || undefined,
      quoteText: quoteText.trim() || undefined,
      boilerplate: boilerplate.trim() || undefined,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      website: website.trim() || undefined,
    })

    if (!release) {
      setError(
        "Fill in your company name, headline, city, and announcement details to generate a press release."
      )
      return
    }

    setResult(release)
  }

  const hasResult = result !== null

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <ToolHero
            icon={IconNews}
            title="Press Release"
            highlight="Generator"
            description="Fill in your announcement details and get a properly formatted press release — dateline, lead paragraph, quote, boilerplate, and media contact — ready to send to journalists or post on a wire."
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Announcement type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnnouncementType(type)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                        announcementType === type
                          ? "border-[var(--color-blaze-orange)] bg-[var(--color-blaze-orange)]/10 text-(--color-princeton-orange)"
                          : "border-border/70 bg-background text-muted-foreground hover:border-border"
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="company-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Company name
                  </label>
                  <Input
                    id="company-name"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mentiohunt"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="city"
                    className="text-sm font-medium text-foreground"
                  >
                    City (dateline)
                  </label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco, Calif."
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="headline"
                  className="text-sm font-medium text-foreground"
                >
                  Headline
                </label>
                <Input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Mentiohunt Launches Automated Backlink Outreach for B2B SaaS Teams"
                  className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="key-details"
                  className="text-sm font-medium text-foreground"
                >
                  What happened
                </label>
                <Textarea
                  id="key-details"
                  value={keyDetails}
                  onChange={(e) => setKeyDetails(e.target.value)}
                  placeholder="e.g. a new platform that finds backlink opportunities, surfaces contact details, and drafts outreach automatically"
                  className="min-h-24 rounded-2xl border-border bg-card px-5 py-3 text-sm shadow-sm"
                  required
                />
                <p className="text-xs text-muted-foreground/70">
                  This becomes the lead paragraph — write it as one sentence describing the news.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="quote-person"
                    className="text-sm font-medium text-foreground"
                  >
                    Quote person{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="quote-person"
                    type="text"
                    value={quotePerson}
                    onChange={(e) => setQuotePerson(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="quote-title"
                    className="text-sm font-medium text-foreground"
                  >
                    Their title{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="quote-title"
                    type="text"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    placeholder="e.g. CEO and co-founder"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="quote-text"
                  className="text-sm font-medium text-foreground"
                >
                  Quote{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Textarea
                  id="quote-text"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="e.g. We built this because founders don't have time to manually prospect for backlinks."
                  className="min-h-20 rounded-2xl border-border bg-card px-5 py-3 text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="boilerplate"
                  className="text-sm font-medium text-foreground"
                >
                  About the company{" "}
                  <span className="text-muted-foreground/60">(optional — a standard boilerplate paragraph is generated if left blank)</span>
                </label>
                <Textarea
                  id="boilerplate"
                  value={boilerplate}
                  onChange={(e) => setBoilerplate(e.target.value)}
                  placeholder="e.g. Mentiohunt automates backlink prospecting and outreach for founder-led B2B SaaS teams..."
                  className="min-h-20 rounded-2xl border-border bg-card px-5 py-3 text-sm shadow-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Media contact{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-email"
                    className="text-sm font-medium text-foreground"
                  >
                    Contact email{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="press@company.com"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="website"
                    className="text-sm font-medium text-foreground"
                  >
                    Website{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
              >
                Generate press release
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
              {!hasResult ? (
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconNews size={20} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                      Ready when your details are.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Fill in the form to generate a formatted press release.
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
                      Press release generated.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Scroll down to review and copy it.
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
        <div className="container mx-auto max-w-4xl">
          {!hasResult ? (
            <div className="mx-auto max-w-lg rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                <IconNews size={24} stroke={2.4} />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                Your press release appears here.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Fill in the form above to generate a formatted, ready-to-send press release.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.65rem] font-semibold text-muted-foreground/60 uppercase">
                    Result
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                    Your press release
                  </h2>
                </div>
                <CopyButton text={result.text} />
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground/90">
                  {result.text}
                </pre>
              </div>

              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                This is a formatting starting point, not verified news copy — double-check every fact and figure before sending it to a journalist or a wire service. Never present unverified claims as confirmed news.
              </p>

              {/* Sign-up CTA */}
              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                <div className="relative mx-auto max-w-xl text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                    <IconLock size={23} stroke={2.5} />
                  </div>
                  <p className="mt-5 text-[0.65rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
                    Beyond the press release
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                    Find who should actually cover it.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Mentiohunt surfaces backlink opportunities, finds site owner
                    contact details, and drafts outreach automatically — so your
                    news reaches the right sites, not just a wire.
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
            eyebrow="More than one press release"
            heading="Turn your announcement into backlinks that compound."
            body="Mentiohunt finds the sites worth pitching your news to, surfaces contact details, and schedules personalized outreach — so you monitor the queue instead of cold-emailing every outlet yourself."
          />
        </div>
      </section>
    </>
  )
}
