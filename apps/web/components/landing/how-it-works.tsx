"use client"

import {
  IconArrowRight,
  IconBellRinging,
  IconLink,
  IconMailFast,
  IconMessagePlus,
  IconMessages,
  IconRadar2,
  IconUserSearch,
  IconWorldSearch,
} from "@tabler/icons-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

type Step = {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

type FeatureVariant = "backlink" | "community"

const variantClasses: Record<
  FeatureVariant,
  {
    badge: string
    dot: string
    headerGradient: string
    iconBg: string
    stepNum: string
    connector: string
  }
> = {
  backlink: {
    badge:
      "border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]",
    dot: "bg-[var(--color-blaze-orange)]",
    headerGradient:
      "from-[var(--color-blaze-orange)]/[0.06] via-[var(--color-blaze-orange)]/[0.03]",
    iconBg:
      "bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]",
    stepNum: "text-[var(--color-blaze-orange)]",
    connector: "via-[var(--color-blaze-orange)]/20",
  },
  community: {
    badge:
      "border-[var(--color-deep-saffron)]/25 bg-[var(--color-deep-saffron)]/10 text-[var(--color-deep-saffron)]",
    dot: "bg-[var(--color-deep-saffron)]",
    headerGradient:
      "from-[var(--color-deep-saffron)]/[0.06] via-[var(--color-deep-saffron)]/[0.03]",
    iconBg:
      "bg-[var(--color-deep-saffron)]/10 text-[var(--color-deep-saffron)]",
    stepNum: "text-[var(--color-deep-saffron)]",
    connector: "via-[var(--color-deep-saffron)]/20",
  },
}

const backlinkSteps: Step[] = [
  {
    number: "01",
    icon: IconLink,
    title: "Add your sitemap or articles",
    description:
      "Drop your sitemap URL or paste article links. We index your content and check for new posts every day automatically.",
  },
  {
    number: "02",
    icon: IconWorldSearch,
    title: "We find where your content fits",
    description:
      "Each article gets matched to resource pages, listicles, and directories already linking to similar content.",
  },
  {
    number: "03",
    icon: IconUserSearch,
    title: "We surface the right contact",
    description:
      "For each opportunity we identify the site owner or editor and surface their verified contact details.",
  },
  {
    number: "04",
    icon: IconMailFast,
    title: "Copy the draft and send",
    description:
      "A personalized pitch lands in your queue with the recipient's email address. Copy, tweak if needed, send.",
  },
]

const communitySteps: Step[] = [
  {
    number: "01",
    icon: IconRadar2,
    title: "Set your communities and keywords",
    description:
      "Tell us your niche, target keywords, and which communities to watch — Reddit, forums, and more.",
  },
  {
    number: "02",
    icon: IconMessages,
    title: "We detect relevant conversations",
    description:
      "When a post matches your product's fit, we score it and surface it with context on why it's a good match.",
  },
  {
    number: "03",
    icon: IconMessagePlus,
    title: "Get a suggested reply",
    description:
      "Each flagged post comes with a draft reply that naturally mentions your product without being pushy.",
  },
  {
    number: "04",
    icon: IconBellRinging,
    title: "Instant email alerts",
    description:
      "Get notified the moment a high-fit conversation appears so you can jump in while the thread is hot.",
  },
]

function StepCard({
  step,
  variant,
}: {
  step: Step
  variant: FeatureVariant
}) {
  const Icon = step.icon
  const classes = variantClasses[variant]
  return (
    <div className="group relative flex flex-col">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:-translate-y-0.5 ${classes.iconBg}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p
        className={`mt-4 text-[0.62rem] font-bold tracking-[0.16em] uppercase ${classes.stepNum}`}
      >
        Step {step.number}
      </p>
      <h4 className="mt-1.5 font-heading text-[0.95rem] font-semibold leading-snug tracking-tight text-foreground">
        {step.title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {step.description}
      </p>
    </div>
  )
}

function FeatureBlock({
  badge,
  tagline,
  subtitle,
  steps,
  variant,
}: {
  badge: string
  tagline: string
  subtitle: string
  steps: Step[]
  variant: FeatureVariant
}) {
  const classes = variantClasses[variant]
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div
        className={`border-b border-border bg-gradient-to-br ${classes.headerGradient} to-transparent px-6 py-6 sm:px-8 sm:py-7`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase ${classes.badge}`}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${classes.dot}`}
            />
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${classes.dot}`}
            />
          </span>
          {badge}
        </span>
        <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {tagline}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative p-6 sm:p-8">
        <div
          className={`pointer-events-none absolute left-8 right-8 hidden h-px bg-gradient-to-r from-transparent ${classes.connector} to-transparent lg:block`}
          style={{ top: "calc(2rem + 22px)" }}
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} variant={variant} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            Two engines, one distribution pipeline
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Mentiohunt runs both in parallel so you capture every backlink
            opportunity and community conversation without lifting a finger.
          </p>
        </div>

        <div className="mt-14 space-y-5">
          <FeatureBlock
            badge="Backlink Building"
            tagline="Turn your articles into outreach opportunities"
            subtitle="Auto-refreshes daily. No manual prospecting."
            steps={backlinkSteps}
            variant="backlink"
          />
          <FeatureBlock
            badge="Community Monitoring"
            tagline="Never miss a relevant conversation"
            subtitle="Real-time alerts with suggested replies ready to go."
            steps={communitySteps}
            variant="community"
          />
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
