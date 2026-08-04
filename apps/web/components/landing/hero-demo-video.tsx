"use client"

import { IconPlayerPlayFilled } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { useState } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const YOUTUBE_ID = "9FkXOsmIuhU"

/** Product demo — thumbnail with a play button until clicked, then swaps in the embed. */
export function HeroDemoVideo() {
  const [playing, setPlaying] = useState(false)

  return (
    <motion.div
      className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-lg shadow-black/5 backdrop-blur-sm"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1`}
          title="Mentiohunt product demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label="Play product demo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
            alt="Mentiohunt product demo"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
              <IconPlayerPlayFilled className="ml-1 h-6 w-6 text-(--color-blaze-orange) sm:h-7 sm:w-7" />
            </span>
          </span>
        </button>
      )}
    </motion.div>
  )
}
