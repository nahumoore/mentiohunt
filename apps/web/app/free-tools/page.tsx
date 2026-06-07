import Link from "next/link"
import type { Metadata } from "next"
import {
  IconArrowRight,
  IconBolt,
  IconCalculator,
  IconChecklist,
  IconExternalLink,
  IconFolderSearch,
  IconLink,
  IconSparkles,
  IconSwords,
  IconWorldSearch,
} from "@tabler/icons-react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { Footer, Navbar } from "@/components/landing"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Free Tools - Mentiohunt",
  description:
    "Free founder tools for checking backlink fit, spotting community reply opportunities, and turning distribution research into a clearer next step.",
  alternates: {
    canonical: "/free-tools",
  },
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
    href: `/free-tools/${FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder}`,
    steps: ["Product URL", "Directory gaps", "Apply next"],
  },
  {
    name: "Backlink Price Calculator",
    eyebrow: "Site authority to price",
    status: "Free",
    description:
      "Enter any website URL to pull live Ahrefs authority metrics and estimate a fair market price for a backlink, adjusted for link type, placement, and content format.",
    icon: IconCalculator,
    href: `/free-tools/${FREE_TOOL_NAMES.backlinkPriceCalculator}`,
    steps: ["Paste site URL", "Pull metrics", "Get price range"],
  },
  {
    name: "Backlink Opportunity Finder",
    eyebrow: "Website to opportunities",
    status: "Free",
    description:
      "Enter your website URL and surface relevant blogs, resource pages, and content hubs where a backlink to your product would be a strong fit.",
    icon: IconWorldSearch,
    href: `/free-tools/${FREE_TOOL_NAMES.backlinkOpportunityFinder}`,
    steps: ["Paste URL", "Find relevant sites", "Reach out"],
  },
  {
    name: "Competitor Backlink Gap Analysis",
    eyebrow: "Competitor gaps to outreach",
    status: "Free",
    description:
      "Enter your website URL and see which sites link to your competitors but not to you. Turn gap analysis into a prioritized outreach list.",
    icon: IconSwords,
    href: `/free-tools/${FREE_TOOL_NAMES.competitorBacklinkGap}`,
    steps: ["Paste URL", "Find gap sites", "Close the gap"],
  },
  {
    name: "Subreddit Finder",
    eyebrow: "Website to communities",
    status: "Free",
    description:
      "Enter your website URL and find the most relevant Reddit communities for your product. Get a ranked list with fit rationale so you know exactly where to show up.",
    icon: IconBrandRedditNew,
    href: `/free-tools/${FREE_TOOL_NAMES.subredditFinder}`,
    steps: ["Paste URL", "Find subreddits", "Engage"],
  },
]

const operatingNotes = [
  "No guaranteed backlinks, just clearer outreach judgment.",
  "Built for founders who need a decision, not another spreadsheet.",
  "The real product turns these checks into recurring queues.",
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
        <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-blaze-orange/15" />
        <div className="pointer-events-none absolute left-1/2 top-28 -z-10 h-88 w-88 -translate-x-1/2 rounded-full border border-amber-flame/15" />

        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-end">
            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blaze-orange/25 bg-blaze-orange/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--color-princeton-orange)">
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
                  className="h-12 rounded-full border-blaze-orange/25 bg-background/70 px-6 text-sm backdrop-blur transition-colors hover:border-princeton-orange/40 hover:bg-blaze-orange/8"
                >
                  <Link href="/signup">Turn checks into a queue</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-start justify-center lg:justify-end">
              <div className="w-full max-w-88 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_20px_60px_-20px_rgba(255,133,0,0.15)]">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/70 px-3.5 py-2.5">
                  <IconWorldSearch size={14} stroke={2.2} className="shrink-0 text-muted-foreground/40" />
                  <span className="flex-1 truncate text-sm text-muted-foreground/60">yoursite.com</span>
                  <span className="rounded-lg bg-blaze-orange/10 px-2.5 py-1 text-[0.65rem] font-semibold text-(--color-princeton-orange)">
                    Analyze
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 rounded-xl border border-blaze-orange/15 bg-blaze-orange/6 px-3.5 py-3">
                    <IconSparkles size={13} stroke={2.3} className="shrink-0 text-(--color-princeton-orange)" />
                    <span className="flex-1 truncate text-sm font-medium">techcrunch.com</span>
                    <span className="rounded-md border border-blaze-orange/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-(--color-princeton-orange)">
                      Strong fit
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border/40 px-3.5 py-3">
                    <IconExternalLink size={13} stroke={2.2} className="shrink-0 text-muted-foreground/35" />
                    <span className="flex-1 truncate text-sm text-muted-foreground/70">indiehackers.com</span>
                    <span className="rounded-md border border-border/60 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground/50">
                      Good fit
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border/40 px-3.5 py-3">
                    <IconExternalLink size={13} stroke={2.2} className="shrink-0 text-muted-foreground/35" />
                    <span className="flex-1 truncate text-sm text-muted-foreground/70">producthunt.com</span>
                    <span className="rounded-md border border-border/60 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground/50">
                      Good fit
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2.5 border-t border-border/40 pt-4">
                  <IconChecklist size={13} stroke={2.2} className="shrink-0 text-muted-foreground/35" />
                  <p className="text-xs text-muted-foreground/55">
                    Paste a URL, get a result. No login required.
                  </p>
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-flame/70 to-transparent" />
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

          <div className="mx-auto mt-12 grid max-w-md gap-5 md:max-w-3xl md:grid-cols-2 lg:max-w-6xl lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon

              return (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group relative flex min-h-88 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/92 p-6 shadow-[0_22px_70px_-56px_rgba(255,133,0,0.7)] transition-all duration-300 outline-none hover:-translate-y-1 hover:border-princeton-orange/35 hover:bg-background hover:shadow-[0_30px_80px_-54px_rgba(255,133,0,0.85)] focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-flame/45 to-transparent" />
                  <div className="pointer-events-none absolute -right-16 -top-16 size-36 rounded-full bg-blaze-orange/0 blur-3xl transition-colors duration-300 group-hover:bg-blaze-orange/12" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-[1.15rem] border border-blaze-orange/20 bg-blaze-orange/9 text-(--color-princeton-orange) shadow-inner shadow-(--color-amber-flame)/10 transition-colors group-hover:border-princeton-orange/35 group-hover:bg-blaze-orange/12">
                      <Icon size={23} stroke={2.35} />
                    </div>
                    <span className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                      {tool.status}
                    </span>
                  </div>

                  <div className="mt-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      {tool.eyebrow}
                    </p>
                    <h3 className="mt-2 font-heading text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.045em] text-balance sm:text-[1.65rem]">
                      {tool.name}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {tool.steps.map((step) => (
                      <span
                        key={step}
                        className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground transition-colors group-hover:border-princeton-orange/20"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto inline-flex items-center gap-2 self-start pt-6 text-sm font-semibold text-foreground transition-colors group-hover:text-(--color-princeton-orange)">
                    Try it free
                    <IconArrowRight
                      size={16}
                      stroke={2.5}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] lg:grid-cols-[1fr_1.1fr]">
            <div className="relative overflow-hidden bg-foreground p-7 text-background sm:p-10">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-blaze-orange/30 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 translate-y-1/3 rounded-full bg-amber-flame/25 blur-2xl" />
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
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 font-heading text-sm font-semibold text-(--color-princeton-orange)">
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
