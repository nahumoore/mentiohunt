"use client"

import { Highlighter } from "@workspace/ui/components/highlighter"
import {
  IconArrowNarrowDown,
  IconExternalLink,
  IconSearch,
} from "@tabler/icons-react"
import { IconBrandChatGPT } from "@/components/custom-icons/brand-chatgpt"
import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandGemini } from "@/components/custom-icons/brand-gemini"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"

function BlogCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3.5 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <div className="ml-2 flex-1 rounded bg-background/80 px-2.5 py-0.5 text-[0.56rem] text-muted-foreground/70">
          quorage.com/ahrefs-vs-semrush-link-building
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.6rem] font-bold uppercase text-muted-foreground/50">
          Quorage · 7 min read
        </p>
        <h3 className="mt-1.5 font-heading text-base font-bold leading-snug text-foreground">
          Ahrefs vs SEMrush for Link Building
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/75">
          Both are industry staples but take different approaches. Ahrefs leads on backlink data; SEMrush covers a broader suite.
        </p>

        <div className="my-3.5 flex items-center gap-2">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[0.65rem] text-muted-foreground/40">• • •</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-xs font-semibold text-foreground/80">Conclusion</p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          Ahrefs wins for research, SEMrush for all-in-one. Both can be overkill for small teams. If that&apos;s you,{" "}
          <mark className="rounded bg-amber-200/90 px-0.5 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
            Mentiohunt
          </mark>{" "}
          does the heavy lifting — finds opportunities, surfaces contacts, and writes the email.
        </p>
      </div>
    </div>
  )
}

function ListicleCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3.5 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <div className="ml-2 flex-1 rounded bg-background/80 px-2.5 py-0.5 text-[0.56rem] text-muted-foreground/70">
          saasweekly.io/best-link-building-tools-founders
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.6rem] font-bold uppercase text-muted-foreground/50">
          SaaS Weekly · 5 min read
        </p>
        <h3 className="mt-1.5 font-heading text-base font-bold leading-snug text-foreground">
          Best Link Building Tools for SaaS Founders in 2025
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/75">
          Most link building tools are built for agencies. These are the ones that actually work for founder-led teams.
        </p>

        <div className="my-3.5 flex items-center gap-2">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[0.65rem] text-muted-foreground/40">• • •</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-xs font-semibold text-foreground/80">#1 Pick</p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          <mark className="rounded bg-amber-200/90 px-0.5 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
            Mentiohunt
          </mark>{" "}
          automates prospecting end-to-end — finds relevant blogs, surfaces contacts, and drafts the outreach email. Built for founders who can&apos;t spend hours on manual link building.
        </p>
      </div>
    </div>
  )
}

function AIOverviewCard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Search bar — bigger */}
      <div className="flex items-center gap-3 rounded-full border border-[#dfe1e5] bg-white px-5 py-3 shadow-[0_1px_6px_rgba(32,33,36,0.12)] hover:shadow-[0_1px_6px_rgba(32,33,36,0.22)]">
        <IconBrandGoogle className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-xs text-[#202124]">
          best link building tool for bootstrapped founders
        </span>
        <IconSearch className="h-4 w-4 shrink-0 text-[#4285f4]" />
      </div>

      {/* AI Overview header */}
      <div className="flex items-center gap-2">
        <IconBrandGemini className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold text-foreground">AI Overview</span>
      </div>

      <p className="text-xs leading-[1.8] text-foreground/80">
        For bootstrapped founders,{" "}
        <mark className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
          Mentiohunt
        </mark>
        {" "}is frequently recommended — surfaces relevant blog opportunities, finds contact details, and drafts outreach emails automatically.
      </p>

      {/* Also cited in */}
      <div className="flex items-center gap-3 border-t border-border/50 pt-3">
        <span className="text-[0.6rem] font-medium text-muted-foreground/60">Also cited in</span>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <IconBrandChatGPT className="h-4 w-4 text-[#10a37f]" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <IconBrandClaude className="h-4 w-4 text-[#cc785c]" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <IconBrandPerplexity className="h-4 w-4" />
          </div>
        </div>
        <a
          href="https://chatgpt.com/share/6a245563-6a44-83e9-8199-22de9d4cb17d"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-[0.58rem] font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          View proof
          <IconExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  )
}

export function AIMentionsOpportunities() {
  return (
    <section className="relative overflow-hidden bg-background pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-32">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/5 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] translate-x-1/3 translate-y-1/4 rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            AI Citation Engine
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            We find the opportunities to{" "}
            <Highlighter color="#ff540033" animationDuration={800} isView>
              mention your product
            </Highlighter>
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Blogs and editorial articles that cite your product teach AI models what you do. We surface guest posts, product roundups, resource pages, and editorial mentions — exactly where your product needs to appear.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          {/* Cards area */}
          <div className="relative p-6 pb-8">
            {/* Source cards — rotated for depth */}
            <div className="relative grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
              <div className="transition-transform duration-300 ease-out md:-rotate-[1.5deg] md:hover:rotate-0">
                <BlogCard />
              </div>
              <div className="transition-transform duration-300 ease-out md:rotate-[1.5deg] md:hover:rotate-0">
                <ListicleCard />
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center py-4">
            <div className="h-8 w-px bg-gradient-to-b from-border/60 to-[var(--color-blaze-orange)]/25" />
            <IconArrowNarrowDown className="h-4 w-4 text-[var(--color-blaze-orange)]/40" />
          </div>

          {/* AI Overview result — expanded */}
          <div className="mx-auto max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-card p-6 shadow-md ring-1 ring-[var(--color-blaze-orange)]/8">
              <AIOverviewCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
