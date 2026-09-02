"use client"

import { motion, useReducedMotion } from "framer-motion"

import { HeroContent } from "./hero-content"

export function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      {/* Atmosphere — dot texture + one warm horizon blob */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,black,transparent)]" />
        <motion.div
          className="absolute bottom-[12%] left-1/2 h-[420px] w-[900px] max-w-[130vw] -translate-x-1/2 rounded-full bg-blaze-orange/[0.09] blur-[130px]"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }
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
    </section>
  )
}
