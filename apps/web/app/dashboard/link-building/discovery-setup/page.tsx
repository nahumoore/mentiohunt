"use client"

import { useState } from "react"
import {
  IconRadar,
  IconLayoutGrid,
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconUsers,
  IconCalendar,
  IconWorld,
  IconLink,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-orange/20 bg-[linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_55%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <IconRadar className="size-7 shrink-0" />
            Discovery Setup
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Control which types of backlink opportunities Mentiohunt discovers
            and how they are prioritised in your queue.
          </p>
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
        </TabsList>

        <TabsContent value="backlink-types">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    "flex cursor-pointer gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    !isActive && "opacity-50 grayscale"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                      cfg.color
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{cfg.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
      </Tabs>
    </div>
  )
}
