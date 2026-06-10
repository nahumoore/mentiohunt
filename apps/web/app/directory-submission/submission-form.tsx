"use client"

import { useState, type FormEvent } from "react"
import { IconLoader2 } from "@tabler/icons-react"

import { IconCircleCheck } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

type SubmissionSummary = {
  directoryName: string
  directoryUrl: string
  contactEmail: string
}

const fieldClassName =
  "h-12 rounded-[1.1rem] border border-border bg-background/85 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

const textareaClassName =
  "min-h-32 w-full rounded-[1.1rem] border border-border bg-background/85 px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

const selectClassName =
  "h-12 w-full rounded-[1.1rem] border border-border bg-background/85 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

const checklist = [
  "The directory is active and publicly reachable.",
  "Founders can understand the listing value without a sales call.",
  "The submission page is live or clearly documented.",
  "A Mentiohunt audience would reasonably benefit from seeing it.",
]

export function DirectorySubmissionForm() {
  const [submitted, setSubmitted] = useState<SubmissionSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const payload = {
      directoryName: String(formData.get("directoryName") ?? ""),
      directoryUrl: String(formData.get("directoryUrl") ?? ""),
      submissionUrl: String(formData.get("submissionUrl") ?? ""),
      category: String(formData.get("category") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      pricingModel: String(formData.get("pricingModel") ?? ""),
      primaryAudience: String(formData.get("primaryAudience") ?? ""),
      description: String(formData.get("description") ?? ""),
      whySubmit: String(formData.get("whySubmit") ?? ""),
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/directory-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setError("Something went wrong. Please try again.")
        return
      }

      setSubmitted({
        directoryName: payload.directoryName,
        directoryUrl: payload.directoryUrl,
        contactEmail: payload.contactEmail,
      })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/22 bg-[linear-gradient(150deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_74%,var(--color-amber-glow)_26%)_100%)] p-6 shadow-[0_30px_100px_-46px_rgba(255,133,0,0.42)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />

        <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-[var(--color-blaze-orange)]/12 text-[var(--color-princeton-orange)]">
          <IconCircleCheck size={28} stroke={2.2} />
        </div>

        <p className="mt-6 text-[0.72rem] font-bold text-[var(--color-princeton-orange)] uppercase">
          Submission received
        </p>
        <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
          {submitted.directoryName} is staged for review.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          We&apos;ll be in touch at {submitted.contactEmail} if your directory is
          a strong fit.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-border/70 bg-background/82 p-5">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase">
              Directory URL
            </p>
            <p className="mt-2 text-sm font-medium break-all text-foreground">
              {submitted.directoryUrl}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border/70 bg-background/82 p-5">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase">
              Contact email
            </p>
            <p className="mt-2 text-sm font-medium break-all text-foreground">
              {submitted.contactEmail}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="button"
            size="lg"
            onClick={() => setSubmitted(null)}
            className="h-11 rounded-full px-6 shadow-md shadow-primary/25"
          >
            Submit another directory
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      id="directory-submission-form"
      className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/18 bg-[linear-gradient(180deg,var(--color-card)_0%,color-mix(in_oklab,var(--color-card)_90%,var(--color-amber-glow)_10%)_100%)] p-6 shadow-[0_32px_100px_-48px_rgba(255,133,0,0.34)] sm:p-8 lg:p-10"
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />

      <div className="grid gap-2 sm:grid-cols-2">
        {checklist.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <IconCircleCheck
              size={16}
              stroke={2.2}
              className="mt-0.5 shrink-0 text-[var(--color-princeton-orange)]"
            />
            <p className="text-sm leading-6 text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 h-px bg-border/60" />

      <form className="mt-8" onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="directoryName">Directory name</FieldLabel>
              <Input
                id="directoryName"
                name="directoryName"
                placeholder="Founder Launchboard"
                required
                className={fieldClassName}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Directory category</FieldLabel>
              <select
                id="category"
                name="category"
                defaultValue=""
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option>Startup directory</option>
                <option>SaaS directory</option>
                <option>Founder community</option>
                <option>Newsletter listing</option>
                <option>Launch platform</option>
                <option>Niche directory</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="directoryUrl">Directory URL</FieldLabel>
              <Input
                id="directoryUrl"
                name="directoryUrl"
                type="url"
                placeholder="https://directory.com"
                required
                className={fieldClassName}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="submissionUrl">Submission URL</FieldLabel>
              <Input
                id="submissionUrl"
                name="submissionUrl"
                type="url"
                placeholder="https://directory.com/submit"
                required
                className={fieldClassName}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contactName">Contact name</FieldLabel>
              <Input
                id="contactName"
                name="contactName"
                placeholder="Nico"
                required
                className={fieldClassName}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contactEmail">Contact email</FieldLabel>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="you@directory.com"
                required
                className={fieldClassName}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pricingModel">Pricing model</FieldLabel>
              <select
                id="pricingModel"
                name="pricingModel"
                defaultValue=""
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Select pricing
                </option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="freemium">Freemium</option>
                <option value="not_sure">Not sure</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="primaryAudience">
                Primary audience
              </FieldLabel>
              <Input
                id="primaryAudience"
                name="primaryAudience"
                placeholder="Bootstrapped SaaS founders"
                required
                className={fieldClassName}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="description">Directory description</FieldLabel>
            <textarea
              id="description"
              name="description"
              placeholder="Describe what the directory helps founders achieve, what kind of products belong there, and why the listing matters."
              required
              className={textareaClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="whySubmit">
              Why founders should submit
            </FieldLabel>
            <textarea
              id="whySubmit"
              name="whySubmit"
              placeholder="Explain the upside: visibility, referral traffic, community trust, launch exposure, lead generation, or niche discovery."
              required
              className={textareaClassName}
            />
          </Field>

          <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/72 p-5">
            <label className="flex items-start gap-3 text-sm leading-6 text-foreground">
              <input
                type="checkbox"
                name="ownerConfirmation"
                required
                className="mt-1 size-4 rounded border-border text-primary"
              />
              <span>I own, operate, or represent this directory.</span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-foreground">
              <input
                type="checkbox"
                name="submissionConfirmation"
                required
                className="mt-1 size-4 rounded border-border text-primary"
              />
              <span>
                The submission page is active and available to founders.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-foreground">
              <input
                type="checkbox"
                name="reviewConfirmation"
                required
                className="mt-1 size-4 rounded border-border text-primary"
              />
              <span>
                I understand Mentiohunt may review the directory before any
                inclusion or backlink placement.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
            >
              {loading ? (
                <IconLoader2 size={16} stroke={2.2} className="animate-spin" />
              ) : (
                "Submit for review"
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  )
}
