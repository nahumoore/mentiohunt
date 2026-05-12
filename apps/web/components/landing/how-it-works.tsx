"use client"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import {
  IconArrowRight,
  IconBrandBluesky,
  IconBrandX,
  IconCheckbox,
  IconLink,
  IconMailFast,
  IconMessageCircle,
  IconRadar2,
  IconWorldSearch,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState, type ComponentType } from "react"

import { Button } from "@workspace/ui/components/button"

type Step = {
  eyebrow: string
  title: string
  description: string
  Illustration: ComponentType
}

type ActionDraft = {
  label: string
  title: string
  source: string
  icon: ComponentType<{ className?: string }>
  tone: "backlink" | "community"
  fields: { label: string; value: string }[]
  body: string
  cta: string
}

const steps: Step[] = [
  {
    eyebrow: "Setup",
    title: "Tell us where to look",
    description:
      "Add your product URL, choose the backlink opportunities you care about, and pick the social platforms or communities you want monitored.",
    Illustration: SetupIllustration,
  },
  {
    eyebrow: "Discovery",
    title: "We find matching opportunities",
    description:
      "Mentiohunt scans relevant websites and live conversations, then filters for places where your product actually fits.",
    Illustration: DiscoveryIllustration,
  },
  {
    eyebrow: "Action",
    title: "Review the next best action",
    description:
      "Open your queue to see backlink outreach drafts, suggested community replies, and plain-language context for why each opportunity matters.",
    Illustration: ActionIllustration,
  },
]

const actionDrafts: ActionDraft[] = [
  {
    label: "Backlink outreach",
    title: "Pitch this resource page",
    source: "growthhub.com/resources",
    icon: IconMailFast,
    tone: "backlink",
    fields: [
      { label: "To", value: "editor@growthhub.com" },
      { label: "Subject", value: "Suggestion for your founder tools page" },
    ],
    body: "Hi Alex, I found your founder tools resource page while researching distribution workflows. Mentiohunt could be a useful addition for teams looking for backlink and community mention opportunities.",
    cta: "Review email draft",
  },
  {
    label: "Community mention",
    title: "Reply to this Reddit thread",
    source: "r/SaaS · best ways to find mentions?",
    icon: IconBrandRedditNew,
    tone: "community",
    fields: [
      { label: "Fit", value: "Founder asking for monitoring tools" },
      { label: "Angle", value: "Mention the queue, not automation hype" },
    ],
    body: "Worth checking out Mentiohunt if you want something focused on finding relevant mentions and backlink opportunities. It gives you a queue with context and a suggested reply, so you can decide what is worth answering.",
    cta: "Review suggested reply",
  },
]

function SetupIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/12 blur-3xl" />

      <div className="relative grid grid-cols-2 gap-4">
        <SetupOptionColumn
          icon={IconLink}
          label="Backlink types"
          options={["Listicles", "Directories", "Resource pages"]}
          tone="backlink"
        />
        <SetupOptionColumn
          icon={IconRadar2}
          label="Platforms"
          options={["Reddit", "X", "Bluesky"]}
          optionIcons={[IconBrandRedditNew, IconBrandX, IconBrandBluesky]}
          tone="platform"
        />
      </div>
    </div>
  )
}

