"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { HeroIllustration } from "./hero-illustration"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function HeroContent() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center gap-10 text-center">
        {/* Copy */}
        <div className="max-w-3xl">
          <motion.h1
            className="mt-5 font-heading text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[3.6rem] xl:text-[4.2rem]"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.07, ease }}
          >
            Know exactly where to{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              pitch your product next.
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.14, ease }}
          >
            Mentiohunt finds{" "}
            <span className="font-semibold text-foreground">
              high-fit sites to pitch for backlinks
            </span>{" "}
            and monitors{" "}
            <span className="font-semibold text-foreground">communities</span>{" "}
            where your product belongs — with a{" "}
            <span className="font-semibold text-foreground">
              ready-to-use outreach draft
            </span>{" "}
            for every opportunity.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-5"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.21, ease }}
          >
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.99]"
            >
              <Link href="/signup">
                START DISTRIBUTING
                <IconArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[
                    "/landing/user_1.webp",
                    "/landing/user_2.webp",
                    "/landing/user_3.webp",
                    "/landing/user_4.webp",
                  ].map((src, i) => (
                    <div
                      key={src}
                      className="relative h-11 w-11 overflow-hidden rounded-full border-[2.5px] border-background shadow-md"
                      style={{ marginLeft: i === 0 ? 0 : "-0.75rem" }}
                    >
                      <Image src={src} alt="" fill className="object-cover" />
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
                distributing their products
              </p>
            </div>
          </motion.div>
        </div>

        {/* Illustration */}
        <motion.div
          className="w-full"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.7, delay: 0.28, ease }}
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </div>
  )
}
