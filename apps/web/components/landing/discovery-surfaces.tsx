import type { ComponentType } from "react"

import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandGemini } from "@/components/custom-icons/brand-gemini"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"
import { IconBrandBing } from "../custom-icons/brand-bing"
import { IconBrandChatGPT } from "../custom-icons/brand-chatgpt"

type Surface = {
  name: string
  Icon: ComponentType<{ className?: string }>
}

const surfaces: Surface[] = [
  {
    name: "Google",
    Icon: IconBrandGoogle,
  },
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
    name: "Gemini",
    Icon: IconBrandGemini,
  },
  {
    name: "Bing",
    Icon: IconBrandBing,
  },
]

export function DiscoverySurfaces() {
  return (
    <section
      aria-labelledby="discovery-surfaces-title"
      className="relative z-10 py-14 sm:py-16 lg:py-20 xl:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl px-2 text-center sm:px-4">
          <h2
            id="discovery-surfaces-title"
            className="font-heading text-xs font-semibold text-muted-foreground uppercase sm:text-sm"
          >
            Get discovered across
          </h2>

          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="relative mx-auto mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-card/50 via-background to-[var(--color-amber-flame)]/5 py-4 sm:mt-6 sm:py-5 lg:mt-7 lg:py-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-background via-background/90 to-transparent sm:w-36" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-background via-background/90 to-transparent sm:w-36" />
            <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-amber-glow)]/12 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-1/2 z-10 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--color-blaze-orange)]/10 blur-3xl" />

            <div className="flex w-max animate-[discovery-surfaces-marquee-right_34s_linear_infinite] items-center motion-reduce:animate-none">
              {[0, 1].map((loopIndex) => (
                <div
                  key={loopIndex}
                  aria-hidden={loopIndex === 1}
                  className="flex shrink-0 items-center gap-4 pr-4 sm:gap-6 sm:pr-6 lg:gap-8 lg:pr-8"
                >
                  {surfaces.map(({ name, Icon }) => (
                    <span
                      key={`${loopIndex}-${name}`}
                      aria-label={loopIndex === 0 ? name : undefined}
                      className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-background/70 text-[var(--color-princeton-orange)] shadow-[0_18px_48px_-38px_rgba(255,84,0,0.8)] backdrop-blur sm:size-16 xl:size-20"
                      role={loopIndex === 0 ? "img" : undefined}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-[var(--color-amber-flame)]/8" />
                      <Icon className="relative z-10 size-8 opacity-85 saturate-[1.04] sm:size-9 lg:size-8 xl:size-9" />
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
