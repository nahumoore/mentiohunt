"use client"

import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion"
import {
  IconArrowRight,
  IconFileText,
  IconLink,
  IconMailFast,
  IconRadar2,
  IconWorldSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import { useRef, useState, type ComponentType } from "react"

import { Button } from "@workspace/ui/components/button"

type Step = {
  eyebrow: string
  title: string
  description: string
  Illustration: ComponentType
}

const steps: Step[] = [
  {
    eyebrow: "Setup",
    title: "Tell us where to look",
    description:
      "Add your product URL and we crawl your entire site — every page. We learn what you do, what you already rank for, and map out the opportunities worth targeting.",
    Illustration: SetupIllustration,
  },
  {
    eyebrow: "Discovery",
    title: "We find matching opportunities",
    description:
      "Every day we surface new placements for your pages — searching Google, digging into competitor backlink profiles, and scanning relevant directories and resource pages.",
    Illustration: DiscoveryIllustration,
  },
  {
    eyebrow: "Enrichment",
    title: "We enrich each opportunity",
    description:
      "For every fit we find, we add the prospect's name, bio, and role — plus a 100% verified email — so you have everything you need before sending a single word.",
    Illustration: EnrichmentIllustration,
  },
  {
    eyebrow: "Action",
    title: "Accept the backlink or pass",
    description:
      "Each opportunity comes with a ready-to-send email draft. Approve in one click — Mentiohunt handles the contact, the send, and the follow-up.",
    Illustration: ActionIllustration,
  },
]

// ─── Illustrations ────────────────────────────────────────────────────────────

function SetupIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl" />
      <div className="relative space-y-5">
        <div className="space-y-2">
          <p className="text-[0.62rem] font-bold text-black/40 uppercase">Your product domain</p>
          <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-orange-50/60 px-4 py-3.5 ring-1 ring-[var(--color-blaze-orange)]/10">
            <IconWorldSearch className="h-4 w-4 shrink-0 text-black/25" />
            <span className="flex-1 text-sm font-semibold text-black/80">yourproduct.com</span>
            <span className="rounded-full bg-[var(--color-blaze-orange)]/10 px-2.5 py-1 text-[0.6rem] font-bold text-[var(--color-blaze-orange)] uppercase">Ready</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-black/6 bg-gray-50 p-3">
            <p className="text-[0.55rem] font-bold text-black/40 uppercase">Pages scanned</p>
            <p className="mt-1 text-xl font-bold text-black/80">47</p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-gray-50 p-3">
            <p className="text-[0.55rem] font-bold text-black/40 uppercase">Topics found</p>
            <p className="mt-1 text-xl font-bold text-black/80">12</p>
          </div>
        </div>
        <div className="rounded-2xl border border-black/6 bg-gray-50 p-3.5">
          <p className="mb-2 text-[0.55rem] font-bold text-black/40 uppercase">Detected keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {["link building", "backlink outreach", "SEO for SaaS", "founder tools"].map((kw) => (
              <span key={kw} className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-black/70">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DiscoveryIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/50 to-transparent" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-blaze-orange)]/10" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-blaze-orange)]/15" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] xl:items-center">
        <div className="space-y-2.5">
          <MiniOpportunity icon={IconWorldSearch} label="Resource page" title="Best founder tools" score="92" />
          <MiniOpportunity icon={IconLink} label="Directory" title="Marketing software list" score="87" />
        </div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-blaze-orange)] shadow-[0_10px_35px_-18px_rgba(255,84,0,0.5)]">
          <IconRadar2 className="h-6 w-6" />
        </div>
        <div className="space-y-2.5">
          <MiniOpportunity icon={IconFileText} label="Comparison article" title="Ahrefs vs alternatives" score="89" />
          <MiniOpportunity icon={IconFileText} label="Round-up post" title="Top outreach tools 2025" score="84" />
        </div>
      </div>
    </div>
  )
}

function MiniOpportunity({ icon: Icon, label, title, score }: { icon: ComponentType<{ className?: string }>; label: string; title: string; score: string }) {
  return (
    <div className="rounded-2xl border border-black/6 bg-gray-50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] font-bold text-black/40 uppercase">{label}</p>
          <p className="truncate text-[0.72rem] font-semibold text-black/80">{title}</p>
        </div>
        <span className="rounded-full bg-[var(--color-blaze-orange)]/10 px-2 py-1 text-[0.68rem] font-bold text-[var(--color-blaze-orange)] tabular-nums">{score}</span>
      </div>
    </div>
  )
}

function EnrichmentIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="relative rounded-3xl border border-black/6 bg-gray-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
            <IconWorldSearch className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.58rem] font-bold text-black/40 uppercase">Opportunity found</p>
            <h4 className="mt-1 text-base font-semibold text-black/80">Founder tools resource page</h4>
            <p className="mt-1 text-xs text-black/50">Good fit for backlink outreach</p>
          </div>
          <span className="rounded-full bg-[var(--color-blaze-orange)]/10 px-2.5 py-1 text-[0.68rem] font-bold text-[var(--color-blaze-orange)]">92</span>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <div className="rounded-[1.35rem] border border-[var(--color-blaze-orange)]/15 bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
                  <IconMailFast className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[0.55rem] font-bold text-black/40 uppercase">Verified email</p>
                  <p className="mt-0.5 text-xs font-semibold text-black/70">Contact ready for outreach</p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-blaze-orange)]/10 px-2 py-1 text-[0.58rem] font-bold text-[var(--color-blaze-orange)] uppercase">Verified</span>
            </div>
            <div className="mt-3 rounded-2xl border border-black/6 bg-gray-50 px-3 py-3">
              <p className="break-all text-sm font-semibold text-black/80">editor@growthhub.com</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <EnrichmentField icon={IconLink} label="Angle" value="Useful for founder distribution lists" />
            <EnrichmentField icon={IconFileText} label="Context" value="Recently updated resource page" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EnrichmentField({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/6 bg-white p-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] font-bold text-black/40 uppercase">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-black/70">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ActionIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="relative overflow-hidden rounded-3xl border border-black/6 bg-gray-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-[0_10px_26px_-14px_rgba(255,84,0,0.6)]">
            <IconMailFast className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-bold text-black/40 uppercase">Backlink outreach</p>
            <h4 className="mt-1 font-heading text-xl font-semibold tracking-tight text-black/80">Pitch this resource page</h4>
            <p className="mt-1 truncate text-xs font-medium text-[var(--color-blaze-orange)]">growthhub.com/resources</p>
          </div>
        </div>
        <div className="mt-5 space-y-2 rounded-2xl border border-black/6 bg-white p-3">
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <span className="text-[0.58rem] font-bold text-black/40 uppercase">To</span>
            <span className="truncate text-xs font-semibold text-black/80">editor@growthhub.com</span>
          </div>
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <span className="text-[0.58rem] font-bold text-black/40 uppercase">Subject</span>
            <span className="truncate text-xs font-semibold text-black/80">Suggestion for your founder tools page</span>
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-black/6 bg-white p-4">
          <p className="line-clamp-5 text-sm leading-6 text-black/50">
            Hi Alex, I found your founder tools resource page while researching distribution workflows. Mentiohunt could be a useful addition for teams looking for backlink placement opportunities.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[0.72rem] font-bold text-[var(--color-blaze-orange)]">
          Review email draft
          <IconArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(Math.min(Math.floor(v * steps.length), steps.length - 1))
  })

  const step = steps[activeIndex]!
  const Illustration = step.Illustration

  return (
    <section
      id="how-it-works"
      style={{
        background:
          "linear-gradient(160deg, var(--crimson-carrot) 0%, var(--blaze-orange) 35%, var(--princeton-orange) 70%, var(--amber-glow) 100%)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-20 pb-10 text-center sm:pt-24 sm:pb-14">
        <span className="text-[0.7rem] font-bold text-white/60 uppercase tracking-widest">
          How it works
        </span>
        <div className="mx-auto mt-3 h-px w-12 bg-white/30" />
        <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-[42px]">
          One simple flow for backlink placement
        </h2>
        <p className="mt-4 text-base leading-7 text-white/75 sm:text-lg">
          Set your targeting once. Mentiohunt turns it into a daily queue of
          relevant opportunities and ready-to-review actions.
        </p>
      </div>

      {/* Scroll driver — 400vh gives each step 75vh of scroll travel */}
      <div ref={scrollRef} style={{ height: `${steps.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex flex-col">

          {/* Step indicator */}
          <div className="flex justify-center pt-6">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeIndex ? "2rem" : "0.375rem",
                    backgroundColor: i === activeIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Animated step — AnimatePresence swaps between steps */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="sync">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -36 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8"
              >
                <div className="w-full max-w-6xl">
                  <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                    {/* Text */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[0.6rem] font-bold text-white">
                          {activeIndex + 1}
                        </span>
                        <p className="text-[0.7rem] font-bold text-white/65 uppercase tracking-widest">
                          {step.eyebrow}
                        </p>
                      </div>
                      <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl lg:text-[2.25rem]">
                        {step.title}
                      </h3>
                      <p className="mt-4 max-w-lg text-base font-semibold leading-7 text-white/75">
                        {step.description}
                      </p>
                      <div className="mt-6 h-px w-10 bg-white/25" />
                    </div>

                    {/* Illustration */}
                    <div>
                      <Illustration />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom padding */}
          <div className="h-8" />
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pt-10 pb-24 text-center sm:pb-32">
        <p className="mb-6 text-sm font-semibold text-white/50 uppercase tracking-widest">
          Ready to start?
        </p>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-bold text-[var(--color-blaze-orange)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] active:scale-[0.98]"
          >
            <span>Start discovering opportunities</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-blaze-orange)] text-white transition-transform duration-300 group-hover:translate-x-1">
              <IconArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
        <p className="mt-5 text-sm text-white/45">No credit card required · Setup in 2 minutes</p>
      </div>
    </section>
  )
}
