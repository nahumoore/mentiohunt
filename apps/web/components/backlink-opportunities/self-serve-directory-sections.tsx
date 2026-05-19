import {
  IconChartBar,
  IconChartDots,
  IconClipboardCheck,
  IconCurrencyDollar,
  IconExternalLink,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLink,
  IconSearch,
  IconShieldCheck,
  IconWorld,
} from "@tabler/icons-react"
import type { Tables } from "@workspace/supabase/database-types"
import { cn } from "@workspace/ui/lib/utils"

import { formatDate } from "@/app/dashboard/link-building/opportunities/_data"
import type { ProspectDetail } from "@/stores/prospect-store"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { SectionLabel } from "./section-label"
import {
  getDomainRatingBandLabel,
  getDomainRatingColorScheme,
  getSerpUrl,
  type ProspectProduct,
} from "./utils"

type Directory = Tables<"directories">

type DirectoryMetricKey =
  | "domain_rating"
  | "backlinks"
  | "referring_domains"
  | "dofollow_backlinks"
  | "dofollow_referring_domains"

type DirectoryMetricSource = Pick<Directory, DirectoryMetricKey>

type DirectoryMetricDefinition = {
  key: DirectoryMetricKey
  label: string
  icon: typeof IconChartBar
  detail: string
}

const DIRECTORY_METRIC_DEFINITIONS: DirectoryMetricDefinition[] = [
  {
    key: "domain_rating",
    label: "Domain Rating",
    icon: IconChartBar,
    detail: "Ahrefs authority score for the root domain.",
  },
  {
    key: "referring_domains",
    label: "Referring Domains",
    icon: IconWorld,
    detail: "Unique domains currently linking to this site.",
  },
  {
    key: "backlinks",
    label: "Backlinks",
    icon: IconSearch,
    detail: "Total backlinks discovered for the domain.",
  },
  {
    key: "dofollow_referring_domains",
    label: "Dofollow Ref Domains",
    icon: IconShieldCheck,
    detail: "Domains that can pass link equity.",
  },
  {
    key: "dofollow_backlinks",
    label: "Dofollow Backlinks",
    icon: IconLink,
    detail: "Dofollow links found across the domain.",
  },
]

const SECONDARY_DIRECTORY_METRICS = DIRECTORY_METRIC_DEFINITIONS.filter(
  (metric) => metric.key !== "domain_rating"
)

