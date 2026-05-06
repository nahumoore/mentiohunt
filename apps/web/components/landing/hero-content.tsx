"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@workspace/ui/components/button"

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const ease = [0.21, 0.47, 0.32, 0.98] as const

export function HeroContent() {
  return (
    <div className="mx-auto max-w-4xl text-center">
<motion.h1
        className="font-heading text-5xl font-semibold tracking-tight text-balance sm:text-7xl lg:text-8xl"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, ease }}
      >
        Know where to get{" "}
        <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          mentioned next
        </span>
        .
      </motion.h1>

<motion.p
        className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.1, ease }}
      >
        Mentiohunt scans competitor pages, relevant sites, keywords, and
        community conversations to build a focused queue of outreach
        opportunities, with why each one fits and what to do next.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col items-center justify-center"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.2, ease }}
      >
        <Button asChild size="lg">
          <Link href="#how-it-works">See how it works</Link>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          No SEO team required · Weekly queue included · Cancel anytime
        </p>
      </motion.div>

      <motion.div
        id="why-mentions"
        className="mt-14 grid gap-3 text-left sm:grid-cols-3"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, delay: 0.35, ease }}
      >
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 backdrop-blur-sm">
          <p className="text-2xl font-semibold tracking-tight">Weekly</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A shortlist of opportunities worth reviewing, not another noisy dashboard
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 backdrop-blur-sm">
          <p className="text-2xl font-semibold tracking-tight">Clear</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain-language reasons for why each opportunity fits your product
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 backdrop-blur-sm">
          <p className="text-2xl font-semibold tracking-tight">Ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggested next steps and outreach angles so you can move faster
          </p>
        </div>
      </motion.div>
    </div>
  )
}
