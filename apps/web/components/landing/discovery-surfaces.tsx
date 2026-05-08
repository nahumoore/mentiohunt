"use client"

import type { ComponentType } from "react"

import { motion } from "framer-motion"

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

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function DiscoverySurfaces() {
  return (
    <section
      aria-labelledby="discovery-surfaces-title"
      className="relative z-10 py-10 sm:py-12 lg:py-4 xl:py-5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative isolate mx-auto max-w-4xl rounded-[2rem] border border-border/60 bg-card/55 px-5 py-6 text-center shadow-[0_18px_80px_-50px_rgba(0,0,0,0.32),0_18px_80px_-54px_rgba(255,133,0,0.55)] backdrop-blur-xl sm:px-7 lg:px-8 lg:py-5 dark:bg-card/45"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.28, ease }}
        >
          <div className="pointer-events-none absolute inset-x-8 -top-8 -z-10 h-20 rounded-full bg-[var(--color-princeton-orange)]/10 blur-3xl dark:bg-[var(--color-princeton-orange)]/14" />

          <h2
            id="discovery-surfaces-title"
            className="font-heading text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase"
          >
            Get discovered across
          </h2>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-9 gap-y-6 sm:gap-x-12 lg:mt-5 lg:gap-x-8 lg:gap-y-3 xl:gap-x-10">
            {surfaces.map(({ name, Icon }) => (
              <span
                key={name}
                aria-label={name}
                className="inline-flex h-14 w-14 items-center justify-center text-muted-foreground opacity-45 grayscale transition duration-200 hover:opacity-70 sm:h-16 sm:w-16 lg:h-12 lg:w-12 xl:h-14 xl:w-14"
                role="img"
              >
                <Icon className="h-11 w-11 sm:h-12 sm:w-12 lg:h-10 lg:w-10 xl:h-11 xl:w-11" />
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
