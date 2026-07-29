import Link from "next/link"
import type { Metadata } from "next"
import { IconArrowRight, IconCheck, IconSparkles } from "@tabler/icons-react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { Footer, Navbar } from "@/components/landing"
import { FREE_TOOLS_DIRECTORY } from "@/consts/free-tools-directory"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Free Backlink & Link Building Tools",
  description:
    "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
  alternates: {
    canonical: "/free-tools",
  },
  openGraph: {
    title: "Free Backlink & Link Building Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
    url: "https://mentiohunt.com/free-tools",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Backlink & Link Building Tools - Mentiohunt",
    description:
      "Free founder tools for checking backlink fit, discovering placement opportunities, and turning distribution research into a clearer next step.",
  },
}

const operatingNotes = [
  "No guaranteed backlinks, just clearer outreach judgment.",
  "Built for founders who need a decision, not another spreadsheet.",
  "The real product turns these checks into recurring queues.",
]

export default function FreeToolsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-princeton-orange/5 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blaze-orange/25 bg-blaze-orange/7 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-(--color-princeton-orange)">
            Free tools &middot; no sign-up
          </div>

          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
            Backlink tools,{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              on the house.
            </span>
          </h1>

          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            The tedious parts of link building, done for you. Open any tool,
            drop in your site, and get a plain next step in seconds — no
            account required.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full px-7 text-sm font-semibold shadow-sm shadow-primary/20"
            >
              <Link href="#tools">
                Browse the tools
                <IconArrowRight size={15} stroke={2.5} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 rounded-full px-6 text-sm hover:border-blaze-orange/25 hover:bg-blaze-orange/5"
            >
              <Link href="/#how-it-works">How Mentiohunt works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_TOOLS_DIRECTORY.map((tool) => {
              const Icon = tool.icon

              return (
                <Link
                  key={tool.slug}
                  href={`/free-tools/${tool.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-blaze-orange/25 hover:bg-blaze-orange/[0.025]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blaze-orange/8 text-(--color-princeton-orange)">
                      <Icon size={22} stroke={2} />
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.6rem] font-semibold text-muted-foreground">
                      <IconCheck size={11} stroke={3} className="text-green-600" />
                      No login
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="font-heading text-[1.1rem] font-semibold tracking-tight">
                      {tool.name}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-1.5 pt-1 text-sm font-semibold text-(--color-princeton-orange)">
                    Try free
                    <IconArrowRight
                      size={14}
                      stroke={2.5}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Upsell tile */}
          <div className="mt-5 flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-br from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] p-8 text-white shadow-sm sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-white/85">
                <IconSparkles size={14} stroke={2.5} />
                Want it hands-off?
              </span>
              <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Let Mentiohunt run every tool for you, on a schedule.
              </h3>
            </div>
            <Button
              asChild
              size="lg"
              className="h-11 shrink-0 rounded-full bg-white px-6 text-sm font-semibold text-(--color-princeton-orange) shadow-sm hover:bg-white/90"
            >
              <Link href="/signup">
                See how
                <IconArrowRight size={15} stroke={2.5} />
              </Link>
            </Button>
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