function SetupOptionColumn({
  icon: Icon,
  label,
  options,
  optionIcons,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  options: string[]
  optionIcons?: ComponentType<{ className?: string }>[]
  tone: "backlink" | "platform"
}) {
  const accent =
    tone === "backlink"
      ? "var(--color-blaze-orange)"
      : "var(--color-deep-saffron)"

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-background/70 p-4">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        }}
      />
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_10px_26px_-14px_rgba(255,84,0,0.9)]"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[0.62rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </p>
      </div>

      <div className="space-y-2.5">
        {options.map((option, index) => {
          const OptionIcon = optionIcons?.[index]

          return (
            <div
              key={option}
              className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/10">
                {OptionIcon ? (
                  <OptionIcon className="h-4.5 w-4.5" />
                ) : (
                  <IconCheckbox className="h-4.5 w-4.5 text-[var(--color-blaze-orange)]" />
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {option}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiscoveryIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-4 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-5 lg:p-4 xl:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-blaze-orange)]/10" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-blaze-orange)]/15" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] xl:items-center">
        <div className="space-y-2.5">
          <MiniOpportunity
            icon={IconWorldSearch}
            label="Resource page"
            title="Best founder tools"
            score="92"
          />
          <MiniOpportunity
            icon={IconLink}
            label="Directory"
            title="Marketing software list"
            score="87"
          />
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)] shadow-[0_10px_35px_-18px_rgba(255,84,0,0.8)]">
          <IconRadar2 className="h-6 w-6" />
        </div>

        <div className="space-y-2.5">
          <MiniOpportunity
            icon={IconBrandRedditNew}
            label="Reddit thread"
            title="How do you find mentions?"
            score="89"
          />
          <MiniOpportunity
            icon={IconMessageCircle}
            label="Forum post"
            title="Looking for outreach tools"
            score="84"
          />
        </div>
      </div>
    </div>
  )
}

function MiniOpportunity({
  icon: Icon,
  label,
  title,
  score,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  title: string
  score: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/75 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="truncate text-[0.72rem] font-semibold text-foreground">
            {title}
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-blaze-orange)]/10 px-2 py-1 text-[0.68rem] font-bold text-[var(--color-blaze-orange)] tabular-nums">
          {score}
        </span>
      </div>
    </div>
  )
}

function ActionIllustration() {
  const [activeDraft, setActiveDraft] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveDraft((current) => (current + 1) % actionDrafts.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  const draft = actionDrafts[activeDraft]!

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[var(--color-amber-flame)]/12 blur-3xl" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl" />

      <div className="relative min-h-[330px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={draft.label}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.42, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute inset-0"
          >
            <ActionDraftCard draft={draft} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ActionDraftCard({ draft }: { draft: ActionDraft }) {
  const Icon = draft.icon
  const isBacklink = draft.tone === "backlink"

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-border bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/60 to-transparent" />

      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_26px_-14px_rgba(255,84,0,0.9)] ${
            isBacklink
              ? "bg-[var(--color-blaze-orange)] text-white"
              : "bg-white text-foreground"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {draft.label}
          </p>
          <h4 className="mt-1 font-heading text-xl font-semibold tracking-tight text-foreground">
            {draft.title}
          </h4>
          <p className="mt-1 truncate text-xs font-medium text-[var(--color-blaze-orange)]">
            {draft.source}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-3">
        {draft.fields.map((field) => (
          <div key={field.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <span className="text-[0.58rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              {field.label}
            </span>
            <span className="truncate text-xs font-semibold text-foreground">
              {field.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-4">
        <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
          {draft.body}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[0.72rem] font-bold text-[var(--color-blaze-orange)]">
        {draft.cta}
        <IconArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-0.5" />
      </div>
    </div>
  )
}

function StepRow({ step }: { step: Step }) {
  const Illustration = step.Illustration

  return (
    <article className="grid gap-8 border-t border-border/70 py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div>
        <p className="mb-4 text-[0.7rem] font-bold tracking-[0.18em] text-[var(--color-blaze-orange)] uppercase">
          {step.eyebrow}
        </p>
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {step.title}
        </h3>
        <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground">
          {step.description}
        </p>
      </div>

      <div className="relative">
        <Illustration />
      </div>
    </article>
  )
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-24 -left-32 h-[420px] w-[420px] rounded-full bg-[var(--color-princeton-orange)]/7 blur-[100px]" />
        <div className="absolute -right-32 bottom-20 h-[360px] w-[360px] rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-[var(--color-blaze-orange)] uppercase">
            How it works
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            One simple flow for backlinks and community mentions
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Set your targeting once. Mentiohunt turns it into a daily queue of
            relevant opportunities and ready-to-review actions.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          {steps.map((step) => (
            <StepRow key={step.title} step={step} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="group rounded-full px-8 shadow-sm shadow-primary/20"
          >
            <Link href="/signup">
              Start discovering opportunities
              <IconArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
