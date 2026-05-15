import Link from "next/link"
import type { Metadata } from "next"
import {
  IconArrowRight,
  IconBolt,
  IconChecklist,
  IconFolderSearch,
  IconLink,
  IconTargetArrow,
} from "@tabler/icons-react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { Footer, Navbar } from "@/components/landing"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Free Tools - Mentiohunt",
  description:
    "Free founder tools for checking backlink fit, spotting community reply opportunities, and turning distribution research into a clearer next step.",
  openGraph: {
    title: "Free Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, spotting community reply opportunities, and turning distribution research into a clearer next step.",
    url: "https://mentiohunt.com/free-tools",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, spotting community reply opportunities, and turning distribution research into a clearer next step.",
  },
}

const tools = [
  {
    name: "Startup Directory Browser",
    eyebrow: "Directory index",
    status: "Free",
    description:
      "Browse a startup directory table by category, pricing, authority, backlink, and submission signals before running a gap scan.",
    icon: IconFolderSearch,
    href: "/free-tools/startup-directories",
    steps: ["Browse index", "Filter fit", "Scan gaps"],
  },
  {
    name: "Directory Backlink Opportunity Finder",
    eyebrow: "Product to directories",
    status: "Free",
    description:
      "Paste your product URL and find startup directories where you can apply for relevant backlink opportunities.",
    icon: IconLink,
    href: "/free-tools/directory-backlink-opportunity-finder",
    steps: ["Product URL", "Directory gaps", "Apply next"],
  },
]

const operatingNotes = [
  "No guaranteed backlinks, just clearer outreach judgment.",
  "Built for founders who need a decision, not another spreadsheet.",
  "The real product turns these checks into recurring queues.",
]

const toolCardStyles = [
  {
    card: "border-[var(--color-blaze-orange)]/25 hover:border-[var(--color-blaze-orange)]/45",
    icon: "bg-[var(--color-blaze-orange)] text-white",
  },
  {
    card: "border-border hover:border-[var(--color-princeton-orange)]/40",
    icon: "bg-[var(--color-amber-glow)]/20 text-[var(--color-princeton-orange)]",
  },
]

