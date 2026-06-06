"use client"

import { IconArrowRight, IconStar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { IconBrandBluskyCustom } from "@/components/custom-icons/brand-blusky"
import { IconBrandFacebookCustom } from "@/components/custom-icons/brand-facebook"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { IconBrandXCustom } from "@/components/custom-icons/brand-x"

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
        <span className="text-sm font-bold tracking-[0.18em] text-(--color-blaze-orange) uppercase">
          Daily Monitoring
        </span>
        <span className="h-4 w-px bg-border/60" />
        <div className="flex items-center gap-2">
          <IconBrandRedditNew size={22} />
          <IconBrandXCustom className="h-[22px] w-[22px] rounded-sm" />
          <IconBrandBluskyCustom className="h-[22px] w-[22px] rounded-full" />
          <IconBrandFacebookCustom className="h-[22px] w-[22px] rounded-full" />
          <IconBrandGoogle className="h-[22px] w-[22px]" />
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
        Your product,{" "}
        <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
          everywhere it matters.
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
        Agents running 27/4 looking for high-fit backlinks and social media
        posts asking for your product — start finding opportunities to
        distribute your product!
      </motion.p>

      {/* CTA */}
      <motion.div
        className="mt-10"
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
            START DISTRIBUTING
            <IconArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
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
          distributing their products
        </p>
      </motion.div>
    </div>
  )
}
