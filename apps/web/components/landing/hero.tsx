"use client"

import { motion, useReducedMotion } from "framer-motion"

import { HeroContent, HeroIllustration } from "./hero-content"

export function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle,var(--color-blaze-orange)_1px,transparent_1px)] bg-[size:28px_28px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 60% 55% at 50% 28%, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 55% at 50% 28%, black, transparent 75%)",
          }}
          animate={reduceMotion ? undefined : { opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/8 blur-[150px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 120, -90, 0],
                  y: [0, 80, -60, 0],
                  scale: [1, 1.15, 0.9, 1],
                  opacity: [0.6, 1, 0.7, 0.6],
                }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-[280px] w-[280px] rounded-full bg-[var(--color-amber-flame)]/5 blur-[90px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -70, 40, 0],
                  y: [0, -50, 60, 0],
                  opacity: [0.5, 1, 0.6, 0.5],
                }
          }
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute left-0 top-2/3 h-[240px] w-[240px] rounded-full bg-[var(--color-blaze-orange)]/5 blur-[90px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 60, -40, 0],
                  y: [0, 70, -40, 0],
                  opacity: [0.5, 1, 0.6, 0.5],
                }
          }
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Copy — centered on the full viewport, pt clears the fixed navbar */}
      <div className="relative flex min-h-[100svh] items-center pt-28 sm:pt-32">
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
