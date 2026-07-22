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
  IconList,
  IconMailFast,
  IconWorldSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import { useEffect, useRef, useState, type ComponentType } from "react"

import { Button } from "@workspace/ui/components/button"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import { getContactAvatarUrl } from "@/consts/contact-avatar"

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
    title: "We send it, you just review",
    description:
      "Each opportunity comes with a ready email draft that sends itself — the contact, the send, and the pre-reply follow-ups are all handled automatically. Once a site owner replies, you take the thread over yourself. Pass on anything that isn't a fit. Most customers see their first placed backlink within 14–21 days of setup.",
    Illustration: ActionIllustration,
  },
]

// ─── Illustrations ────────────────────────────────────────────────────────────

const scannedPages = [
  { path: "/", label: "Homepage" },
  { path: "/product", label: "Product" },
  { path: "/pricing", label: "Pricing" },
  { path: "/blog/notion-vs-confluence", label: "Blog post" },
  { path: "/templates", label: "Templates" },
]

function SetupIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />

      <div className="relative space-y-6">
        {/* URL input — hero element */}
        <div className="space-y-2.5">
          <p className="text-[0.65rem] font-bold tracking-widest text-black/40 uppercase">Your product URL</p>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-blaze-orange)]/25 bg-orange-50/50 px-5 py-4 ring-1 ring-[var(--color-blaze-orange)]/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.google.com/s2/favicons?domain=notion.so&sz=32"
              alt=""
              width={18}
              height={18}
              className="shrink-0 rounded-sm"
            />
            <span className="flex-1 text-base font-semibold text-black/80">notion.so</span>
            <span className="rounded-full bg-[var(--color-blaze-orange)] px-3 py-1 text-[0.62rem] font-bold text-white uppercase tracking-wide shadow-[0_4px_12px_-4px_rgba(255,84,0,0.5)]">
              Scanning
            </span>
          </div>
        </div>

        {/* Pages discovered list */}
        <div className="space-y-2">
          <p className="text-[0.65rem] font-bold tracking-widest text-black/40 uppercase">Pages discovered</p>
          <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/6 bg-gray-50">
            {scannedPages.map((page, i) => (
              <div key={page.path} className="flex items-center gap-3 px-4 py-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blaze-orange)]" style={{ opacity: 1 - i * 0.14 }} />
                <span className="flex-1 truncate font-mono text-xs text-black/60">notion.so{page.path}</span>
                <span className="text-[0.6rem] font-bold text-black/30 uppercase">{page.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topics detected */}
        <div className="space-y-2.5">
          <p className="text-[0.65rem] font-bold tracking-widest text-black/40 uppercase">Topics detected</p>
          <div className="flex flex-wrap gap-2">
            {["project management", "team wiki", "knowledge base", "productivity app"].map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[var(--color-blaze-orange)]/15 bg-[var(--color-blaze-orange)]/6 px-3 py-1.5 text-[0.7rem] font-semibold text-[var(--color-blaze-orange)]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const agentToolCalls = [
  { Icon: IconBrandGoogle, text: 'Searched "best note-taking apps 2025"' },
  { Icon: IconLink, text: "Scanned Evernote, Coda, Confluence backlinks" },
  { Icon: IconList, text: "Found 18 listicles covering productivity tools" },
  { Icon: IconFileText, text: "Crawled 312 resource pages & directories" },
]

const discoveredOpportunities = [
  { domain: "zapier.com", title: "Best productivity apps for teams in 2025", type: "Listicle", score: "94" },
  { domain: "g2.com", title: "Notion alternatives & competitors", type: "Comparison", score: "89" },
  { domain: "producthunt.com", title: "Top note-taking tools", type: "Directory", score: "85" },
  { domain: "atlassian.com", title: "Best project management software", type: "Round-up", score: "82" },
]

function DiscoveryIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/50 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />

      <div className="relative space-y-5">
        {/* Tool calls — row by row */}
        <div className="space-y-0 divide-y divide-black/5">
          {agentToolCalls.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3 py-3">
              <Icon className="h-4 w-4 shrink-0 text-black/30" />
              <span className="text-sm text-black/55">{text}</span>
            </div>
          ))}
        </div>

        {/* Opportunities */}
        <div className="space-y-2">
          <p className="text-[0.65rem] font-bold tracking-widest text-black/40 uppercase">4 opportunities found</p>
          <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/6 bg-gray-50">
            {discoveredOpportunities.map((opp) => (
              <div key={opp.domain} className="flex items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${opp.domain}&sz=32`}
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0 rounded-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-black/75">{opp.title}</p>
                  <p className="mt-0.5 text-[0.6rem] font-bold text-black/35 uppercase">{opp.domain} · {opp.type}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-blaze-orange)]/10 px-2.5 py-1 text-[0.68rem] font-bold tabular-nums text-[var(--color-blaze-orange)]">
                  {opp.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const enrichmentExamples = [
  {
    domain: "zapier.com",
    title: "Best productivity apps for teams in 2025",
    type: "Listicle",
    score: "94",
    contact: {
      name: "Marcus Webb",
      role: "Head of Content · Zapier",
      bio: "Covers SaaS tools, automation workflows, and productivity for distributed teams.",
      email: "m.webb@zapier.com",
    },
  },
  {
    domain: "hubspot.com",
    title: "Best project management software 2025",
    type: "Comparison",
    score: "89",
    contact: {
      name: "Diana Lopes",
      role: "Senior Editor · HubSpot",
      bio: "Writes in-depth comparisons and buyer guides for B2B software categories.",
      email: "diana.lopes@hubspot.com",
    },
  },
  {
    domain: "g2.com",
    title: "Notion alternatives & competitors 2025",
    type: "Comparison",
    score: "87",
    contact: {
      name: "Jordan Park",
      role: "Content Strategist · G2",
      bio: "Manages category pages for productivity and collaboration software on G2.",
      email: "j.park@g2.com",
    },
  },
]

function EnrichmentIllustration() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % enrichmentExamples.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const example = enrichmentExamples[active]!

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />

      <div className="relative space-y-5">
        {/* Opportunity row */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`opp-${active}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 rounded-2xl border border-black/6 bg-gray-50 px-4 py-3.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${example.domain}&sz=32`}
              alt=""
              width={16}
              height={16}
              className="shrink-0 rounded-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-black/75">{example.title}</p>
              <p className="mt-0.5 text-[0.6rem] font-bold text-black/35 uppercase">{example.domain} · {example.type}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-blaze-orange)]/10 px-2.5 py-1 text-[0.68rem] font-bold tabular-nums text-[var(--color-blaze-orange)]">{example.score}</span>
          </motion.div>
        </AnimatePresence>

        {/* Contact profile card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`contact-${active}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl border border-black/6 bg-gray-50 p-4"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getContactAvatarUrl(example.contact.name)}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full border border-black/8 bg-gray-100"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black/80">{example.contact.name}</p>
                <p className="text-[0.65rem] text-black/45">{example.contact.role}</p>
              </div>
            </div>
            {/* Bio */}
            <p className="mt-3 text-xs leading-5 text-black/50">{example.contact.bio}</p>
            {/* Email */}
            <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
              <IconMailFast className="h-3.5 w-3.5 shrink-0 text-black/30" />
              <span className="flex-1 truncate text-xs font-semibold text-black/65">{example.contact.email}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-emerald-600">Verified</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel dots */}
        <div className="flex justify-center gap-1.5">
          {enrichmentExamples.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i === active ? "1.5rem" : "0.375rem",
                backgroundColor: i === active ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.12)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--color-princeton-orange)]/8 blur-3xl" />

      <div className="relative space-y-5">
        {/* Contact header — continuity from step 3 */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getContactAvatarUrl("Marcus Webb")}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full border border-black/8 bg-gray-100"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-black/80">Marcus Webb</p>
            <p className="text-[0.65rem] text-black/40">Head of Content · Zapier</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.google.com/s2/favicons?domain=zapier.com&sz=32"
            alt=""
            width={16}
            height={16}
            className="shrink-0 rounded-sm opacity-50"
          />
        </div>

        {/* Email draft */}
        <div className="rounded-2xl border border-black/6 bg-gray-50">
          <div className="space-y-0 divide-y divide-black/5 px-4">
            <div className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 text-[0.6rem] font-bold tracking-widest text-black/30 uppercase">To</span>
              <span className="truncate text-xs font-semibold text-black/70">m.webb@zapier.com</span>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 text-[0.6rem] font-bold tracking-widest text-black/30 uppercase">Subject</span>
              <span className="truncate text-xs font-semibold text-black/70">Quick suggestion for your productivity roundup</span>
            </div>
          </div>
          <div className="border-t border-black/5 px-4 py-4 space-y-3">
            <p className="text-sm leading-6 text-black/50">Hi Marcus,</p>
            <p className="text-sm leading-6 text-black/50">
              I was reading your Zapier roundup on productivity apps — great list. I think Notion would be a natural fit in there, especially for the teams-of-10+ crowd who need docs, wikis, and tasks in one place.
            </p>
            <p className="text-sm leading-6 text-black/50">
              Happy to write a short blurb you can drop straight in, or link to whichever page works best for you. In return, I&apos;d be glad to feature Zapier in our own resource section.
            </p>
            <p className="text-sm leading-6 text-black/50">Worth a quick reply?</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-blaze-orange)]/10 px-5 py-3 text-sm font-bold text-[var(--color-blaze-orange)]">
            <IconMailFast className="h-4 w-4" />
            Sending automatically
          </div>
          <button className="rounded-2xl border border-black/8 bg-gray-50 px-5 py-3 text-sm font-semibold text-black/40 transition-colors hover:text-black/60">
            Pass
          </button>
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
