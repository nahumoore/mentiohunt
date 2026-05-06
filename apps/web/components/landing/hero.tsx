"use client"

import { motion } from "framer-motion"

import { HeroContent } from "./hero-content"

export function Hero() {
  return (
    <section
      id="hero"
      className="relative bg-background pt-24 pb-24 sm:pt-32 sm:pb-32 lg:pt-40 lg:pb-40"
    >
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:28px_28px] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

      {/* Animated blobs */}
      <motion.div
        className="pointer-events-none absolute -top-60 -left-60 h-[700px] w-[700px] rounded-full bg-primary/10 blur-[140px]"
        animate={{ x: [0, 60, -30, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 -right-60 h-[500px] w-[500px] rounded-full bg-orange-400/8 blur-[120px]"
        animate={{ x: [0, -50, 20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/6 blur-[100px]"
        animate={{ x: [0, -30, 50, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <HeroContent />
      </div>
    </section>
  )
}