export function SelfServeDirectorySections({
  prospect,
  product,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
}) {
  const serpUrl = getSerpUrl(prospect, product)
  const directory = prospect.directory
  const directoryName = directory?.name ?? prospect.domain
  const directoryDomain = directory?.domain ?? prospect.domain
  const submitUrl = directory?.submit_url ?? prospect.target_url
  const category = toTitleCase(directory?.category ?? "Directory")
  const pricingLabel = directory
    ? directory.is_free
      ? "Free submission"
      : "Paid listing"
    : "Pricing unknown"
  const pricingTone =
    directory?.is_free === true ? "free" : directory ? "paid" : "unknown"
  const metricValues = getDirectoryMetricValues(directory)
  const domainRating = metricValues.domain_rating
  const backlinks = metricValues.backlinks
  const referringDomains = metricValues.referring_domains
  const metricsUpdatedAt = directory?.seo_metrics_updated_at ?? null
  const submitUrlVerifiedAt = directory?.submit_url_verified_at ?? null
  const availableMetricCount = getAvailableMetricCount(
    Object.values(metricValues)
  )
  const hasSeoMetrics = availableMetricCount > 0
  const metricsBadgeLabel = metricsUpdatedAt
    ? `Updated ${formatDate(metricsUpdatedAt)}`
    : "Metrics pending"
  const strengthSummary = getStrengthSummary({
    domainRating,
    backlinks,
    referringDomains,
  })

  return (
    <Tabs defaultValue="overview" className="gap-4">
      <TabsList>
        <TabsTrigger value="overview">
          <IconLayoutDashboard className="size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <IconChartBar className="size-4" />
          Metrics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="pointer-events-none absolute -top-24 -right-20 size-56 rounded-full bg-princeton-orange/10 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <SectionLabel>Recommended action</SectionLabel>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                    Submit {product.productName} to {directoryName}.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    This opportunity is queued because we have not found an
                    indexed listing for {product.productName} on{" "}
                    {directoryDomain}. Start with the submission page, then
                    confirm whether Google can see the listing.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-princeton-orange/20 bg-princeton-orange/10 px-3 py-1 text-xs font-semibold text-blaze-orange">
                  <IconClipboardCheck className="size-3.5" />
                  Self-serve
                </span>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Next Step</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Submit only if the category and pricing fit your backlink
                    plan.
                  </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <a href={submitUrl} target="_blank" rel="noopener noreferrer">
                    Open submission page
                    <IconExternalLink className="size-4" />
                  </a>
                </Button>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-princeton-orange/10 text-blaze-orange">
                      <IconSearch className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">
                          Verification query
                        </p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Why indexed backlinks matter"
                                className="rounded-full text-muted-foreground transition-colors hover:text-blaze-orange focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                              >
                                <IconInfoCircle className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={8}
                              className="max-w-[280px] items-start rounded-2xl px-3.5 py-3 text-left leading-5"
                            >
                              Backlinks count the most when Google indexes the
                              page. If the listing is not indexed, it loses a
                              lot of the SEO value and authority it can pass to
                              your site.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Check this after submission or approval.
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <a href={serpUrl} target="_blank" rel="noopener noreferrer">
                      Check indexed listing
                      <IconExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
              <SectionLabel>Directory facts</SectionLabel>
              <div className="space-y-3">
                <DirectoryFact label="Category" value={category} />
                <div
                  className={cn(
                    "rounded-2xl border p-3.5",
                    pricingTone === "free" &&
                      "border-emerald-500/25 bg-emerald-500/10",
                    pricingTone === "paid" && "border-red-500/25 bg-red-500/10",
                    pricingTone === "unknown" &&
                      "border-princeton-orange/20 bg-princeton-orange/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-background",
                        pricingTone === "free" && "text-emerald-700",
                        pricingTone === "paid" && "text-red-700",
                        pricingTone === "unknown" && "text-blaze-orange"
                      )}
                    >
                      <IconCurrencyDollar className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Pricing
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {pricingLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <DirectoryFact
                  label="Metrics Updated"
                  value={
                    metricsUpdatedAt ? formatDate(metricsUpdatedAt) : "Pending"
                  }
                />
              </div>
            </section>
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="metrics">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -top-28 right-8 size-56 rounded-full bg-princeton-orange/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 size-64 rounded-full bg-princeton-orange/10 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionLabel>SEO metrics</SectionLabel>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                  Domain strength snapshot for {directoryDomain}.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Uses the stored directory metrics from the latest SEO refresh.
                  Missing values mean this directory has not been analyzed yet.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                <IconChartDots className="size-3.5" />
                {metricsBadgeLabel}
              </span>
            </div>

            <div
              className={cn(
                "relative overflow-hidden rounded-[28px] border p-5 shadow-sm sm:p-6",
                getDomainRatingColorScheme(domainRating).panelClass
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-r from-white/18 via-transparent to-white/8" />
              <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                <ScoreRing label="Domain Rating" value={domainRating} />

                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-current/70 uppercase">
                        Authority snapshot
                      </p>
                      <h3 className="mt-3 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-[2.2rem]">
                        {getDomainRatingHeadline(domainRating)}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-current/75">
                        {strengthSummary}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-current/12 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-current/65 uppercase">
                        Rating band
                      </p>
                      <p className="mt-1 font-semibold">
                        {getDomainRatingBandLabel(domainRating)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricPill label="Domain" value={directoryDomain} />
                    <MetricPill
                      label="Metrics Refresh"
                      value={
                        metricsUpdatedAt
                          ? formatDate(metricsUpdatedAt)
                          : "Pending"
                      }
                    />
                    <MetricPill
                      label="Coverage"
                      value={`${availableMetricCount} of ${DIRECTORY_METRIC_DEFINITIONS.length} metrics`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SECONDARY_DIRECTORY_METRICS.map((metric) => (
                <MetricTile
                  key={metric.key}
                  icon={metric.icon}
                  label={metric.label}
                  value={formatOptionalCompactNumber(metricValues[metric.key])}
                  detail={metric.detail}
                />
              ))}
              <MetricTile
                icon={IconClipboardCheck}
                label="Submit URL Check"
                value={getSubmitUrlStatus(directory?.submit_url_ok)}
                detail={
                  submitUrlVerifiedAt
                    ? `Verified ${formatDate(submitUrlVerifiedAt)}`
                    : "No verification timestamp"
                }
              />
              <MetricTile
                icon={IconChartDots}
                label="Metrics Available"
                value={`${availableMetricCount} of ${DIRECTORY_METRIC_DEFINITIONS.length}`}
                detail="Domain rating, backlink totals, and dofollow link counts."
              />
            </div>

            {!hasSeoMetrics && (
              <p className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
                SEO metrics have not been populated for this directory yet. Use
                category fit and pricing before prioritizing submission.
              </p>
            )}
          </div>
        </section>
      </TabsContent>
    </Tabs>
  )
}

function ScoreRing({ label, value }: { label: string; value: number | null }) {
  const score = value ?? 0
  const scoreDegrees = Math.max(0, Math.min(100, score)) * 3.6
  const tone = getDomainRatingColorScheme(value)

  return (
    <div className="flex items-center gap-4 sm:flex-col sm:items-start">
      <div
        className="grid size-36 place-items-center rounded-full p-2 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.45)]"
        style={{
          background: `conic-gradient(${tone.accent} ${scoreDegrees}deg, color-mix(in oklab, ${tone.track} 82%, transparent) 0deg)`,
        }}
      >
        <div
          className="grid size-full place-items-center rounded-full border shadow-sm"
          style={{
            background: tone.center,
            borderColor: tone.border,
          }}
        >
          <div className="text-center">
            <p
              className="font-heading text-5xl font-bold"
              style={{ color: tone.accent }}
            >
              {value ?? "--"}
            </p>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/80 uppercase">
              {value === null ? "pending" : "/ 100"}
            </p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-current/90">{label}</p>
        <p className="mt-1 max-w-40 text-xs leading-5 text-current/70">
          Color shifts from weak to strong as the score moves from 0 to 100.
        </p>
      </div>
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof IconChartBar
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-princeton-orange/10 text-blaze-orange">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-background/10 bg-background/10 p-4">
      <p className="text-xs font-medium text-background/60">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-current/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-current/60 uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-current/92">
        {value}
      </p>
    </div>
  )
}

function DirectoryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-3.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

function formatCompactNumber(value: number) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatOptionalCompactNumber(value: number | null) {
  return value === null ? "Not available" : formatCompactNumber(value)
}

function getAvailableMetricCount(values: Array<number | null>) {
  return values.filter((value) => value !== null).length
}

function getDirectoryMetricValues(directory: DirectoryMetricSource | null) {
  return DIRECTORY_METRIC_DEFINITIONS.reduce(
    (metrics, { key }) => {
      metrics[key] = directory?.[key] ?? null
      return metrics
    },
    {} as Record<DirectoryMetricKey, number | null>
  )
}

function getSubmitUrlStatus(value: boolean | undefined) {
  if (value === undefined) return "Unknown"
  return value ? "Verified" : "Needs review"
}

function getDomainRatingHeadline(value: number | null) {
  if (value === null) return "No domain rating has been captured yet."
  if (value >= 70) return "This directory carries strong domain authority."
  if (value >= 40) return "This directory has a workable authority profile."
  return "This directory is lower authority, so fit matters more."
}

function getStrengthSummary({
  domainRating,
  backlinks,
  referringDomains,
}: {
  domainRating: number | null
  backlinks: number | null
  referringDomains: number | null
}) {
  if (
    domainRating === null &&
    backlinks === null &&
    referringDomains === null
  ) {
    return "Analyze the directory before using metrics to prioritize it."
  }

  if (
    (domainRating ?? 0) >= 50 ||
    (referringDomains ?? 0) >= 1000 ||
    (backlinks ?? 0) >= 10000
  ) {
    return "Strong enough to prioritize if the listing gets indexed."
  }

  return "Useful if the category fit is tight and submission effort is low."
}

function toTitleCase(value: string) {
  return value
    .split(/([\s-]+)/)
    .map((part) =>
      /^[\s-]+$/.test(part)
        ? part
        : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`
    )
    .join("")
}
