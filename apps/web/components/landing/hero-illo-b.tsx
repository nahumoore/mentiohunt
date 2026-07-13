"use client"

import {
  IconCheck,
  IconId,
  IconLoader2,
  IconMailFast,
  IconShieldCheck,
  IconSparkles,
  IconUserCheck,
  IconWorldSearch,
  IconX,
} from "@tabler/icons-react"
import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { getContactAvatarUrl, getWebsiteFaviconUrl } from "@/consts/contact-avatar"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const CONTACT = {
  name: "Marcus Webb",
  role: "Head of Content · Zapier",
  domain: "zapier.com",
  da: 78,
  fit: 94,
  bio: "Covers SaaS tools, automation workflows, and productivity for distributed teams.",
  email: "m.webb@zapier.com",
}

/** Agent checklist — each step goes pending → active (spinner) → done (check). */
const scrapeSteps = [
  { icon: IconWorldSearch, label: "Scraping zapier.com/blog" },
  { icon: IconId, label: "Extracting contact details" },
  { icon: IconUserCheck, label: "Found contact — Marcus Webb" },
  { icon: IconShieldCheck, label: "Validating email address" },
  { icon: IconMailFast, label: "Email verified — m.webb@zapier.com" },
] as const

const STEP_INTERVAL = 1200

type Phase = "scraping" | "conversation"

const messageIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

/**
 * Illustration B — the agent scraping a prospect, then a live outreach thread.
 * Phase 1 runs a checklist (scrape → extract → match contact → validate email) with
 * spinner-to-check states, full width, no sidebar yet. Once done the card reflows
 * into a sidebar (now-verified contact) + the email thread on the right, where Marcus
 * asks for something in return and the founder approves or rejects the agent's reply.
 * Plays once, triggered on scroll into view.
 */
