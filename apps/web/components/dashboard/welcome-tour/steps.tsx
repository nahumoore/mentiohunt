import {
  IconAlertTriangle,
  IconCircleCheck,
  IconFiles,
  IconInfoCircle,
  IconLinkOff,
  IconMailBolt,
  IconMailCheck,
  IconRadar2,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import type { ElementType, ReactNode } from "react"

import { getContactAvatarUrl } from "@/consts/contact-avatar"
import { useOutreachState } from "@/hooks/use-outreach-state"

export type TourStepId =
  | "welcome"
  | "prospects"
  | "pages"
  | "email"
  | "tracker"

export type TourStep = {
  id: TourStepId
  eyebrow: string
  Icon: ElementType
  headline: string
  body: string
  /** Small non-interactive UI mock illustrating the feature. */
  mock: ReactNode
}

/**
 * Welcome: a real Google Search Console screenshot from one of our users,
 * taken not long after they started with Mentiohunt (same asset as the
 * landing page's proof section) — a browser-chrome card matching
 * components/landing/founder-intro.tsx's treatment, with a caption for
 * context since the tour shows it without the landing page's narrative.
 */
function GscProofMock() {
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <div className="size-2 rounded-full bg-red-400" />
          <div className="size-2 rounded-full bg-yellow-400" />
          <div className="size-2 rounded-full bg-green-400" />
          <span className="ml-2 text-[0.65rem] text-muted-foreground">
            Google Search Console
          </span>
        </div>
        <Image
          src="/landing/gsc-proof.webp"
          alt="Google Search Console — 222K impressions, growing organic traffic"
          width={920}
          height={356}
          className="w-full"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        One of our users, 3 months into building backlinks with Mentiohunt.
      </p>
    </div>
  )
}

const PROSPECT_SEQUENCE = [
  { label: "First outreach", status: "sent" as const, when: "Sent 2h ago" },
  { label: "Follow-up", status: "scheduled" as const, when: "In 3 days" },
  { label: "Final follow-up", status: "scheduled" as const, when: "In 6 days" },
]

/**
 * Prospects: a fake opportunity card matching the real one's field vocabulary
 * (see components/link-building/prospects/prospect-card.tsx — tier/fit/DR
 * badges, contact readiness, source page) plus a compact 3-email sequence
 * nav modeled on components/prospects/email-sequence-nav.tsx, showing we're
 * on the first email with the follow-ups already scheduled.
 */
