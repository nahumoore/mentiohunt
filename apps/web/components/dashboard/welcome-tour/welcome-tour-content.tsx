"use client"

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import { captureEvent } from "@/lib/analytics"
import { Button } from "@workspace/ui/components/button"
import { DialogClose, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog"

import { TOUR_STEPS } from "./steps"

/**
 * The body of the welcome tour, rendered inside a `DialogContent` by the
 * first-login walkthrough (`FirstLoginWalkthrough`). One step per major
 * capability — welcome, prospects & outreach, pages, email accounts, link
 * tracker — navigable via Next/Back, the dot rail, or arrow keys.
 *
 * `onDone` lets the caller run side effects (analytics, marking the
 * walkthrough seen) when the user finishes the last step — omit it to just
 * close the dialog via `DialogClose`.
 */
export function WelcomeTourContent({
  onDone,
  onStepChange,
}: {
  onDone?: () => void
  /** Fired whenever the current step changes, so a host can gate closing until the last step. */
  onStepChange?: (isLast: boolean) => void
} = {}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const prefersReducedMotion = useReducedMotion()

  const step = TOUR_STEPS[index]!
  const isFirst = index === 0
  const isLast = index === TOUR_STEPS.length - 1

  useEffect(() => {
    captureEvent("walkthrough_step_viewed", { step: step.id, index })
    onStepChange?.(isLast)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, index, isLast])

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= TOUR_STEPS.length) return
    setDirection(nextIndex > index ? 1 : -1)
    setIndex(nextIndex)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(index + 1)
      if (e.key === "ArrowLeft") goTo(index - 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const variants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 16 }),
        center: { opacity: 1, x: 0 },
        exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * -16 }),
      }

  return (
    <>
      <DialogTitle className="sr-only">{step.headline}</DialogTitle>
      <DialogDescription className="sr-only">{step.body}</DialogDescription>

      <div className="min-h-[22rem] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/8 text-(--color-blaze-orange)">
                <step.Icon className="size-3.5" />
              </span>
              <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
                {step.eyebrow}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance text-foreground">
              {step.headline}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {step.body}
            </p>

            <div className="mt-6">{step.mock}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          style={isFirst ? { visibility: "hidden" } : undefined}
          tabIndex={isFirst ? -1 : 0}
        >
          <IconArrowLeft className="size-3.5" />
          Back
        </button>

        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to ${s.eyebrow}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={
                i === index
                  ? "h-1.5 w-5 rounded-full bg-(--color-blaze-orange) transition-all duration-150"
                  : "size-1.5 rounded-full bg-border transition-all duration-150 hover:bg-muted-foreground/40"
              }
            />
          ))}
        </div>

        {isLast ? (
          onDone ? (
            <Button onClick={onDone} className="rounded-full px-6 font-medium">
              Start exploring
            </Button>
          ) : (
            <DialogClose asChild>
              <Button className="rounded-full px-6 font-medium">
                Start exploring
              </Button>
            </DialogClose>
          )
        ) : (
          <Button
            onClick={() => goTo(index + 1)}
            className="gap-2 rounded-full px-6 font-medium"
          >
            Next
            <IconArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </>
  )
}
