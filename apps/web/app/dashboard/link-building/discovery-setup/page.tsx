"use client"

import { useState } from "react"
import {
  IconLayoutGrid,
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconUsers,
  IconCalendar,
  IconWorld,
  IconLink,
  IconExternalLink,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Switch } from "@workspace/ui/components/switch"

import { TYPE_CONFIG } from "@/lib/opportunity-types"
import type { OpportunityType } from "@/lib/opportunity-types"
import { useProductStore } from "@/stores/product-store"

const OPPORTUNITY_TYPES = Object.keys(TYPE_CONFIG) as OpportunityType[]

interface TargetWebsiteFilters {
  drMin: number
  drMax: number
  trafficMin: number
  domainAgeMin: number
  dofollowOnly: boolean
  languages: string[]
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
]

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "")
  }
}

function RangeRow({
  label,
  description,
  icon: Icon,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  min,
  max,
  unit,
}: {
  label: string
  description: string
  icon: React.ElementType
  minValue: number
  maxValue: number
  onMinChange: (v: number) => void
  onMaxChange: (v: number) => void
  minPlaceholder: string
  maxPlaceholder: string
  min: number
  max: number
  unit?: string
}) {
  return (
    <div className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={minValue || ""}
              onChange={(e) => onMinChange(Number(e.target.value))}
              placeholder={minPlaceholder}
              min={min}
              max={max}
              className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">to</span>
          <div className="relative flex-1">
            <input
              type="number"
              value={maxValue || ""}
              onChange={(e) => onMaxChange(Number(e.target.value))}
              placeholder={maxPlaceholder}
              min={min}
              max={max}
              className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MinRow({
  label,
  description,
  icon: Icon,
  value,
  onChange,
  placeholder,
  min,
  unit,
}: {
  label: string
  description: string
  icon: React.ElementType
  value: number
  onChange: (v: number) => void
  placeholder: string
  min: number
  unit?: string
}) {
  return (
    <div className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
        <div className="mt-3">
          <div className="relative max-w-[180px]">
            <input
              type="number"
              value={value || ""}
              onChange={(e) => onChange(Number(e.target.value))}
              placeholder={placeholder}
              min={min}
              className="w-full rounded-xl border border-border bg-background px-3 py-1.5 pr-10 text-sm tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DiscoverySetupPage() {
  const product = useProductStore((state) => state.product)
  const [activeTypes, setActiveTypes] = useState<Set<OpportunityType>>(
    () => new Set(OPPORTUNITY_TYPES)
  )
  const [filters, setFilters] = useState<TargetWebsiteFilters>({
    drMin: 0,
    drMax: 0,
    trafficMin: 0,
    domainAgeMin: 0,
    dofollowOnly: true,
    languages: ["en"],
  })

  function toggle(type: OpportunityType) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function toggleLanguage(lang: string) {
    setFilters((prev) => {
      const next = prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang]
      return { ...prev, languages: next }
    })
  }

  const activeWebsiteFilters = [
    filters.drMin > 0 || filters.drMax > 0,
    filters.trafficMin > 0,
    filters.domainAgeMin > 0,
    filters.dofollowOnly,
    filters.languages.length > 0,
  ].filter(Boolean).length
  const competitors = product?.competitors ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span>Discovery controls</span>
              <span className="h-px w-8 bg-orange" />
              <span className="tabular-nums">
                {activeTypes.size} types active
              </span>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Discovery setup
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Choose which sources should feed your backlink queue. Start broad,
              then pause anything that feels noisy.
            </p>
          </div>

          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border/70 bg-card p-1 shadow-sm">
            <span className="shrink-0 rounded-full bg-orange px-3 py-1.5 text-xs font-semibold text-foreground">
              Backlink types
              <span className="ml-1.5 tabular-nums opacity-65">
                {activeTypes.size}/{OPPORTUNITY_TYPES.length}
              </span>
            </span>
            <span className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              Website filters
              <span className="ml-1.5 tabular-nums opacity-65">
                {activeWebsiteFilters}
              </span>
            </span>
            <span className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              Competitors
              <span className="ml-1.5 tabular-nums opacity-65">
                {competitors.length}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="backlink-types" className="gap-4">
        <TabsList>
          <TabsTrigger value="backlink-types">
            <IconLayoutGrid className="size-4" />
            <span>Backlink Types</span>
            <span data-slot="tab-count">
              {activeTypes.size}/{OPPORTUNITY_TYPES.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="target-websites">
            <IconAdjustmentsHorizontal className="size-4" />
            <span>Target Websites</span>
            <span data-slot="tab-count">
              {activeWebsiteFilters}
            </span>
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <IconUsers className="size-4" />
            <span>Competitors</span>
            <span data-slot="tab-count">{competitors.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backlink-types">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            <div className="border-b border-border/70 px-5 py-4">
              <p className="text-sm font-medium">Backlink types</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose the sources you want Mentiohunt to look for.
              </p>
            </div>
            {OPPORTUNITY_TYPES.map((type) => {
              const cfg = TYPE_CONFIG[type]
              const Icon = cfg.icon
              const isActive = activeTypes.has(type)

              return (
                <div
                  key={type}
                  onClick={() => toggle(type)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggle(type)
                  }}
                  role="switch"
                  aria-checked={isActive}
                  tabIndex={0}
                  className={cn(
                    "group flex cursor-pointer items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    !isActive && "opacity-50 grayscale hover:opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                      cfg.color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-medium">{cfg.label}</p>
                      {!isActive && (
                        <span className="text-xs text-muted-foreground">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {cfg.description}
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggle(type)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 shrink-0"
                    tabIndex={-1}
                  />
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="target-websites">
          <div className="flex flex-col gap-3">
            <RangeRow
              label="Domain Rating (DR)"
              description="Only surface opportunities from sites within this DR range. Leave blank for no limit."
              icon={IconChartBar}
              minValue={filters.drMin}
              maxValue={filters.drMax}
              onMinChange={(v) => setFilters((p) => ({ ...p, drMin: v }))}
              onMaxChange={(v) => setFilters((p) => ({ ...p, drMax: v }))}
              minPlaceholder="Min DR"
              maxPlaceholder="Max DR"
              min={0}
              max={100}
            />

            <MinRow
              label="Monthly Traffic"
              description="Exclude sites below this estimated monthly visitor threshold."
              icon={IconUsers}
              value={filters.trafficMin}
              onChange={(v) => setFilters((p) => ({ ...p, trafficMin: v }))}
              placeholder="e.g. 10000"
              min={0}
            />

            <MinRow
              label="Domain Age"
              description="Minimum site age. Older domains tend to carry more authority and consistent traffic."
              icon={IconCalendar}
              value={filters.domainAgeMin}
              onChange={(v) => setFilters((p) => ({ ...p, domainAgeMin: v }))}
              placeholder="e.g. 2"
              min={0}
              unit="yr"
            />

            {/* Dofollow only */}
            <div className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <IconLink className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Dofollow only</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Skip sites that are known to nofollow all outbound links.
                </p>
              </div>
              <Switch
                checked={filters.dofollowOnly}
                onCheckedChange={(v) =>
                  setFilters((p) => ({ ...p, dofollowOnly: v }))
                }
                className="mt-0.5 shrink-0"
              />
            </div>

            {/* Language */}
            <div className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <IconWorld className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Site language</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Restrict discovery to sites in these languages.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const active = filters.languages.includes(lang.value)
                    return (
                      <button
                        key={lang.value}
                        onClick={() => toggleLanguage(lang.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        {lang.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="competitors">
          {competitors.length === 0 ? (
            <div className="rounded-3xl bg-card p-6 ring-1 ring-foreground/5 shadow-sm">
              <div className="max-w-xl">
                <p className="text-sm font-medium">No competitors added yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add competitor sites during product setup so discovery can find
                  overlap, comparison pages, and alternative-page opportunities.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {competitors.map((competitor) => (
                <a
                  key={competitor}
                  href={competitor}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm transition-all hover:-translate-y-0.5 hover:ring-orange/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/10">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getHostname(competitor)}&sz=32`}
                      className="size-5 rounded"
                      alt=""
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {getHostname(competitor)}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
                      {competitor}
                    </p>
                  </div>
                  <IconExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
