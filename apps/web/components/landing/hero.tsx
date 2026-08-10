"use client"

import { motion, useReducedMotion } from "framer-motion"

import { HeroContent, HeroIllustration } from "./hero-content"

export function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      {/* Atmosphere — single restrained blob */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute top-1/2 left-1/2 h-[520px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/8 blur-[140px]"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Copy — vertically centered in the full viewport (nav is fixed/overlay, doesn't take flow space) */}
      <div className="relative flex h-[100svh] items-center">
        <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
          <HeroContent />
        </div>
      </div>

      {/* Illustration — revealed as the user scrolls past the fold */}
      <div className="relative pb-20 sm:pb-24">
        <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}
