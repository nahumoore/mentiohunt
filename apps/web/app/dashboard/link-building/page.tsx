import Link from "next/link"
import type { ElementType } from "react"
import {
  IconArrowRight,
  IconFileText,
  IconLink,
  IconNotes,
  IconSearch,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { MOCK_ARTICLES, MOCK_SITEMAPS } from "./content-library/_data"
import { MOCK_OPPORTUNITIES } from "./prospects/_data"

const prospectsHref = "/dashboard/link-building/prospects"
const contentLibraryHref = "/dashboard/link-building/content-library"

export default function LinkBuildingPage() {
  const openProspects = MOCK_OPPORTUNITIES.length
  const bestFitScore = Math.max(...MOCK_OPPORTUNITIES.map((opp) => opp.fitScore))
  const activeArticles = MOCK_ARTICLES.filter(
    (article) => article.status === "active"
  ).length
  const activeSitemaps = MOCK_SITEMAPS.filter(
    (sitemap) => sitemap.status === "active"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-orange/20 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_oklch,var(--color-amber-glow)_22%,transparent),transparent_34%),linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_56%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full border border-orange/20" />
        <div className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full border border-orange/30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconLink className="size-7 shrink-0" />
              Link Building Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review your link-building pipeline, keep discovery sources fresh,
              and jump into the next backlink prospect worth acting on.
            </p>
          </div>

          <Button asChild size="sm" className="w-fit rounded-full">
            <Link href={prospectsHref}>
              View prospects
              <IconArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Prospects found" value={openProspects} icon={IconSearch} />
        <StatCard label="Best fit score" value={bestFitScore} icon={IconTargetArrow} />
        <StatCard label="Active articles" value={activeArticles} icon={IconFileText} />
        <StatCard label="Active sitemaps" value={activeSitemaps} icon={IconNotes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LinkCard
          href={prospectsHref}
          icon={IconSearch}
          title="Prospects found"
          description="See qualified websites, fit scores, next actions, and outreach prep for backlink acquisition."
          action="Open prospects"
        />
        <LinkCard
          href={contentLibraryHref}
          icon={IconNotes}
          title="Content library"
          description="Manage the articles and sitemaps Mentiohunt uses to find relevant backlink prospects."
          action="Manage sources"
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
}: {
  href: string
  icon: ElementType
  title: string
  description: string
  action: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-4xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-orange/20">
        <CardContent className="flex h-full flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-12 items-center justify-center rounded-3xl bg-foreground text-background shadow-sm">
              <Icon className="size-5" />
            </div>
            <IconArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-pumpkin-spice" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <p className="mt-auto text-sm font-semibold text-pumpkin-spice">
            {action}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
