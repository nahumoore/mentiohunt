"use client"

import { IconArrowLeft, IconRadar } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 right-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--blaze-orange)]/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-[var(--princeton-orange)]/6 blur-[100px]" />
      </div>

      {/* Watermark 404 */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span
          className="font-heading text-[22vw] font-black leading-none tracking-tighter text-foreground/[0.03]"
          style={{ letterSpacing: "-0.04em" }}
        >
          404
        </span>
      </div>

      {/* Radar rings */}
      <div className="relative mb-10 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[var(--blaze-orange)]"
            initial={{ width: 56, height: 56, opacity: 0.6 }}
            animate={{ width: 56 + i * 52, height: 56 + i * 52, opacity: 0 }}
            transition={{
              duration: 2.4,
              delay: i * 0.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[var(--blaze-orange)]/30 bg-[var(--blaze-orange)]/8">
          <IconRadar size={26} className="text-[var(--blaze-orange)]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Copy */}
      <motion.div
        className="relative z-10 mx-auto max-w-md text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <span className="text-[0.68rem] font-bold text-[var(--blaze-orange)] uppercase">
          Error 404
        </span>
        <div className="mx-auto mt-3 h-px w-10 bg-[var(--blaze-orange)]/50" />

        <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          This mention doesn&rsquo;t exist
        </h1>

        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Our scanner ran through every corner of the internet.
          <br />
          Nothing here.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--blaze-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blaze-orange)]"
          >
            <IconArrowLeft size={15} strokeWidth={2.2} />
            Back to home
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open dashboard
          </Link>
        </div>
      </motion.div>

      {/* Bottom label */}
      <motion.p
        className="absolute bottom-8 text-[0.65rem] text-muted-foreground/40 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        Mentiohunt · Signal lost
      </motion.p>
    </main>
  )
}
