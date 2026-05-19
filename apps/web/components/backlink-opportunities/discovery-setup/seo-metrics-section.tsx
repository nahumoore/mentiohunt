"use client"

import {
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react"
import { Input } from "@workspace/ui/components/input"
import type { ReactNode } from "react"

type SeoMetricsSectionProps = {
  drMin: number
  drMax: number | null
  onDrMinChange: (value: number) => void
  onDrMaxChange: (value: number | null) => void
  footer: ReactNode
}

function clampDomainRating(value: number) {
  if (Number.isNaN(value)) return 0

  return Math.min(100, Math.max(0, Math.round(value)))
}

function DrSlider({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div className="relative mt-4">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-orange"
          style={{ width: `${value}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-orange ring-1 ring-orange/30"
        style={{ left: `${value}%` }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-x-0 -top-1.5 h-5 w-full cursor-pointer opacity-0"
        aria-label={label}
      />
    </div>
  )
}

export function SeoMetricsSection({
  drMin,
  drMax,
  onDrMinChange,
  onDrMaxChange,
  footer,
}: SeoMetricsSectionProps) {
  const drMaxValue = drMax ?? 100

  function updateDrMin(value: string) {
    onDrMinChange(clampDomainRating(Number(value)))
  }

  function updateDrMax(value: string) {
    if (value.trim() === "") {
      onDrMaxChange(null)
      return
    }

    onDrMaxChange(clampDomainRating(Number(value)))
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">SEO metrics</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Limit directory discovery to sites inside the Domain Rating range
          you want in the backlink queue.
        </p>
      </div>

      <div className="grid divide-y divide-border/70 px-5 py-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="pb-5 sm:pb-0 sm:pr-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <IconArrowUp className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Minimum DR</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Exclude sites below this authority floor.
                </p>
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={drMin}
              onChange={(event) => updateDrMin(event.target.value)}
              className="w-20 bg-card text-center font-medium tabular-nums"
              aria-label="Minimum Domain Rating value"
            />
          </div>
          <DrSlider
            value={drMin}
            onChange={updateDrMin}
            label="Minimum Domain Rating"
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Keep this broad until the queue has enough signals.
          </p>
        </div>

        <div className="pt-5 sm:pl-6 sm:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <IconArrowDown className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Maximum DR</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cap discovery when very large sites are too broad.
                </p>
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={drMax ?? ""}
              onChange={(event) => updateDrMax(event.target.value)}
              placeholder="Any"
              className="w-20 bg-card text-center font-medium tabular-nums"
              aria-label="Maximum Domain Rating value"
            />
          </div>
          <DrSlider
            value={drMaxValue}
            onChange={updateDrMax}
            label="Maximum Domain Rating"
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Leave empty to include the strongest directories that match other
            filters.
          </p>
        </div>
      </div>

      {footer}
    </div>
  )
}