export default function FreeToolsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />

      <section className="relative isolate overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_12%,var(--color-amber-glow)_0,transparent_24rem),radial-gradient(circle_at_86%_20%,var(--color-blaze-orange)_0,transparent_20rem)] opacity-[0.12]" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
            backgroundSize: "34px 34px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-[var(--color-blaze-orange)]/15" />
        <div className="pointer-events-none absolute left-1/2 top-28 -z-10 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full border border-[var(--color-amber-flame)]/15" />

        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-end">
            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-princeton-orange)]">
                <IconBolt size={13} stroke={2.6} />
                Free outreach tools
              </div>

              <h1 className="mt-7 max-w-4xl font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.6rem] lg:leading-[0.86]">
                Know which outreach is worth your time.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Qualify backlink prospects, check community threads for product
                fit, and get a plain next step — without building a
                spreadsheet.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Link href="#tools">
                    Explore the tools
                    <IconArrowRight size={16} stroke={2.5} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-6 text-sm backdrop-blur transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/8"
                >
                  <Link href="/signup">Turn checks into a queue</Link>
                </Button>
              </div>
            </div>

            <div className="relative min-h-[32rem] lg:min-h-[40rem]">
              <div className="absolute right-0 top-0 hidden h-28 w-28 rounded-[2rem] border border-[var(--color-amber-glow)]/35 bg-[var(--color-amber-glow)]/10 md:block" />
              <div className="absolute left-0 top-10 hidden h-20 w-20 rounded-full bg-[var(--color-blaze-orange)]/12 blur-sm md:block" />

              <div className="relative mx-auto max-w-[31rem] rotate-[-2deg] overflow-hidden rounded-[2.1rem] border border-foreground/10 bg-foreground p-4 text-background shadow-[0_42px_120px_-42px_rgba(255,96,0,0.85)] transition-transform duration-500 hover:rotate-0">
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/90 to-transparent" />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-blaze-orange)]/25 blur-3xl" />

                <div className="relative rounded-[1.55rem] border border-background/10 bg-background/[0.06] p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-background/55">
                        Today&apos;s free tool
                      </p>
                      <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.045em]">
                        Opportunity bench
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-amber-flame)] text-foreground shadow-lg shadow-[var(--color-amber-flame)]/20">
                      <IconTargetArrow size={24} stroke={2.4} />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {tools.map((tool, index) => {
                      const Icon = tool.icon

                      return (
                        <div
                          key={tool.name}
                          className="group rounded-[1.35rem] border border-background/10 bg-background/[0.075] p-4 transition-colors hover:bg-background/[0.11]"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={
                                index === 0
                                  ? "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/90 text-white"
                                  : "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-amber-glow)]/90 text-foreground"
                              }
                            >
                              <Icon size={20} stroke={2.4} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-heading text-base font-semibold tracking-[-0.025em]">
                                {tool.name}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-background/60">
                                {tool.eyebrow}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-[28rem] rotate-[2deg] rounded-[1.75rem] border border-[var(--color-blaze-orange)]/25 bg-card/90 p-5 shadow-[0_28px_90px_-42px_rgba(255,96,0,0.75)] backdrop-blur sm:left-auto sm:right-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconChecklist size={21} stroke={2.4} />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-semibold tracking-[-0.035em]">
                      Designed for a fast yes, no, or maybe.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      These tools help you browse directory options and find
                      backlink opportunities before you build another spreadsheet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="tools"
        className="relative overflow-hidden border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
        <div className="container mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Free tools
            </p>
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">
              Start with a free directory workflow.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              Browse a startup directory index, then paste your product URL to
              see directory submission opportunities. No login required.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-md gap-5 md:max-w-2xl lg:max-w-3xl">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              const styles = toolCardStyles[index % toolCardStyles.length]!

              return (
                <article
                  key={tool.name}
                  className={`group relative flex min-h-[22rem] flex-col overflow-hidden rounded-[2rem] border bg-card p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card}`}
                >
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex size-11 items-center justify-center rounded-[1.2rem] ${styles.icon}`}
                    >
                      <Icon size={23} stroke={2.35} />
                    </div>
                    <span className="rounded-full border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-princeton-orange)]">
                      {tool.status}
                    </span>
                  </div>

                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      {tool.eyebrow}
                    </p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.045em] text-balance">
                      {tool.name}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {tool.steps.map((step) => (
                      <span
                        key={step}
                        className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={tool.href}
                    className="mt-auto inline-flex items-center gap-2 self-start rounded-full pt-6 text-sm font-semibold text-foreground outline-none transition-colors hover:text-[var(--color-princeton-orange)] focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    Try it free
                    <IconArrowRight
                      size={16}
                      stroke={2.5}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] lg:grid-cols-[1fr_1.1fr]">
            <div className="relative overflow-hidden bg-foreground p-7 text-background sm:p-10">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/30 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 translate-y-1/3 rounded-full bg-[var(--color-amber-flame)]/25 blur-2xl" />
              <div className="relative">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-background/55">
                  Operating notes
                </p>
                <h2 className="mt-4 max-w-md font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Free tools should teach the workflow, not just collect an
                  email.
                </h2>
              </div>
            </div>

            <div className="p-7 sm:p-10">
              <div className="space-y-4">
                {operatingNotes.map((note, index) => (
                  <div
                    key={note}
                    className="flex gap-4 rounded-[1.35rem] border border-border bg-background/65 p-4"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 font-heading text-sm font-semibold text-[var(--color-princeton-orange)]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">Build your opportunity queue</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-11 rounded-full px-6 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link href="/">
                    <IconBrandMentiohunt className="size-4 rotate-12" />
                    See Mentiohunt
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
