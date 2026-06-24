"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { IconBrandChatGPT } from "@/components/custom-icons/brand-chatgpt"
import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandGemini } from "@/components/custom-icons/brand-gemini"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export function HeroContent() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Badge */}
      <motion.div
        className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-muted/50 px-5 py-2.5 backdrop-blur-sm"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0, ease }}
      >
        <span className="text-sm font-bold text-(--color-blaze-orange) uppercase">
          Start ranking in
        </span>
        <span className="h-4 w-px bg-border/60" />
        <div className="flex items-center gap-2">
          <IconBrandChatGPT className="h-[22px] w-[22px]" />
          <IconBrandClaude className="h-[22px] w-[22px]" />
          <IconBrandGemini className="h-[22px] w-[22px]" />
          <IconBrandPerplexity className="h-[22px] w-[22px]" />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="mt-8 max-w-5xl font-heading text-6xl font-semibold tracking-[-0.05em] text-balance sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.08, ease }}
      >
        More authority,{" "}
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
            more revenue.
          </span>
          <svg
            className="absolute -bottom-3 left-0 w-full"
            viewBox="0 0 300 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path
              d="M4 10 Q75 3 150 10 Q225 17 296 10"
              stroke="url(#revenue-underline)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <defs>
              <linearGradient id="revenue-underline" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-blaze-orange-2)" />
                <stop offset="100%" stopColor="var(--color-amber-flame)" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-muted-foreground sm:text-lg sm:leading-8"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.55, delay: 0.16, ease }}
      >
        We find backlink opportunities, run outreach, and manage placements
        end-to-end. You simply approve or reject — no outreach ops required.
      </motion.p>

      {/* CTA */}
      <motion.div
        className="mt-10 flex flex-col items-center gap-4"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.55, delay: 0.24, ease }}
      >
        <Button
          asChild
          size="lg"
          className="group h-16 rounded-full px-10 text-lg font-bold shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.99]"
        >
          <Link href="/signup">
            GET FIRST OPPORTUNITIES
            <IconArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
        <Link
          href="#how-it-works"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          See how it works
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      {/* Trusted by */}
      <motion.div
        className="mt-8 flex flex-col items-center gap-2"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.55, delay: 0.32, ease }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[
              { src: "/landing/user_1.webp", label: "Mentiohunt user" },
              { src: "/landing/user_2.webp", label: "Mentiohunt user" },
              { src: "/landing/user_3.webp", label: "Mentiohunt user" },
              { src: "/landing/user_4.webp", label: "Mentiohunt user" },
            ].map(({ src, label }, i) => (
              <div
                key={src}
                className="relative h-11 w-11 overflow-hidden rounded-full border-[2.5px] border-background shadow-md"
                style={{ marginLeft: i === 0 ? 0 : "-0.75rem" }}
              >
                <Image src={src} alt={label} fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <IconStar
                key={i}
                size={18}
                className="fill-amber-400 text-amber-400"
              />
            ))}
            <span className="ml-1.5 text-lg font-bold text-foreground">
              4.9
            </span>
            <span className="font-medium text-muted-foreground">/5</span>
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Trusted by{" "}
          <span className="font-semibold text-foreground">100+ founders</span>{" "}
          earning relevant backlinks
        </p>
      </motion.div>
    </div>
  )
}
