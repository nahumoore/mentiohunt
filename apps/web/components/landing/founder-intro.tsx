import { IconArrowRight, IconBrandX } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export function FounderIntro() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-20 left-1/4 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[110px]" />
        <div className="absolute right-0 bottom-0 h-[28rem] w-[28rem] translate-x-1/4 rounded-full bg-amber-flame/6 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            From the founder
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Found a way to get traffic and customers while you sleep
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            SEO and Reddit have been my two best growth channels- but I like
            building, So I'm automating them as much as possible.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-14">
            {/* Left: photo + proof screenshots */}
            <div className="mx-auto w-full max-w-md lg:mx-0">
              {/* Compact founder photo with gradient fade */}
              <div className="relative mx-auto w-36 sm:w-44">
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/founder.webp"
                    alt="Nicolas More, founder of Mentiohunt"
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover object-top"
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[1.5rem] bg-gradient-to-b from-transparent to-background" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-blaze-orange)]/20 bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
                    <p className="font-heading text-xs font-semibold tracking-[-0.01em]">
                      Nicolas More
                    </p>
                    <span className="text-border">·</span>
                    <Link
                      href="https://x.com/nicolasmore_"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[0.65rem] text-[var(--color-princeton-orange)] hover:underline"
                    >
                      <IconBrandX size={9} stroke={2.5} />
                      @nicolasmore_
                    </Link>
                  </div>
                </div>
              </div>

              {/* Proof screenshots — rotated, overlapping */}
              <div className="relative mt-10 pb-6">
                {/* GSC — tilted left, behind */}
                <div className="relative z-10 -rotate-[2.5deg] overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_24px_64px_-20px_rgba(0,0,0,0.18)] transition-all duration-500 hover:z-30 hover:rotate-0 hover:shadow-[0_28px_72px_-20px_rgba(0,0,0,0.22)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-background/80 px-3 py-2 backdrop-blur-sm">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                    <span className="ml-2 text-[0.6rem] text-muted-foreground/70">
                      Google Search Console
                    </span>
                  </div>
                  <Image
                    src="/landing/gsc-proof.webp"
                    alt="Google Search Console — 222K impressions, growing organic traffic"
                    width={920}
                    height={356}
                    className="w-full pt-6"
                  />
                </div>

                {/* Reddit — tilted right, on top, offset down */}
                <div className="relative z-20 -mt-10 ml-6 rotate-[2deg] overflow-hidden rounded-2xl border border-border/70 bg-[#1a1a1b] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.28)] transition-all duration-500 hover:z-30 hover:rotate-0 hover:shadow-[0_28px_72px_-20px_rgba(0,0,0,0.32)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-[#1a1a1b]/90 px-3 py-2 backdrop-blur-sm">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                    <span className="ml-2 text-[0.6rem] text-white/40">
                      Reddit · Performance Overview
                    </span>
                  </div>
                  <Image
                    src="/landing/reddit-proof.webp"
                    alt="Reddit performance — 1.5M post views, 2.2K upvotes"
                    width={754}
                    height={468}
                    className="w-full pt-6"
                  />
                </div>
              </div>
            </div>

            {/* Right: narrative */}
            <div className="space-y-6 lg:pt-2">
              <blockquote className="border-l-2 border-[var(--color-blaze-orange)] pl-5 font-heading text-xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-2xl">
                &ldquo;In two months, SEO + Reddit got me 15-20 daily new
                users.&rdquo;
              </blockquote>

              <div className="space-y-4 text-base leading-7 text-muted-foreground">
                <p>
                  I started marketing by creating content for one of my
                  products, built a few backlinks, and then Google was sending
                  traffic wihtout me having to be there. Then, I also started to
                  reply to Reddit threads where my product came up naturally
                </p>
                <p>
                  In a few months, I was getting <b>15-20 daily new users</b>{" "}
                  trying my product every.. single.. day
                </p>
                <p>
                  Those two channels became the backbone of my growth. No paid
                  ads, no cold emails. Just SEO compounding over time and Reddit
                  threads <i>(which translates to SEO as well)</i> where I could
                  actually be useful
                </p>
                <p>
                  The problem was doing it every day while I could be improving
                  the product or focusing on other tasks. I kept thinking there
                  had to be a better way to run this as a system... so
                  Mentiohunt is that system — built for founders who want the
                  same results without turning distribution into a full-time job
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Link href="/signup">
                    Start automating your growth
                    <IconArrowRight size={16} stroke={2.5} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-full px-5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link href="/about">Read the full story</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
