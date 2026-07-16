"use client"

import { IconCircleCheck, IconSpeakerphone } from "@tabler/icons-react"
import { useState } from "react"

import { FREE_TRIAL_DAYS } from "@/consts/billing"

type SubmitState = "idle" | "submitting" | "submitted"

export function TestimonialExtensionCard() {
  const [testimonialUrl, setTestimonialUrl] = useState("")
  const [state, setState] = useState<SubmitState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (state === "submitting" || state === "submitted") return

    setErrorMessage(null)
    setState("submitting")

    try {
      const res = await fetch("/api/trial-extension-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonialUrl: testimonialUrl.trim() }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        setErrorMessage(
          data?.error ?? "Something went wrong. Please try again."
        )
        setState("idle")
        return
      }

      setState("submitted")
    } catch {
      setErrorMessage("Something went wrong. Please try again.")
      setState("idle")
    }
  }

  if (state === "submitted") {
    return (
      <div className="rounded-2xl border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/5 p-5">
        <div className="flex items-start gap-3">
          <IconCircleCheck
            size={20}
            className="mt-0.5 shrink-0 text-(--color-blaze-orange)"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Request submitted
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We review requests within 1 business day. If your post checks
              out, we&apos;ll add {FREE_TRIAL_DAYS} days to your trial and let
              you know by email.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
          <IconSpeakerphone
            size={18}
            className="text-(--color-blaze-orange)"
          />
        </span>
        <div>
          <p className="font-heading text-base font-semibold text-foreground">
            Not done yet? Get {FREE_TRIAL_DAYS} more days free.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Share what you think of Mentiohunt in a public post on X or
            LinkedIn, paste the link below, and we&apos;ll review it and extend
            your trial by {FREE_TRIAL_DAYS} days.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          required
          value={testimonialUrl}
          onChange={(event) => setTestimonialUrl(event.target.value)}
          placeholder="https://x.com/you/status/…"
          className="font-ui h-10 w-full flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-(--color-blaze-orange)/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="font-ui inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange) px-5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-(--color-crimson-carrot) active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Submitting…" : "Submit for review"}
        </button>
      </form>

      {errorMessage && (
        <p className="mt-2 text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}