function ProspectsMock() {
  return (
    <div className="rounded-2xl border border-l-4 border-border border-l-emerald-500 bg-card p-4 shadow-sm">
      {/* badges row */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          Resource page
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
          <IconSend className="size-3" />
          Contacted
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 tabular-nums">
            fit 82/100
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
            DR 54
          </span>
        </div>
      </div>

      {/* domain + contact */}
      <div className="mt-3 flex items-center gap-2.5">
        <span className="size-8 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getContactAvatarUrl("growthblog.io")}
            alt=""
            width={32}
            height={32}
            className="size-8"
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            growthblog.io
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconMailCheck className="size-3 shrink-0 text-emerald-500/70" />
            Jordan Reyes · jordan@growthblog.io
          </p>
        </div>
      </div>

      {/* 3-email sequence — dot centers sit at 1/6, 1/2, 5/6 of the row, so
          the connecting rail (and its sent-segment overlay) are positioned
          with matching fixed insets rather than tied to each dot's edge. */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="relative grid grid-cols-3">
          <div className="absolute inset-x-[16.6667%] top-1/2 h-px -translate-y-1/2 bg-border" />
          <div className="absolute left-[16.6667%] top-1/2 h-px w-1/3 -translate-y-1/2 bg-(--color-blaze-orange)/50" />
          {PROSPECT_SEQUENCE.map((step) => {
            const isSent = step.status === "sent"

            return (
              <div key={step.label} className="relative z-10 flex justify-center">
                <span
                  className={
                    isSent
                      ? "flex size-3.5 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)"
                      : "size-3.5 shrink-0 rounded-full border-[1.5px] border-border bg-card"
                  }
                >
                  {isSent && <IconCircleCheck className="size-3.5 text-white" />}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-1.5 grid grid-cols-3 text-center">
          {PROSPECT_SEQUENCE.map((step, i) => {
            const isSent = step.status === "sent"

            return (
              <div key={step.label}>
                <p
                  className={
                    isSent
                      ? "text-[10px] font-bold tracking-[0.1em] text-(--color-blaze-orange) uppercase"
                      : "text-[10px] font-bold tracking-[0.1em] text-muted-foreground/50 uppercase"
                  }
                >
                  Email {i + 1}
                </p>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  {step.when}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Pages: two rows matching pages-client's article list shape. */
function PagesMock() {
  const rows = [
    { url: "/blog/link-building-guide", matches: 18 },
    { url: "/free-tools/backlink-checker", matches: 24 },
    { url: "/blog/seo-outreach-templates", matches: 9 },
  ]

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.url}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/8 text-(--color-blaze-orange)">
              <IconFiles className="size-4" />
            </span>
            <p className="truncate text-sm font-medium text-foreground">
              {row.url}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {row.matches} matches
          </span>
        </div>
      ))}
    </div>
  )
}

const READ_INBOX_ROWS = [
  { sender: "Notion", snippet: "Your weekly digest is ready", when: "Yesterday" },
  { sender: "Linear", snippet: "3 issues assigned to you", when: "2d ago" },
]

/**
 * Email accounts: the reply simulated as an inbox, not a custom alert card —
 * a browser-chrome card (same treatment as the GSC proof mock) showing the
 * reply as the top unread row in the user's own inbox, above a couple of
 * ordinary read emails for context. Status pill below uses the user's *real*
 * outreach status (same derivation as the header "How it works" explainer,
 * via useOutreachState).
 */
function EmailMock() {
  const outreachState = useOutreachState()

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <div className="size-2 rounded-full bg-red-400" />
          <div className="size-2 rounded-full bg-yellow-400" />
          <div className="size-2 rounded-full bg-green-400" />
          <span className="ml-2 text-[0.65rem] text-muted-foreground">
            Gmail — you@yourcompany.com
          </span>
        </div>

        <div className="divide-y divide-border">
          {/* unread reply */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span className="size-7 shrink-0 overflow-hidden rounded-full border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getContactAvatarUrl("growthblog.io")}
                alt=""
                width={28}
                height={28}
                className="size-7"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                Jordan Reyes
              </p>
              <p className="truncate text-xs text-foreground">
                <span className="font-medium">Re: Link building guide</span>
                <span className="text-muted-foreground">
                  {" "}
                  — Hey, happy to link to that, can you send over...
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[11px] font-medium text-(--color-blaze-orange)">
                2m ago
              </span>
              <span className="size-2 shrink-0 rounded-full bg-(--color-blaze-orange)" />
            </div>
          </div>

          {/* older, already-read emails for context */}
          {READ_INBOX_ROWS.map((row) => (
            <div
              key={row.sender}
              className="flex items-center gap-3 px-3 py-2.5 opacity-60"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {row.sender[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {row.sender}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.snippet}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {row.when}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={
          outreachState === "live"
            ? "inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
            : outreachState === "mailbox_paused"
              ? "inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
              : "inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600"
        }
      >
        {outreachState === "live" && (
          <>
            <IconCircleCheck className="size-3.5 shrink-0" />
            Outreach is live — emails are already going out automatically.
          </>
        )}
        {outreachState === "account_paused" && (
          <>
            <IconAlertTriangle className="size-3.5 shrink-0" />
            You paused outreach — resume it anytime from Settings.
          </>
        )}
        {outreachState === "mailbox_paused" && (
          <>
            <IconInfoCircle className="size-3.5 shrink-0" />
            You can connect your account in the Email Accounts page.
          </>
        )}
        {outreachState === "pool_paused" && (
          <>
            <IconAlertTriangle className="size-3.5 shrink-0" />
            Today&apos;s shared pool limit is reached — sending resumes
            automatically tomorrow.{" "}
            <Link
              href="/dashboard/billing"
              className="underline underline-offset-2 hover:text-amber-700"
            >
              Upgrade to send sooner
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

const TRACKER_ROWS = [
  {
    domain: "growthblog.io",
    title: "growthblog.io/resources",
    url: "https://growthblog.io/resources",
    status: "live" as const,
  },
  {
    domain: "indiehackers.co",
    title: "indiehackers.co/tools",
    url: "https://indiehackers.co/tools",
    status: "removed" as const,
  },
]

/** Link tracker: two rows matching link-status-chip.tsx's color scheme. */
function TrackerMock() {
  return (
    <div className="space-y-2">
      {TRACKER_ROWS.map((row) => (
        <div
          key={row.domain}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl(row.domain)}
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0 rounded-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.url}
              </p>
            </div>
          </div>
          {row.status === "live" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-[11px] font-semibold text-green-600">
              <IconCircleCheck className="size-3" />
              Live
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-600">
              <IconLinkOff className="size-3" />
              Removed · 3d ago
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    eyebrow: "Welcome",
    Icon: IconSparkles,
    headline: "Welcome to Mentiohunt",
    body: "Your link building is already running. The moment you finished onboarding, we started finding sites for your pages. Backlinks compound — here's what real organic growth looks like once they land.",
    mock: <GscProofMock />,
  },
  {
    id: "prospects",
    eyebrow: "Prospects",
    Icon: IconSparkles,
    headline: "Prospects find themselves",
    body: "Every day we scan the web for sites where your content fits, find the founder or owner's contact, and send a personalized email automatically — no approval step on your end, but you can pause the campaign if needed.",
    mock: <ProspectsMock />,
  },
  {
    id: "pages",
    eyebrow: "Pages",
    Icon: IconFiles,
    headline: "Your pages drive the matching",
    body: "We're already tracking the pages you added and auto-fetch them daily to catch any changes. Add more anytime — the more pages you connect, the more opportunities we can match.",
    mock: <PagesMock />,
  },
  {
    id: "email",
    eyebrow: "Email Accounts",
    Icon: IconMailBolt,
    headline: "We'll alert you when they reply",
    body: "Outreach sends automatically until a prospect replies. The moment they do, we alert you — and you continue the conversation yourself, from your own connected email account.",
    mock: <EmailMock />,
  },
  {
    id: "tracker",
    eyebrow: "Link Tracker",
    Icon: IconRadar2,
    headline: "We watch your links after placement",
    body: "Once a backlink goes live, we check on it daily and flag it if it ever goes nofollow, changes target, or gets removed.",
    mock: <TrackerMock />,
  },
]
