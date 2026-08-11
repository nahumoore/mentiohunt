"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { HeroDemoVideo } from "./hero-demo-video"
import { OrganicVisibilityCard } from "./organic-visibility-card"
import { TrustedByMarquee } from "./trusted-by-marquee"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

/** Left: eyebrow → heading → subtitle → CTA → trusted-by. Right: organic visibility illustration. */
export function HeroContent() {
  return (
    <div className="grid w-full grid-cols-1 gap-16 lg:grid-cols-[1fr_1.05fr] lg:items-center">
      {/* Copy column — left aligned */}
      <div className="max-w-2xl">
        <motion.div
          className="flex items-center gap-3"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease }}
        >
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Automated link building tool
          </span>
          <span className="h-px flex-1 max-w-16 bg-(--color-blaze-orange)/40" />
        </motion.div>

        <motion.h1
          className="mt-6 font-heading text-6xl leading-[0.97] font-semibold tracking-[-0.045em] text-balance text-foreground sm:text-7xl lg:text-[6.5rem]"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.65, delay: 0.08, ease }}
        >
          Build website
          <br />
          authority
          <br />
          <span className="relative inline-block whitespace-nowrap bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
            while you sleep.
            <svg
              className="absolute -bottom-5 left-0 w-full text-(--color-blaze-orange)"
              viewBox="0 0 300 12"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 9C60 3 240 3 298 9"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-lg text-lg leading-8 font-medium text-muted-foreground sm:text-xl"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.55, delay: 0.16, ease }}
        >
          We find sites where your content fits and run outreach in
          auto-pilot to earn you backlinks — growing the authority that gets
          you ranked and cited by{" "}
          <span className="sr-only">Gemini, ChatGPT, Claude, and Perplexity — AI search.</span>
          <span className="inline-flex items-center align-middle" aria-hidden="true">
            {[
              { domain: "gemini.google.com", label: "Gemini" },
              { domain: "chatgpt.com", label: "ChatGPT" },
              { domain: "claude.ai", label: "Claude" },
              { domain: "perplexity.ai", label: "Perplexity" },
            ].map(({ domain, label }, i) => (
              <span
                key={domain}
                className="relative inline-block h-6 w-6 overflow-hidden rounded-full border-2 border-background shadow-sm"
                style={{ marginLeft: i === 0 ? 0 : "-0.55rem" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  alt={label}
                  className="h-full w-full object-cover"
                />
              </span>
            ))}
          </span>
          .
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-6"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.55, delay: 0.24, ease }}
        >
          <Button
            asChild
            size="lg"
            className="group h-14 rounded-full px-9 text-base font-bold shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Link href="/signup">
              Find my first backlink
              <IconArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            See how it works
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Trusted-by — under the CTA */}
        <motion.div
          className="mt-8 flex flex-col items-start gap-2"
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
            <span className="font-semibold text-foreground">
              100+ founders
            </span>{" "}
            earning relevant backlinks
          </p>
        </motion.div>
      </div>

      {/* Right column — organic visibility illustration */}
      <div className="hidden lg:block">
        <OrganicVisibilityCard />
      </div>
    </div>
  )
}

/** Illustration. Sits below the 100vh hero block, revealed on scroll. */
export function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55, ease }}
    >
      <TrustedByMarquee />
      <HeroDemoVideo />
    </motion.div>
  )
}
