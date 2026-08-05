"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { HeroDemoVideo } from "./hero-demo-video"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

/** Eyebrow → heading → subtitle → CTA → trusted-by. Centered in the 100vh hero viewport. */
export function HeroContent() {
  return (
    <div className="mx-auto max-w-5xl text-center">
      {/* Eyebrow */}
      <motion.h1
        className="text-sm font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0, ease }}
      >
        Automated link building tool
      </motion.h1>

      {/* Heading */}
      <motion.h2
        className="mt-5 font-heading text-6xl font-semibold leading-[0.95] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl xl:text-[8.5rem]"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.65, delay: 0.08, ease }}
      >
        You get backlinks.
        <br />
        <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
          We run outreach.
        </span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="mx-auto mt-8 max-w-xl text-lg font-medium leading-8 text-muted-foreground sm:text-xl"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.55, delay: 0.16, ease }}
      >
        We find sites where your content fits, then run outreach through the
        first reply. Then you continue the conversation yourself — to secure
        the backlink and build the relationship.
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
          className="group h-16 rounded-full px-12 text-lg font-bold shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40"
        >
          <Link href="/signup">
            Get first opportunities
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

      {/* Trusted by */}
      <motion.div
        className="mt-9 flex flex-col items-center gap-2"
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
            <span className="ml-1.5 text-lg font-bold text-foreground">4.9</span>
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

/** Illustration. Sits below the 100vh hero block, revealed on scroll. */
export function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55, ease }}
    >
      <HeroDemoVideo />
    </motion.div>
  )
}
