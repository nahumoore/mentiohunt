import type { ComponentType } from "react"

import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import { IconBrandHackerNews } from "@/components/custom-icons/brand-hacker-news"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { IconBrandBluesky } from "@tabler/icons-react"
import { IconBrandBing } from "../custom-icons/brand-bing"
import { IconBrandChatGPT } from "../custom-icons/brand-chatgpt"
import { IconBrandXCustom } from "../custom-icons/brand-x"

type Surface = {
  name: string
  Icon: ComponentType<{ className?: string }>
}

const surfaces: Surface[] = [
  {
    name: "Claude",
    Icon: IconBrandClaude,
  },
  {
    name: "ChatGPT",
    Icon: IconBrandChatGPT,
  },
  {
    name: "Perplexity",
    Icon: IconBrandPerplexity,
  },
  {
    name: "Google",
    Icon: IconBrandGoogle,
  },
  {
    name: "Bing",
    Icon: IconBrandBing,
  },
  {
    name: "Reddit",
    Icon: IconBrandRedditNew,
  },
  {
    name: "Bluesky",
    Icon: IconBrandBluesky,
  },
  {
    name: "X",
    Icon: IconBrandXCustom,
  },
  {
    name: "Hacker News",
    Icon: IconBrandHackerNews,
  },
]

export function DiscoverySurfaces() {
  return (
    <section
      aria-labelledby="discovery-surfaces-title"
      className="relative z-10 py-8 sm:py-10 lg:py-5 xl:py-6"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl px-2 text-center sm:px-4">
          <h2
            id="discovery-surfaces-title"
            className="font-heading text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase sm:text-sm"
          >
            Get discovered across
          </h2>

          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="relative mx-auto mt-7 overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/15 bg-gradient-to-br from-card/90 via-background to-[var(--color-amber-flame)]/8 py-5 shadow-[0_24px_80px_-60px_rgba(255,84,0,0.85)] sm:mt-8 sm:py-6 lg:mt-6">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-background via-background/95 to-transparent backdrop-blur-[2px] sm:w-32" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-background via-background/95 to-transparent backdrop-blur-[2px] sm:w-32" />
            <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-amber-glow)]/20 blur-2xl" />
            <div className="pointer-events-none absolute right-0 top-1/2 z-10 h-28 w-28 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--color-blaze-orange)]/18 blur-2xl" />

            <div className="flex w-max animate-[discovery-surfaces-marquee-right_34s_linear_infinite] items-center motion-reduce:animate-none">
              {[0, 1].map((loopIndex) => (
                <div
                  key={loopIndex}
                  aria-hidden={loopIndex === 1}
                  className="flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4 lg:gap-5 lg:pr-5"
                >
                  {surfaces.map(({ name, Icon }) => (
                    <span
                      key={`${loopIndex}-${name}`}
                      aria-label={loopIndex === 0 ? name : undefined}
                      className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[var(--color-blaze-orange)]/16 bg-background/85 text-[var(--color-princeton-orange)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_42px_-34px_rgba(255,84,0,0.72)] ring-1 ring-foreground/5 backdrop-blur sm:size-16 xl:size-20"
                      role={loopIndex === 0 ? "img" : undefined}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-[var(--color-amber-flame)]/12" />
                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/70 to-transparent" />
                      <Icon className="relative z-10 size-8 opacity-90 drop-shadow-[0_8px_14px_rgba(255,84,0,0.12)] saturate-[1.08] sm:size-9 lg:size-8 xl:size-9" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
