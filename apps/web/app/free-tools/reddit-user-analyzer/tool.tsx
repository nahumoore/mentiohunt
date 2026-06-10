"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowRight,
  IconBolt,
  IconBulb,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconCopyCheck,
  IconFlame,
  IconLoader2,
  IconLock,
  IconMessage,
  IconNews,
  IconSend,
  IconSparkles,
  IconTag,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type RedditProfile = {
  username: string
  totalKarma: number
  commentKarma: number
  postKarma: number
  accountAgeDays: number
  isVerified: boolean
}

type SubredditActivity = {
  id: string
  name: string
  postsCount: number
  commentsCount: number
  avgScore: number
  category: string
  activityType: "poster" | "commenter" | "both"
}

type InterestTag = {
  label: string
  confidence: "high" | "medium" | "low"
}

type BehaviorInsight = {
  title: string
  description: string
}

type UserAnalysis = {
  profile: RedditProfile
  activeSubreddits: SubredditActivity[]
  interests: InterestTag[]
  behaviorInsights: BehaviorInsight[]
  summary: string
  contentType: string
}

const loadingStages = [
  "Fetching Reddit profile",
  "Analyzing post and comment history",
  "Mapping subreddit activity patterns",
  "Building interest and behavior profile",
]

const proofPoints = [
  "Maps every subreddit the user regularly posts or comments in.",
  "Shows karma split — commenter vs poster — with avg engagement.",
  "Surfaces inferred interests and behavioral patterns from activity.",
]

