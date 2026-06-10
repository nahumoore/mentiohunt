import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import {
  IconArrowRight,
  IconBolt,
  IconBrandX,
  IconMail,
  IconSearch,
  IconSend,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "About Mentiohunt - Built by Nicolas More",
  description:
    "A direct founder note from Nicolas More on why Mentiohunt exists: helping founders find backlink and community opportunities without turning distribution into busywork.",
  openGraph: {
    title: "About Mentiohunt - Built by Nicolas More",
    description:
      "A direct founder note from Nicolas More on why Mentiohunt exists: helping founders find backlink and community opportunities without turning distribution into busywork.",
    url: "https://mentiohunt.com/about",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Mentiohunt - Built by Nicolas More",
    description:
      "A direct founder note from Nicolas More on why Mentiohunt exists: helping founders find backlink and community opportunities without turning distribution into busywork.",
  },
}

const principles = [
  {
    icon: IconTargetArrow,
    title: "Fit before volume",
    text: "A smaller queue of clearly relevant opportunities beats a spreadsheet full of maybe-someday prospects.",
  },
  {
    icon: IconSearch,
    title: "Rationale included",
    text: "Every suggestion should explain why it belongs, so you can decide quickly without becoming a distribution expert.",
  },
  {
    icon: IconSend,
    title: "Prep, not promises",
    text: "Mentiohunt helps prepare outreach and replies. It should never pretend that a backlink or mention is guaranteed.",
  },
]

const timeline = [
  "Backlink prospecting starts from your own content, competitors, and keywords.",
  "Community monitoring watches for threads where your product can be useful now.",
  "The product is early, bootstrapped, and shaped by the recurring work founders actually do.",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border/70 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.028]"
            style={{
              backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
              backgroundSize: "44px 44px",
            }}
          />
          <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-[var(--color-amber-glow)]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-[32rem] w-[32rem] translate-x-1/3 rounded-full bg-[var(--color-blaze-orange)]/10 blur-3xl" />

          <div className="container relative mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                  <IconBolt size={13} stroke={2.5} />
                  Founder note
                </div>

                <h1 className="mt-6 font-heading text-5xl font-semibold tracking-[-0.06em] text-balance sm:text-6xl lg:text-[5.5rem] lg:leading-[0.9]">
                  I&apos;m building the distribution queue I wanted to use.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  I&apos;m Nicolas More, the founder of Mentiohunt. The product is
                  early, bootstrapped, and built around a simple idea: founders
                  should know what distribution opportunity to work on next
                  without losing the day to searching, sorting, and second
                  guessing.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
                  >
                    <Link href="/signup">
                      Get started
                      <IconArrowRight size={16} stroke={2.5} />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-6 text-sm backdrop-blur transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/8"
                  >
                    <Link href="mailto:nicolas@mentiohunt.com">
                      <IconMail size={16} stroke={2.3} />
                      Email Nicolas
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
                <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full border border-[var(--color-amber-glow)]/35 bg-[var(--color-amber-glow)]/10" />
                <div className="absolute -bottom-6 -right-6 h-36 w-36 rounded-[2rem] bg-[var(--color-blaze-orange)]/10 blur-sm" />

                <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/25 bg-card p-3 shadow-[0_30px_90px_-34px_rgba(255,96,0,0.55)]">
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
                  <Image
                    src="/founder.webp"
                    alt="Nicolas More, founder of Mentiohunt"
                    width={900}
                    height={900}
                    priority
                    className="aspect-[4/5] rounded-[1.65rem] object-cover object-center"
                  />
                  <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/35 bg-background/80 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10">
                    <p className="font-heading text-lg font-semibold tracking-[-0.03em]">
                      Nicolas More
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Link
                        href="https://x.com/nicolasmore_"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-blaze-orange)]/10 px-3 py-1 text-[var(--color-princeton-orange)] transition-colors hover:bg-[var(--color-blaze-orange)]/15"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <IconBrandX size={14} stroke={2.4} />
                        @nicolasmore_
                      </Link>
                      <span className="rounded-full bg-muted px-3 py-1">
                        Bootstrapped founder
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                  Why it exists
                </p>
                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
                  Distribution work should feel like a clear queue, not a foggy
                  research project.
                </h2>
              </div>

              <div className="space-y-5 text-base leading-8 text-muted-foreground">
                <p>
                  A lot of founder-led distribution breaks down at the same
                  point: you know you should earn more relevant backlinks, show
                  up in the right communities, and respond while the window is
                  still open. But the work gets scattered across search tabs,
                  social feeds, cold lists, and half-written drafts.
                </p>
                <p>
                  Mentiohunt is meant to compress that mess into a daily set of
                  opportunities. For backlink building, it looks at your
                  content and surfaces websites where an article fits, with
                  outreach prep attached. For community monitoring, it watches
                  for posts where your product can be mentioned naturally and
                  alerts you while the thread is active.
                </p>
                <p>
                  The goal is not to automate trust or guarantee outcomes. The
                  goal is to remove the repetitive discovery work so founders
                  can spend more time making useful asks, writing thoughtful
                  replies, and building relationships that compound.
                </p>
              </div>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {principles.map((principle) => {
                const Icon = principle.icon

                return (
                  <article
                    key={principle.title}
                    className="group rounded-[1.75rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-blaze-orange)]/30 hover:shadow-[0_18px_60px_-32px_rgba(255,96,0,0.65)]"
                  >
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)] transition-colors group-hover:bg-[var(--color-blaze-orange)] group-hover:text-white">
                      <Icon size={21} stroke={2.25} />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-semibold tracking-[-0.03em]">
                      {principle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {principle.text}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_76%,var(--color-amber-glow)_24%)_100%)] p-6 shadow-[0_30px_100px_-45px_rgba(255,133,0,0.42)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[var(--color-princeton-orange)]/12 blur-3xl" />
              <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none font-heading text-[12rem] font-bold leading-none tracking-[-0.08em] text-[var(--color-amber-glow)]/[0.08] lg:block">
                M
              </div>

              <div className="relative grid gap-9 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                    Current direction
                  </p>
                  <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
                    Built in public enough to be reachable. Built carefully
                    enough to be useful.
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    If you are trying to turn content and community activity
                    into a repeatable acquisition habit, I want Mentiohunt to
                    feel like the practical next step each morning.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                    >
                      <Link href="/signup">Start your first queue</Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="h-11 rounded-full px-6 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        href="https://x.com/nicolasmore_"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Follow on X
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {timeline.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 font-heading text-sm font-semibold text-[var(--color-princeton-orange)]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
