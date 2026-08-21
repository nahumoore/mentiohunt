"use client"

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
    <KeywordPriorityList
      keywords={keywords}
      onAdd={onAdd}
      onRemove={onRemove}
      onReorderCommit={onReorderCommit}
      variant="settings"
    />
  )
}