const activityTypeColors: Record<string, string> = {
  poster:
    "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  commenter:
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  both:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

const confidenceColors: Record<string, string> = {
  high: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  medium:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-border bg-background/70 text-muted-foreground",
}

function formatKarma(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

function formatAccountAge(days: number) {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return `${years}y ${Math.floor((days % 365) / 30)}mo`
  }
  if (days >= 30) return `${Math.floor(days / 30)} months`
  return `${days} days`
}

export function RedditUserAnalyzer() {
  const [username, setUsername] = useState("")
  const [submittedUsername, setSubmittedUsername] = useState("")
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle")
  const [stageIndex, setStageIndex] = useState(0)
  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (phase !== "loading") return
    if (stageIndex >= loadingStages.length - 1) return

    const timer = window.setTimeout(
      () => setStageIndex((current) => current + 1),
      stageIndex === 0 ? 700 : 900
    )

    return () => window.clearTimeout(timer)
  }, [phase, stageIndex])

  useEffect(() => {
    if (phase !== "results") return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = username.trim().replace(/^u\//, "")
    if (!trimmed) return

    setSubmittedUsername(trimmed)
    setStageIndex(0)
    setError(null)
    setPhase("loading")

    const [res] = await Promise.all([
      fetch("/api/free-tool/reddit-user-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      }),
      new Promise((resolve) => window.setTimeout(resolve, 4000)),
    ])

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? "Something went wrong. Please try again.")
      setPhase("idle")
      return
    }

    const data = (await res.json()) as UserAnalysis
    setAnalysis(data)
    setPhase("results")
  }

  const hasResults = phase === "results"
  const [copied, setCopied] = useState(false)

  function formatAnalysisAsText(a: UserAnalysis): string {
    const lines: string[] = []

    lines.push(`Reddit User Analysis: u/${a.profile.username}`)
    lines.push(`${"─".repeat(40)}`)
    lines.push(`Total karma: ${formatKarma(a.profile.totalKarma)}  |  Comment: ${formatKarma(a.profile.commentKarma)}  |  Post: ${formatKarma(a.profile.postKarma)}  |  Age: ${formatAccountAge(a.profile.accountAgeDays)}`)
    lines.push(`Style: ${a.contentType}`)
    lines.push("")

    lines.push("SUMMARY")
    lines.push(a.summary)
    lines.push("")

    if (a.activeSubreddits.length > 0) {
      lines.push("ACTIVE COMMUNITIES")
      for (const sub of a.activeSubreddits) {
        lines.push(`${sub.name} (${sub.category}) — ${sub.activityType} — ${sub.postsCount} posts, ${sub.commentsCount} comments, avg score ${sub.avgScore}`)
      }
      lines.push("")
    }

    if (a.interests.length > 0) {
      lines.push("INTERESTS")
      lines.push(a.interests.map((t) => `${t.label} [${t.confidence}]`).join(", "))
      lines.push("")
    }

    if (a.behaviorInsights.length > 0) {
      lines.push("BEHAVIOR INSIGHTS")
      for (const insight of a.behaviorInsights) {
        lines.push(`${insight.title}: ${insight.description}`)
      }
    }

    return lines.join("\n")
  }

  async function handleCopy() {
    if (!analysis) return
    await navigator.clipboard.writeText(formatAnalysisAsText(analysis))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,var(--color-amber-glow)_0,transparent_23rem),radial-gradient(circle_at_86%_16%,var(--color-blaze-orange)_0,transparent_21rem)] opacity-[0.12]" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <div className="max-w-3xl">
              <Link
                href="/free-tools"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)] transition-colors hover:bg-[var(--color-blaze-orange)]/12"
              >
                <IconBolt size={13} stroke={2.6} />
                Free community tool
              </Link>

              <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-[6.2rem] lg:leading-[0.88]">
                Reddit User Analyzer
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Enter a Reddit username and get a full breakdown of their
                activity — top subreddits, karma split, interest profile, and
                behavior patterns. Useful for understanding who&apos;s engaging
                in your communities.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Username in", "Paste any Reddit handle"],
                  ["Analyze", "Map subreddit activity"],
                  ["Understand", "Interests & behavior"],
                ].map(([label, text]) => (
                  <div
                    key={label}
                    className="rounded-[1.25rem] border border-border bg-card/70 p-4 shadow-sm backdrop-blur"
                  >
                    <p className="font-heading text-lg font-semibold tracking-[-0.035em]">
                      {label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[var(--color-amber-glow)]/16 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 left-10 h-44 w-44 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/25 bg-card p-4 shadow-[0_36px_120px_-56px_rgba(255,96,0,0.75)]">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/80 to-transparent" />

                <div className="rounded-[1.75rem] border border-border/80 bg-background/80 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                        Run an analysis
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em]">
                        Analyze a Reddit user
                      </h2>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                      <IconUser size={22} stroke={2.2} />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                    <label
                      htmlFor="reddit-username"
                      className="text-sm font-medium text-foreground"
                    >
                      Reddit username
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        id="reddit-username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="spez or u/spez"
                        className="h-12 rounded-full border-border bg-card px-5 text-sm shadow-sm"
                        required
                      />
                      <Button
                        type="submit"
                        size="lg"
                        disabled={phase === "loading"}
                        className="h-12 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                      >
                        {phase === "loading" ? "Analyzing" : "Analyze"}
                        {phase === "loading" ? (
                          <IconLoader2 className="animate-spin" size={16} />
                        ) : (
                          <IconArrowRight size={16} stroke={2.5} />
                        )}
                      </Button>
                    </div>
                  </form>

                  {error ? (
                    <div className="mt-5 flex items-start gap-3 rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-3">
                      <IconAlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-destructive"
                        stroke={2.2}
                      />
                      <p className="text-sm leading-6 text-destructive">{error}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[1.4rem] border border-border bg-card p-4">
                    {phase === "idle" ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconBrandRedditNew className="size-5" />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Ready when the username is.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Enter any Reddit username to map their activity and
                            build an interest profile.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {phase === "loading" ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
                            <IconLoader2
                              className="animate-spin"
                              size={20}
                              stroke={2.4}
                            />
                          </div>
                          <div>
                            <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                              Analyzing u/{submittedUsername}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {loadingStages[stageIndex]}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 space-y-2">
                          {loadingStages.map((stage, index) => (
                            <div
                              key={stage}
                              className="flex items-center justify-between gap-3 rounded-full bg-muted/60 px-3 py-2 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {stage}
                              </span>
                              {index < stageIndex ? (
                                <IconCheck
                                  size={15}
                                  className="text-[var(--color-princeton-orange)]"
                                  stroke={2.6}
                                />
                              ) : index === stageIndex ? (
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-princeton-orange)]" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-border" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {hasResults && analysis ? (
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                          <IconCheck size={20} stroke={2.5} />
                        </div>
                        <div>
                          <p className="font-heading text-base font-semibold tracking-[-0.03em]">
                            Analysis complete for u/{submittedUsername}.
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {analysis.activeSubreddits.length} active{" "}
                            {analysis.activeSubreddits.length === 1
                              ? "community"
                              : "communities"}{" "}
                            and {analysis.interests.length} interest signals
                            found.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={resultsRef}
        className="scroll-mt-24 border-y border-border/70 bg-[linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_90%,var(--color-amber-glow)_10%)_100%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                Results
              </p>
              <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                A full picture of who they are on Reddit.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                The analyzer maps subreddit activity, splits karma by content
                type, and infers interests from engagement patterns — giving you
                context before you engage.
              </p>

              <div className="mt-7 space-y-3">
                {proofPoints.map((point) => (
                  <div key={point} className="flex gap-3 text-sm leading-6">
                    <IconCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--color-princeton-orange)]"
                      stroke={2.5}
                    />
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>

              {hasResults && analysis ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="mt-6 h-9 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-4 text-xs font-semibold hover:bg-[var(--color-blaze-orange)]/8"
                >
                  {copied ? (
                    <>
                      <IconCopyCheck size={14} stroke={2.4} className="text-[var(--color-princeton-orange)]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <IconCopy size={14} stroke={2.2} />
                      Copy as text
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              {!hasResults ? (
                <div className="rounded-[2rem] border border-dashed border-[var(--color-blaze-orange)]/30 bg-card/70 p-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconUser size={22} stroke={2.2} />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.045em]">
                    Results appear after the analysis.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    Enter a Reddit username above to get a full activity
                    breakdown, interest profile, and behavior insights.
                  </p>
                </div>
              ) : analysis ? (
                <>
                  {/* Profile summary stats */}
                  <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
                    <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-princeton-orange)]">
                          <IconBrandRedditNew className="size-5" />
                        </div>
                        <div>
                          <p className="font-heading text-lg font-semibold tracking-[-0.04em]">
                            u/{analysis.profile.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysis.contentType}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-y divide-border/70 sm:grid-cols-4">
                      {[
                        {
                          icon: IconFlame,
                          label: "Total karma",
                          value: formatKarma(analysis.profile.totalKarma),
                        },
                        {
                          icon: IconMessage,
                          label: "Comment karma",
                          value: formatKarma(analysis.profile.commentKarma),
                        },
                        {
                          icon: IconNews,
                          label: "Post karma",
                          value: formatKarma(analysis.profile.postKarma),
                        },
                        {
                          icon: IconCalendar,
                          label: "Account age",
                          value: formatAccountAge(analysis.profile.accountAgeDays),
                        },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="px-5 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Icon size={13} stroke={2.2} />
                            <span className="text-[0.65rem] font-semibold uppercase">
                              {label}
                            </span>
                          </div>
                          <p className="mt-1.5 font-heading text-2xl font-semibold tracking-[-0.05em] text-[var(--color-princeton-orange)]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-2.5">
                      <IconBulb
                        size={16}
                        className="text-[var(--color-princeton-orange)]"
                        stroke={2.3}
                      />
                      <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                        Profile summary
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Active subreddits */}
                  {analysis.activeSubreddits.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 px-1">
                        <IconUsers
                          size={15}
                          className="text-muted-foreground/50"
                          stroke={2.2}
                        />
                        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                          Active communities
                        </p>
                      </div>

                      {analysis.activeSubreddits.map((sub, index) => {
                        const activityColor =
                          activityTypeColors[sub.activityType] ??
                          "border-border bg-background/70 text-muted-foreground"

                        return (
                          <article
                            key={sub.id}
                            className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/35 hover:shadow-[0_22px_70px_-54px_rgba(255,96,0,0.65)] sm:p-6"
                          >
                            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-flame)]/65 to-transparent" />

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 text-[var(--color-princeton-orange)]">
                                  <IconBrandRedditNew className="size-6" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-heading text-2xl font-semibold tracking-[-0.045em]">
                                      {sub.name}
                                    </h3>
                                    <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {sub.category}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityColor}`}
                                >
                                  {sub.activityType === "both"
                                    ? "poster & commenter"
                                    : sub.activityType}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3 rounded-[1.1rem] border border-border/70 bg-muted/30 p-3">
                              <div className="text-center">
                                <p className="font-heading text-lg font-semibold tracking-[-0.04em]">
                                  {sub.postsCount}
                                </p>
                                <p className="mt-0.5 text-[0.62rem] uppercase text-muted-foreground/60">
                                  posts
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="font-heading text-lg font-semibold tracking-[-0.04em]">
                                  {sub.commentsCount}
                                </p>
                                <p className="mt-0.5 text-[0.62rem] uppercase text-muted-foreground/60">
                                  comments
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--color-princeton-orange)]">
                                  {sub.avgScore}
                                </p>
                                <p className="mt-0.5 text-[0.62rem] uppercase text-muted-foreground/60">
                                  avg score
                                </p>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : null}

                  {/* Interest tags */}
                  {analysis.interests.length > 0 ? (
                    <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-2.5">
                        <IconTag
                          size={15}
                          className="text-muted-foreground/50"
                          stroke={2.2}
                        />
                        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                          Inferred interests
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {analysis.interests.map((interest) => (
                          <span
                            key={interest.label}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${confidenceColors[interest.confidence]}`}
                          >
                            {interest.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Behavior insights */}
                  {analysis.behaviorInsights.length > 0 ? (
                    <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-2.5">
                        <IconBulb
                          size={15}
                          className="text-muted-foreground/50"
                          stroke={2.2}
                        />
                        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                          Behavior insights
                        </p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {analysis.behaviorInsights.map((insight) => (
                          <div
                            key={insight.title}
                            className="rounded-[1.1rem] border border-border/70 bg-muted/30 p-4"
                          >
                            <p className="text-sm font-semibold">{insight.title}</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {insight.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Locked CTA */}
                  <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/25 bg-card p-6 shadow-[0_28px_90px_-54px_rgba(255,96,0,0.75)] sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--color-amber-glow)_0,transparent_17rem)] opacity-[0.14]" />
                    <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-border/70 bg-background/55 blur-sm" />
                    <div className="relative mx-auto max-w-xl text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white shadow-lg shadow-primary/20">
                        <IconLock size={23} stroke={2.5} />
                      </div>
                      <p className="mt-5 text-[0.65rem] font-semibold uppercase text-[var(--color-princeton-orange)]">
                        Unlock community monitoring
                      </p>
                      <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.055em] text-balance">
                        Find threads where your product belongs — before anyone
                        else replies.
                      </h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                        Mentiohunt watches your target communities for posts
                        matching your product and surfaces them with a suggested
                        reply while the thread is still active.
                      </p>
                      <Button
                        asChild
                        size="lg"
                        className="mt-6 h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                      >
                        <Link href="/signup">
                          Sign up to continue
                          <IconSparkles size={16} stroke={2.4} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[var(--color-blaze-orange)]/20 bg-card p-7 shadow-[0_30px_100px_-55px_rgba(255,96,0,0.55)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--color-blaze-orange)]/12 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground/60">
                  More than a profile lookup
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
                  Turn Reddit activity into a reply queue that works.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Mentiohunt monitors communities continuously — finding threads
                  where your product fits and drafting a suggested reply so you
                  can engage while the conversation is live.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full px-7 text-sm font-semibold shadow-md shadow-primary/25"
                >
                  <Link href="/signup">
                    Start monitoring
                    <IconSend size={16} stroke={2.4} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-full border-[var(--color-blaze-orange)]/25 bg-background/70 px-7 text-sm hover:bg-[var(--color-blaze-orange)]/8"
                >
                  <Link href="/free-tools">Back to free tools</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
