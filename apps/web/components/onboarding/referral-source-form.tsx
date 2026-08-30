"use client"

import {
  IconArrowRight,
  IconArticle,
  IconCheck,
  IconDotsCircleHorizontal,
  IconLoader2,
  IconMail,
  IconMicrophone,
  IconUsers,
  type IconProps,
} from "@tabler/icons-react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"
import { useState, type ComponentType } from "react"

import { saveReferralSource } from "@/actions/save-referral-source"
import {
  REFERRAL_SOURCE_OPTIONS,
  type ReferralSourceId,
} from "@/consts/onboarding"
import { captureEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"

/** Options with no real domain get a Tabler glyph instead of a favicon. */
const FALLBACK_ICONS: Partial<
  Record<ReferralSourceId, ComponentType<IconProps>>
> = {
  newsletter: IconMail,
  podcast: IconMicrophone,
  friend: IconUsers,
  blog: IconArticle,
  other: IconDotsCircleHorizontal,
}

/** Makes the follow-up feel like a real question rather than a generic field. */
const DETAIL_PLACEHOLDERS: Partial<Record<ReferralSourceId, string>> = {
  google: "Which search got you here?",
  chatgpt: "What did you ask it?",
  x: "Whose post was it?",
  reddit: "Which subreddit or thread?",
  linkedin: "Whose post was it?",
  youtube: "Which channel or video?",
  product_hunt: "Which launch or collection?",
  indie_hackers: "Which thread?",
  hacker_news: "Which thread?",
  newsletter: "Which newsletter?",
  podcast: "Which show or episode?",
  friend: "Who should we thank?",
  blog: "Which site or article?",
  other: "Tell us where",
}

export function ReferralSourceForm() {
  const router = useRouter()
  const [source, setSource] = useState<ReferralSourceId | null>(null)
  const [detail, setDetail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!source || isSubmitting) return

    setIsSubmitting(true)
    setError("")

    const trimmedDetail = detail.trim()
    const result = await saveReferralSource({
      referralSource: source,
      referralDetail: trimmedDetail,
    })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    captureEvent(EVENTS.REFERRAL_SOURCE_SUBMITTED, {
      source,
      has_detail: trimmedDetail.length > 0,
    })
    router.replace("/dashboard/prospects")
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {REFERRAL_SOURCE_OPTIONS.map((option, index) => {
          const isSelected = source === option.id
          const FallbackIcon = FALLBACK_ICONS[option.id]

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSource(option.id)}
              aria-pressed={isSelected}
              style={{ animationDelay: `${index * 22}ms` }}
              className={cn(
                "group relative flex animate-in items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ease-out fill-mode-backwards fade-in-0 slide-in-from-bottom-1",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blaze-orange)/50",
                isSelected
                  ? "border-(--color-blaze-orange) bg-(--color-blaze-orange)/6 shadow-sm"
                  : "border-border bg-white hover:border-(--color-blaze-orange)/40"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isSelected
                    ? "border-(--color-blaze-orange)/30 bg-white"
                    : "border-border/60 bg-muted/40"
                )}
              >
                {option.domain ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${option.domain}&sz=64`}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-sm"
                    loading="lazy"
                  />
                ) : FallbackIcon ? (
                  <FallbackIcon
                    size={16}
                    className={cn(
                      isSelected
                        ? "text-(--color-blaze-orange)"
                        : "text-muted-foreground"
                    )}
                  />
                ) : null}
              </span>

              <span
                className={cn(
                  "font-ui truncate text-[13px] font-medium",
                  isSelected ? "text-(--color-pumpkin-spice)" : "text-foreground/85"
                )}
              >
                {option.label}
              </span>

              {isSelected && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-(--color-blaze-orange) text-white">
                  <IconCheck size={11} stroke={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {source && (
        <div className="mt-5 animate-in fade-in-0 slide-in-from-top-1">
          <label
            htmlFor="referral-detail"
            className="font-ui text-[13px] font-medium text-foreground"
          >
            Anywhere specific?{" "}
            <span className="font-normal text-muted-foreground">Optional.</span>
          </label>
          <Input
            id="referral-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={DETAIL_PLACEHOLDERS[source] ?? "Tell us where"}
            className="mt-2 h-11 rounded-xl"
            maxLength={140}
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!source || isSubmitting}
        className={cn(
          "font-ui mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-150 ease-out",
          "bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot)",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blaze-orange)/50 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        )}
      >
        {isSubmitting ? (
          <>
            <IconLoader2 size={16} className="animate-spin" />
            Saving
          </>
        ) : (
          <>
            Continue to your prospects
            <IconArrowRight size={16} stroke={2} />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        One question, then we&apos;re out of your way.
      </p>
    </div>
  )
}
