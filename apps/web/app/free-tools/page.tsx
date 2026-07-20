import Link from "next/link"
import type { Metadata } from "next"
import {
  IconArrowRight,
  IconArticle,
  IconBolt,
  IconCalculator,
  IconFolderSearch,
  IconLink,
  IconSitemap,
  IconSwords,
  IconTextSize,
  IconUserSearch,
  IconWorldSearch,
} from "@tabler/icons-react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { Footer, Navbar } from "@/components/landing"
import { FREE_TOOL_NAMES } from "@/consts/free-tools"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Free Tools - Mentiohunt",
  description:
    "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
  alternates: {
    canonical: "/free-tools",
  },
  openGraph: {
    title: "Free Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
    url: "https://mentiohunt.com/free-tools",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
  },
}

const tools = [
  {
    name: "Startup Directory Browser",
    eyebrow: "Directory index",
    description:
      "Browse a startup directory table by category, pricing, authority, backlink, and submission signals before running a gap scan.",
    icon: IconFolderSearch,
    href: "/free-tools/startup-directories",
  },
  {
    name: "Directory Backlink Opportunity Finder",
    eyebrow: "Product to directories",
    description:
      "Paste your product URL and find startup directories where you can apply for relevant backlink opportunities.",
    icon: IconLink,
    href: `/free-tools/${FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder}`,
  },
  {
    name: "Backlink Price Calculator",
    eyebrow: "Site authority to price",
    description:
      "Enter any website URL to pull live Ahrefs authority metrics and estimate a fair market price for a backlink, adjusted for link type, placement, and content format.",
    icon: IconCalculator,
    href: `/free-tools/${FREE_TOOL_NAMES.backlinkPriceCalculator}`,
  },
  {
    name: "Backlink Opportunity Finder",
    eyebrow: "Website to opportunities",
    description:
      "Enter your website URL and surface relevant blogs, resource pages, and content hubs where a backlink to your product would be a strong fit.",
    icon: IconWorldSearch,
    href: `/free-tools/${FREE_TOOL_NAMES.backlinkOpportunityFinder}`,
  },
  {
    name: "Competitor Backlink Gap Analysis",
    eyebrow: "Competitor gaps to outreach",
    description:
      "Enter your website URL and see which sites link to your competitors but not to you. Turn gap analysis into a prioritized outreach list.",
    icon: IconSwords,
    href: `/free-tools/${FREE_TOOL_NAMES.competitorBacklinkGap}`,
  },
  {
    name: "Google Index Checker",
    eyebrow: "Sitemap to index status",
    description:
      "Paste your sitemap URL and instantly see which pages Google has indexed, which are missing, and where keyword opportunities exist for each page.",
    icon: IconSitemap,
    href: `/free-tools/${FREE_TOOL_NAMES.googleIndexChecker}`,
  },
  {
    name: "Anchor Text Generator",
    eyebrow: "Keyword to anchor variants",
    description:
      "Enter a keyword and an optional target URL to generate a full set of anchor text variants — exact match, partial, branded, LSI, and generic — each with a safety label and plain-language guidance.",
    icon: IconTextSize,
    href: `/free-tools/${FREE_TOOL_NAMES.anchorTextGenerator}`,
  },
  {
    name: "Author Contact Finder",
    eyebrow: "Article to contact",
    description:
      "Paste a blog post URL and find the author's name, role, and most likely contact email — labelled with a confidence level, for backlink outreach.",
    icon: IconUserSearch,
    href: `/free-tools/${FREE_TOOL_NAMES.authorContactFinder}`,
  },
  {
    name: "Guest Post Sites Finder",
    eyebrow: "Website to guest-post targets",
    description:
      "Enter your website URL and find sites in your niche that publicly invite guest contributors, each with a fit score and rationale.",
    icon: IconArticle,
    href: `/free-tools/${FREE_TOOL_NAMES.guestPostSitesFinder}`,
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

      {/* Hero — single column */}
      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blaze-orange/25 bg-blaze-orange/7 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-(--color-princeton-orange)">
            <IconBolt size={12} stroke={2.8} />
            Free outreach tools
          </div>

          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
            Know which outreach is worth your time.
          </h1>

          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Qualify backlink prospects and get a plain next step — without
            building a spreadsheet.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full px-7 text-sm font-semibold shadow-sm shadow-primary/20"
            >
              <Link href="#tools">
                Explore the tools
                <IconArrowRight size={15} stroke={2.5} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 rounded-full px-6 text-sm hover:border-blaze-orange/25 hover:bg-blaze-orange/5"
            >
              <Link href="/signup">Turn checks into a queue</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tools list */}
      <section id="tools" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="border-t border-border">
            {tools.map((tool) => {
              const Icon = tool.icon

              return (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group relative flex items-start gap-5 border-b border-border py-6 pl-4 transition-colors outline-none hover:bg-blaze-orange/[0.022] focus-visible:bg-blaze-orange/[0.03]"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-[2px] origin-top scale-y-0 bg-blaze-orange transition-transform duration-200 group-hover:scale-y-100" />

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground/50 transition-colors group-hover:border-blaze-orange/30 group-hover:text-(--color-princeton-orange)">
                    <Icon size={18} stroke={2} />
                  </div>

                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/45">
                      {tool.eyebrow}
                    </p>
                    <h3 className="mt-1 font-heading text-[1.05rem] font-semibold tracking-tight">
                      {tool.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap pt-1.5 text-xs font-medium text-muted-foreground/40 transition-colors group-hover:text-(--color-princeton-orange)">
                    Try free
                    <IconArrowRight
                      size={13}
                      stroke={2.2}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Operating notes */}
      <section className="border-t border-border px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-16">
            <div className="shrink-0 sm:w-56">
              <span className="text-[0.65rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
                Operating notes
              </span>
              <div className="mt-3 h-px w-8 bg-blaze-orange/60" />
              <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Free tools should teach the workflow.
              </h2>
            </div>

            <div className="flex-1">
              <div className="space-y-5">
                {operatingNotes.map((note, i) => (
                  <div key={note} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-[0.6rem] font-semibold text-(--color-princeton-orange)">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="default"
                  className="h-10 rounded-full px-6 text-sm font-semibold shadow-sm shadow-primary/20"
                >
                  <Link href="/signup">Build your opportunity queue</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="default"
                  className="h-10 rounded-full px-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link href="/">
                    <IconBrandMentiohunt className="size-4" />
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
