"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const rise = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const heroTestimonials = [
  {
    author: "Alex Chen",
    quote: "It found better prospects than I would have, nice!",
    avatar: "/landing/user_1.webp",
  },
  {
    author: "Sarah Mitchell",
    quote:
      "I love how automated it is, I didn't have to do anything beside adding my website.",
    avatar: "/landing/user_2.webp",
  },
  {
    author: "Marcus Johnson",
    quote:
      "It's like having an agent that does all the outreach for you. I like it.",
    avatar: "/landing/user_3.webp",
  },
  {
    author: "Elena Rodriguez",
    quote: "Finally, I can't stop using spreadsheet for link building.",
    avatar: "/landing/user_4.webp",
  },
]

/** Centered hero copy — headline, subhead, CTAs, trust line. No product visual. */
export function HeroContent() {
  const reduceMotion = useReducedMotion()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false)

  useEffect(() => {
    if (reduceMotion || isTestimonialPaused) return

    const interval = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % heroTestimonials.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [isTestimonialPaused, reduceMotion])

  const testimonial =
    heroTestimonials[activeTestimonial] ?? heroTestimonials[0]!

  return (
    <div className="mx-auto max-w-4xl text-center">
      <motion.div
        className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm"
        variants={rise}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, ease }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blaze-orange/70 motion-reduce:hidden" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blaze-orange" />
        </span>
        <span className="text-[0.7rem] font-bold tracking-[0.2em] text-blaze-orange uppercase">
          Automated link building tool
        </span>
      </motion.div>

      <motion.h1
        className="mt-8 font-[family-name:var(--font-figtree),var(--font-sans)] text-[3.5rem] leading-[0.92] font-bold tracking-[-0.055em] text-balance text-foreground sm:text-7xl lg:text-[6rem]"
        variants={rise}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.7, delay: 0.08, ease }}
      >
        Link building
        <br />
        that runs{" "}
        <span className="relative inline-block whitespace-nowrap text-blaze-orange">
          without you
          <motion.svg
            className="absolute -bottom-3 left-0 w-full text-blaze-orange/45 sm:-bottom-4"
            viewBox="0 0 320 10"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
          >
            <motion.path
              d="M3 7.5C70 2.5 250 2.5 317 7.5"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              initial={reduceMotion ? undefined : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease }}
            />
          </motion.svg>
        </span>
      </motion.h1>

      <motion.p
        className="mx-auto mt-9 max-w-2xl text-lg leading-8 text-balance text-muted-foreground sm:text-xl"
        variants={rise}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.16, ease }}
      >
        An AI agent that scans your most important keywords & pages to find the
        sites where your content belongs as a natural citation, finds the person
        behind them, and runs the outreach until you get a reply.
      </motion.p>

      <motion.div
        className="mt-11 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7"
        variants={rise}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.24, ease }}
      >
        <Link
          href="/signup"
          className="group inline-flex h-14 w-full items-center justify-center rounded-full bg-blaze-orange px-9 text-base font-bold text-white shadow-lg shadow-blaze-orange/25 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-crimson-carrot hover:shadow-xl hover:shadow-blaze-orange/30 sm:w-auto"
        >
          Find my backlink opportunities
          <IconArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
        </Link>
        <Link
          href="#how-it-works"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          See the agent at work
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      {/* Rotating social proof — under the CTA */}
      <motion.div
        className="mt-10 flex flex-col items-center gap-3"
        variants={rise}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.3, ease }}
      >
        <div
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          onMouseEnter={() => setIsTestimonialPaused(true)}
          onMouseLeave={() => setIsTestimonialPaused(false)}
          onFocus={() => setIsTestimonialPaused(true)}
          onBlur={() => setIsTestimonialPaused(false)}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-[2.5px] border-background shadow-md">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={testimonial.avatar}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <IconStar
                  key={i}
                  size={15}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-1 text-sm font-bold text-foreground">
                4.8
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                /5
              </span>
            </div>
          </div>

          <div
            className="max-w-sm overflow-hidden text-center sm:max-w-xs sm:border-l sm:border-border sm:pl-4 sm:text-left"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={testimonial.author}
                className="text-sm leading-5 font-medium text-muted-foreground italic"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
              >
                &ldquo;{testimonial.quote}&rdquo;
                <span className="sr-only"> — {testimonial.author}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          Trusted by{" "}
          <span className="font-semibold text-foreground">+100 founders</span>{" "}
          earning relevant backlinks
        </p>
      </motion.div>
    </div>
  )
}
