import {
  IconChartDots,
  IconClipboardCheck,
  IconCurrencyDollar,
  IconExternalLink,
  IconChartBar,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLink,
  IconSearch,
  IconShieldCheck,
  IconWorld,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type { ProspectDetail } from "@/stores/prospect-store"
import { formatDate } from "@/app/dashboard/link-building/prospects/_data"
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
import { getSerpUrl, type ProspectProduct } from "./utils"

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
  const domainRating = directory?.domain_rating ?? null
  const backlinks = directory?.backlinks ?? null
  const referringDomains = directory?.referring_domains ?? null
  const dofollowBacklinks = directory?.dofollow_backlinks ?? null
  const dofollowReferringDomains = directory?.dofollow_referring_domains ?? null
  const metricsUpdatedAt = directory?.seo_metrics_updated_at ?? null
  const submitUrlVerifiedAt = directory?.submit_url_verified_at ?? null
  const hasSeoMetrics = [
    domainRating,
    backlinks,
    referringDomains,
    dofollowBacklinks,
    dofollowReferringDomains,
  ].some((value) => value !== null)
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
          <div className="pointer-events-none absolute -top-28 right-8 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
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

            <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4 sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <ScoreRing
                    label="Domain Rating"
                    value={domainRating}
                    tone="orange"
                  />
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <MetricTile
                      icon={IconWorld}
                      label="Domain"
                      value={directoryDomain}
                    />
                    <MetricTile
                      icon={IconShieldCheck}
                      label="Dofollow Ref Domains"
                      value={formatOptionalCompactNumber(
                        dofollowReferringDomains
                      )}
                      detail="Domains passing link equity"
                    />
                    <MetricTile
                      icon={IconSearch}
                      label="Backlinks"
                      value={formatOptionalCompactNumber(backlinks)}
                    />
                    <MetricTile
                      icon={IconChartBar}
                      label="Metrics Refresh"
                      value={
                        metricsUpdatedAt
                          ? formatDate(metricsUpdatedAt)
                          : "Pending"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-foreground p-5 text-background shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-background/55 uppercase">
                      Link equity
                    </p>
                    <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                      {strengthSummary}
                    </h3>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/10 text-amber-flame">
                    <IconLink className="size-5" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <DarkMetric
                    label="Referring Domains"
                    value={formatOptionalCompactNumber(referringDomains)}
                  />
                  <DarkMetric
                    label="Dofollow Backlinks"
                    value={formatOptionalCompactNumber(dofollowBacklinks)}
                  />
                </div>

                {!hasSeoMetrics && (
                  <p className="mt-4 rounded-2xl border border-background/10 bg-background/10 p-3 text-xs leading-5 text-background/65">
                    SEO metrics have not been populated for this directory yet.
                    Use category fit and pricing before prioritizing submission.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
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
                value={`${getAvailableMetricCount([
                  domainRating,
                  backlinks,
                  referringDomains,
                  dofollowBacklinks,
                  dofollowReferringDomains,
                ])} of 5`}
                detail="DR, backlinks, referring domains, and dofollow counts."
              />
            </div>
          </div>
        </section>
      </TabsContent>
    </Tabs>
  )
}

function ScoreRing({
  label,
  value,
  tone,
}: {
  label: string
  value: number | null
  tone: "orange"
}) {
  const colorClass = tone === "orange" ? "text-blaze-orange" : "text-primary"
  const score = value ?? 0
  const scoreDegrees = Math.max(0, Math.min(100, score)) * 3.6

  return (
    <div className="flex items-center gap-4 sm:flex-col sm:items-start">
      <div
        className="grid size-32 place-items-center rounded-full p-2"
        style={{
          background: `conic-gradient(var(--blaze-orange) ${scoreDegrees}deg, color-mix(in oklab, var(--border) 75%, transparent) 0deg)`,
        }}
      >
        <div className="grid size-full place-items-center rounded-full bg-card shadow-sm">
          <div className="text-center">
            <p className={cn("font-heading text-4xl font-bold", colorClass)}>
              {value ?? "--"}
            </p>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {value === null ? "pending" : "/ 100"}
            </p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 max-w-36 text-xs leading-5 text-muted-foreground">
          Ahrefs domain rating score for the root domain.
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

function getSubmitUrlStatus(value: boolean | undefined) {
  if (value === undefined) return "Unknown"
  return value ? "Verified" : "Needs review"
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