export function HeroIlloB() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-10% 0px" })

  const [phase, setPhase] = useState<Phase>("scraping")
  const [revealedCount, setRevealedCount] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [showApproval, setShowApproval] = useState(false)

  useEffect(() => {
    if (!inView) return

    const timers: ReturnType<typeof setTimeout>[] = []

    scrapeSteps.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedCount(i + 1), i * STEP_INTERVAL + 500))
      timers.push(setTimeout(() => setDoneCount(i + 1), (i + 1) * STEP_INTERVAL))
    })

    timers.push(
      setTimeout(() => setPhase("conversation"), scrapeSteps.length * STEP_INTERVAL + 900)
    )

    return () => timers.forEach(clearTimeout)
  }, [inView])

  useEffect(() => {
    if (phase !== "conversation") return

    const timers: ReturnType<typeof setTimeout>[] = []
    const messageDelays = [500, 2000, 3500]

    messageDelays.forEach((delay, i) => {
      timers.push(setTimeout(() => setMessageCount(i + 1), delay))
    })

    timers.push(
      setTimeout(
        () => setShowApproval(true),
        messageDelays[messageDelays.length - 1]! + 1200
      )
    )

    return () => timers.forEach(clearTimeout)
  }, [phase])

  return (
    <motion.div
      ref={ref}
      className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/70 text-left shadow-lg shadow-black/5 backdrop-blur-sm sm:flex-row"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease }}
    >
      {/* Left sidebar — mounts only once the agent has verified the contact */}
      {phase === "conversation" && (
        <div className="flex shrink-0 flex-col gap-4 border-b border-border/50 px-5 py-5 sm:w-56 sm:border-r sm:border-b-0">
            <motion.div
              key="website"
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getWebsiteFaviconUrl(CONTACT.domain)}
                  alt=""
                  width={18}
                  height={18}
                  loading="lazy"
                  className="h-[18px] w-[18px]"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {CONTACT.domain}
                </p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">
                  DA {CONTACT.da}
                </p>
              </div>
            </motion.div>

            <motion.div
              key="contact"
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getContactAvatarUrl(CONTACT.name)}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full border border-border/60 bg-background"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {CONTACT.name}
                </p>
                <p className="truncate text-[0.7rem] font-medium text-muted-foreground">
                  {CONTACT.role}
                </p>
              </div>
            </motion.div>

            <motion.p
              key="bio"
              className="text-xs leading-5 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.24, ease }}
            >
              {CONTACT.bio}
            </motion.p>

            <motion.div
              key="email"
              className="flex items-center gap-1.5 border-t border-border/50 pt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36, ease }}
            >
              <IconMailFast className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="truncate text-xs font-semibold text-muted-foreground">
                {CONTACT.email}
              </span>
            </motion.div>

            <motion.span
              key="fit"
              className="flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.48, ease }}
            >
              <IconSparkles className="h-3.5 w-3.5" />
              {CONTACT.fit}% fit
            </motion.span>
        </div>
      )}

      {/* Right column — agent badge + scraping checklist / conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 border-b border-border/50 px-5 py-3.5">
          <span className="flex items-center gap-1.5 rounded-full bg-(--color-blaze-orange)/10 px-2.5 py-1 text-xs font-bold text-(--color-blaze-orange)">
            <IconSparkles className="h-3.5 w-3.5" />
            Handled by AI agent
          </span>
        </div>

        <div className="min-h-[300px] px-5 py-4">
          {phase === "scraping" ? (
            <motion.div
              className="flex flex-col gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease }}
            >
              {scrapeSteps.map((step, i) => {
                const Icon = step.icon
                const pending = revealedCount <= i
                const active = revealedCount > i && doneCount <= i
                const done = doneCount > i

                return (
                  <motion.div
                    key={step.label}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3.5 py-2.5"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: pending ? 0.4 : 1 }}
                    transition={{ duration: 0.45, ease }}
                  >
                    <span
                      className={
                        done
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : active
                            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)"
                            : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/40"
                      }
                    >
                      {done ? (
                        <IconCheck className="h-4 w-4" />
                      ) : active ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </span>
                    <span
                      className={
                        done || active
                          ? "text-sm font-medium text-foreground"
                          : "text-sm font-medium text-muted-foreground/50"
                      }
                    >
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease }}
            >
              {/* Agent → Marcus: the pitch */}
              <motion.div
                className="flex flex-col items-end gap-1"
                variants={messageIn}
                initial="initial"
                animate={messageCount >= 1 ? "animate" : "initial"}
                transition={{ duration: 0.5, ease }}
              >
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-[var(--color-blaze-orange-2)] to-[var(--color-amber-flame)] px-3.5 py-2.5 text-sm leading-5 text-white shadow-sm">
                  Hi Marcus — loved your piece on no-code workflows. I wrote a
                  deep dive on API automation your readers might value. Worth a
                  link?
                </div>
                <span className="pr-1 text-[0.65rem] font-medium text-muted-foreground">
                  Sent by agent · 2d ago
                </span>
              </motion.div>

              {/* Marcus → us: asks for something in return */}
              <motion.div
                className="flex flex-col items-start gap-1"
                variants={messageIn}
                initial="initial"
                animate={messageCount >= 2 ? "animate" : "initial"}
                transition={{ duration: 0.5, ease }}
              >
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border/60 bg-background px-3.5 py-2.5 text-sm leading-5 text-foreground shadow-sm">
                  Great read! Happy to add it. Could you link back to our
                  integrations page from the article in return?
                </div>
                <span className="pl-1 text-[0.65rem] font-medium text-muted-foreground">
                  Marcus · just now
                </span>
              </motion.div>

              {/* Agent's drafted reply — pending approval */}
              <motion.div
                className="flex flex-col items-end gap-1"
                variants={messageIn}
                initial="initial"
                animate={messageCount >= 3 ? "animate" : "initial"}
                transition={{ duration: 0.5, ease }}
              >
                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-dashed border-(--color-blaze-orange)/50 bg-(--color-blaze-orange)/5 px-3.5 py-2.5 text-sm leading-5 text-foreground">
                  Happy to — I&rsquo;ll add a contextual link to your
                  integrations page. Fair trade. Sending the draft over now.
                </div>
                <span className="flex items-center gap-1 pr-1 text-[0.65rem] font-bold text-(--color-blaze-orange)">
                  <IconSparkles className="h-3 w-3" />
                  Agent drafted a reply · needs your OK
                </span>
              </motion.div>

              {/* Approval bar — the one moment you step in */}
              <motion.div
                className="mt-1 rounded-2xl border-t border-border/50 bg-muted/40 px-4 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={showApproval ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease }}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Marcus wants a reciprocal link. Approve the agent&rsquo;s
                  reply?
                </p>
                <div className="mt-2.5 flex gap-2.5">
                  <motion.button
                    type="button"
                    className="flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-semibold text-muted-foreground"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconX className="h-4 w-4" />
                    Reject
                  </motion.button>
                  <motion.button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--color-blaze-orange-2)] to-[var(--color-amber-flame)] py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconCheck className="h-4 w-4" />
                    Approve &amp; send
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
