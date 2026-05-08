import Link from "next/link"
import type { ElementType } from "react"
import {
  IconArrowRight,
  IconBroadcast,
  IconMessage2Share,
  IconRadar,
  IconScan,
  IconShieldCheck,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { MOCK_LISTENING_SOURCES } from "./listening-setup/_data"
import { MOCK_COMMUNITY_MENTIONS } from "./reply-queue/_data"

const replyQueueHref = "/dashboard/community-mentions/reply-queue"
const listeningSetupHref = "/dashboard/community-mentions/listening-setup"

export default function CommunityMentionsPage() {
  const replyReadyCount = MOCK_COMMUNITY_MENTIONS.filter(
    (mention) => mention.status === "new" || mention.status === "saved"
  ).length
  const highRelevanceCount = MOCK_COMMUNITY_MENTIONS.filter(
    (mention) => mention.relevanceScore >= 85
  ).length
  const bestRelevanceScore = Math.max(
    ...MOCK_COMMUNITY_MENTIONS.map((mention) => mention.relevanceScore)
  )
  const activeSources = MOCK_LISTENING_SOURCES.filter(
    (source) => source.status === "active"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-orange/20 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_oklch,var(--color-amber-glow)_22%,transparent),transparent_34%),linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_56%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full border border-orange/20" />
        <div className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full border border-orange/30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconBroadcast className="size-7 shrink-0" />
              Community Mentions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find relevant posts across communities, understand why they fit,
              and prepare useful replies before jumping into the conversation.
            </p>
          </div>

          <Button asChild size="sm" className="w-fit rounded-full">
            <Link href={replyQueueHref}>
              Open reply queue
              <IconArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mentions found"
          value={MOCK_COMMUNITY_MENTIONS.length}
          icon={IconScan}
        />
        <StatCard
          label="Reply-ready posts"
          value={replyReadyCount}
          icon={IconMessage2Share}
        />
        <StatCard
          label="High relevance"
          value={highRelevanceCount}
          icon={IconTargetArrow}
        />
        <StatCard
          label="Active sources"
          value={activeSources}
          icon={IconRadar}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <LinkCard
          href={replyQueueHref}
          icon={IconMessage2Share}
          title="Reply queue"
          description="Review posts ranked by relevance, see the plain-language fit rationale, and copy a prepared reply when the conversation is worth joining."
          action="Review posts"
          metric={`${bestRelevanceScore}/100 best score`}
        />
        <LinkCard
          href={listeningSetupHref}
          icon={IconShieldCheck}
          title="Listening setup"
          description="Manage sources, product signals, competitor terms, exclusions, and reply guidelines so discovery stays useful and non-spammy."
          action="Tune scanning"
          metric={`${MOCK_LISTENING_SOURCES.length} sources watched`}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: ElementType
}) {
  return (
    <Card size="sm" className="rounded-3xl py-4 shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-orange/10 text-pumpkin-spice">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function LinkCard({
  href,
  icon: Icon,
  title,
  description,
  action,
  metric,
}: {
  href: string
  icon: ElementType
  title: string
  description: string
  action: string
  metric: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-4xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-orange/20">
        <CardContent className="relative flex h-full flex-col gap-5">
          <div className="absolute right-5 top-5 rounded-full border border-orange/20 px-2.5 py-1 text-xs font-semibold text-pumpkin-spice">
            {metric}
          </div>
          <div className="flex size-12 items-center justify-center rounded-3xl bg-foreground text-background shadow-sm">
            <Icon className="size-5" />
          </div>
          <div className="max-w-xl pt-2">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <p className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-pumpkin-spice">
            {action}
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
