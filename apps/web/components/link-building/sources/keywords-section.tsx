"use client"

import { MAX_TARGET_KEYWORDS } from "@/consts/onboarding"
import { KeywordPriorityList } from "@/components/keywords/keyword-priority-list"

type KeywordsSectionProps = {
  keywords: string[]
  onAdd: (keyword: string) => Promise<string | null>
  onRemove: (keyword: string) => Promise<string | null>
  onReorderCommit: (keywords: string[]) => Promise<string | null>
}

export function KeywordsSection({
  keywords,
  onAdd,
  onRemove,
  onReorderCommit,
}: KeywordsSectionProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-sm font-medium">Target keywords</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            What you want to rank for. Drag to rank them — priority 1 carries
            the most weight when we pick which of your pages to build links
            to.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {keywords.length} / {MAX_TARGET_KEYWORDS}
        </span>
      </div>

      <div className="px-5 py-4">
        <KeywordPriorityList
          keywords={keywords}
          onAdd={onAdd}
          onRemove={onRemove}
          onReorderCommit={onReorderCommit}
          variant="settings"
        />
      </div>
    </div>
  )
}
