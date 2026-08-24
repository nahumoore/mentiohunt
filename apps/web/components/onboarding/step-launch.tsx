"use client"

import type { OnboardingData } from "@/consts/onboarding"
import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

type Row = [string, string, ReactNode?]

export function StepLaunch({ data }: { data: OnboardingData }) {
  const rows: Row[] = [
    ["Product", data.productName || "—"],
    [
      "Website",
      data.websiteUrl || "—",
      (() => {
        try {
          const hostname = new URL(data.websiteUrl).hostname
          return (
            <img
              key="favicon"
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt=""
              className="h-3.5 w-3.5 shrink-0 rounded-sm"
            />
          )
        } catch {
          return null
        }
      })(),
    ],
    ["Competitors", `${data.competitors.length} URLs`],
    ["Target keywords", `${data.targetKeywords.length} keyword${data.targetKeywords.length === 1 ? "" : "s"}`],
    [
      "Important pages",
      data.importantPages.length === 0
        ? "Auto-discovered from keywords"
        : data.autoDiscoverPages
          ? `${data.importantPages.length} page${data.importantPages.length === 1 ? "" : "s"} + auto-discovery`
          : `${data.importantPages.length} page${data.importantPages.length === 1 ? "" : "s"}`,
    ],
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-1">
        {rows.map(([label, value, icon], index) => (
          <div
            key={label}
            className={cn(
              "flex items-start justify-between gap-4 px-4 py-3",
              index < rows.length - 1 && "border-b border-border"
            )}
          >
            <span className="text-[0.7rem] leading-5 font-bold text-muted-foreground uppercase">
              {label}
            </span>
            <span className="flex items-center gap-1.5 text-right text-sm text-foreground">
              {icon}
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
