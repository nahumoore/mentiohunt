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
      className="relative z-10 py-8 sm:py-10 lg:py-4 xl:py-5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-5xl px-2 text-center sm:px-4"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.28, ease }}
        >
          <h2
            id="discovery-surfaces-title"
            className="font-heading text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase sm:text-sm"
          >
            Get discovered across
          </h2>

          <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

          <div className="mt-7 grid grid-cols-3 items-end gap-x-5 gap-y-7 sm:grid-cols-5 sm:gap-x-8 lg:mt-6 lg:grid-cols-9 lg:gap-x-6 xl:gap-x-8">
            {surfaces.map(({ name, Icon }) => (
              <span
                key={name}
                aria-label={name}
                className="group inline-flex flex-col items-center justify-end gap-2 text-muted-foreground/65 transition duration-200 hover:text-[var(--color-princeton-orange)]"
                role="img"
              >
                <Icon className="h-9 w-9 opacity-60 grayscale transition duration-200 group-hover:opacity-100 sm:h-10 sm:w-10 lg:h-8 lg:w-8 xl:h-9 xl:w-9" />
                <span className="font-heading text-[0.62rem] leading-none font-medium tracking-[0.16em] uppercase opacity-70 transition duration-200 group-hover:opacity-100">
                  {name}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
