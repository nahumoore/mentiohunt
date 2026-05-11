import {
  IconArrowRight,
  IconBrandReddit,
  IconLink,
  IconMail,
  IconRobot,
  IconSparkles,
} from "@tabler/icons-react"

function CommunityPanel() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-1.5">
        <IconBrandReddit size={13} className="text-[var(--color-princeton-orange)]" />
        <p className="text-[0.58rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Community Monitoring
        </p>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.53rem] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Reddit post */}
      <div className="rounded-xl border border-[var(--color-border)] bg-background/60 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[0.55rem] font-semibold text-[var(--color-princeton-orange)]">
            r/saas
          </span>
          <span className="text-[0.55rem] text-muted-foreground">· 6h ago</span>
        </div>
        <p className="mb-1.5 text-[0.7rem] font-semibold leading-snug text-foreground">
          Best tool for tracking brand mentions on Reddit?
        </p>
        <p className="text-[0.62rem] leading-4 text-muted-foreground">
          Manually searching is a pain.{" "}
          <span className="rounded bg-[var(--color-princeton-orange)]/15 px-0.5 text-foreground">
            Any recommendations for tools that make this easy?
          </span>
        </p>
        <div className="mt-2 flex items-center gap-2 text-[0.55rem] text-muted-foreground">
          <span>↑ 42</span>
          <span>· 23 comments</span>
        </div>
      </div>

      {/* AI reply */}
      <div className="rounded-xl border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/6 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <IconRobot size={12} className="text-[var(--color-princeton-orange)]" />
          <p className="text-[0.6rem] font-semibold text-[var(--color-princeton-orange)]">
            Mentiohunt suggests a reply
          </p>
          <span className="ml-auto flex items-center gap-0.5 rounded-full border border-[var(--color-blaze-orange)]/20 px-1.5 py-0.5 text-[0.5rem] font-medium text-[var(--color-princeton-orange)]">
            <IconSparkles size={8} />
            AI
          </span>
        </div>
        <p className="line-clamp-3 text-[0.62rem] leading-4 text-muted-foreground">
          Hey! We built{" "}
          <span className="font-semibold text-foreground">Mentiohunt</span> to
          track brand mentions and community fits in real-time. Easy to set up,
          gives you actionable alerts with suggested replies.
        </p>
        <button className="mt-2.5 flex items-center gap-1 rounded-full bg-[var(--color-princeton-orange)] px-3 py-1 text-[0.58rem] font-semibold text-white">
          <IconArrowRight size={10} />
          Use Reply
        </button>
      </div>
    </div>
  )
}

function BacklinkPanel() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-1.5">
        <IconLink size={13} className="text-[var(--color-princeton-orange)]" />
        <p className="text-[0.58rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Backlink Building
        </p>
        <span className="ml-auto rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 px-2 py-0.5 text-[0.53rem] font-semibold text-[var(--color-princeton-orange)]">
          18 this week
        </span>
      </div>

      {/* Opportunity card */}
      <div className="rounded-xl border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 px-2 py-0.5 text-[0.5rem] font-semibold tracking-[0.1em] text-[var(--color-blaze-orange)] uppercase">
              Listicle
            </span>
            <p className="mt-1 text-[0.68rem] font-semibold leading-snug text-foreground">
              12 Best AI Tools for Marketers in 2024
            </p>
            <p className="mt-0.5 text-[0.58rem] text-muted-foreground">
              growthhub.com · DA 61
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-[var(--color-blaze-orange)]/12 px-2.5 py-1 text-sm font-bold tabular-nums text-[var(--color-blaze-orange-2)]">
            91
          </div>
        </div>
      </div>

      {/* Email draft */}
      <div className="rounded-xl border border-[var(--color-border)] bg-background/60">
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-3 py-2">
          <IconMail size={10} className="text-muted-foreground" />
          <p className="text-[0.55rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Draft outreach email
          </p>
        </div>
        <div className="space-y-1.5 px-3 py-2.5 text-[0.62rem]">
          <div className="flex gap-2">
            <span className="shrink-0 pt-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-muted-foreground/60">
              To
            </span>
            <span className="text-muted-foreground">hello@growthhub.com</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 pt-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Sub
            </span>
            <span className="font-medium text-foreground">
              Suggestion for your AI tools roundup
            </span>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] px-3 py-2.5">
          <p className="line-clamp-2 text-[0.6rem] leading-4 text-muted-foreground">
            Hi there, I read your roundup on AI tools for marketers and think
            Mentiohunt would be a natural addition...
          </p>
        </div>
        <div className="px-3 pb-3">
          <button className="flex items-center gap-1 rounded-full bg-[var(--color-princeton-orange)] px-3 py-1 text-[0.58rem] font-semibold text-white">
            <IconSparkles size={9} />
            Review Draft
          </button>
        </div>
      </div>
    </div>
  )
}

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/7 blur-3xl dark:bg-[var(--color-princeton-orange)]/10" />

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-card/95 shadow-[0_20px_70px_-28px_rgba(0,0,0,0.26)] backdrop-blur-xl dark:bg-card">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />

        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
          <span className="ml-4 text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground/50">
            Mentiohunt · Dashboard
          </span>
        </div>

        {/* Two panels */}
        <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <CommunityPanel />
          <BacklinkPanel />
        </div>
      </div>
    </div>
  )
}
