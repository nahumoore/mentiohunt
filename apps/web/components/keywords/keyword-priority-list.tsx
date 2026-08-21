"use client"

import { MAX_TARGET_KEYWORDS, MIN_TARGET_KEYWORDS } from "@/consts/onboarding"
import { PriorityReorderList } from "@/components/ui/priority-reorder-list"
import { IconLoader2, IconPlus, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useState, type KeyboardEvent } from "react"

type MaybePromise<T> = T | Promise<T>

export type KeywordPriorityListProps = {
  keywords: string[]
  /** See PriorityReorderList — fires immediately with the new order, including mid-drag. */
  onReorder?: (keywords: string[]) => void
  /** See PriorityReorderList — fires once the order settles. Return an error message to roll back. */
  onReorderCommit?: (keywords: string[]) => MaybePromise<string | null>
  onAdd: (keyword: string) => MaybePromise<string | null>
  onRemove: (keyword: string) => MaybePromise<string | null>
  variant?: "onboarding" | "settings"
}

export function KeywordPriorityList({
  keywords,
  onReorder,
  onReorderCommit,
  onAdd,
  onRemove,
  variant = "settings",
}: KeywordPriorityListProps) {
  const isOnboarding = variant === "onboarding"

  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null)

  const atMax = keywords.length >= MAX_TARGET_KEYWORDS
  const atMin = keywords.length <= MIN_TARGET_KEYWORDS

  async function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed || isAdding) return

    if (atMax) {
      setError(`You can rank up to ${MAX_TARGET_KEYWORDS} target keywords.`)
      return
    }

    setIsAdding(true)
    setError(null)

    const result = await onAdd(trimmed)

    if (result) {
      setError(result)
    } else {
      setValue("")
    }

    setIsAdding(false)
  }

  async function handleRemove(keyword: string) {
    if (removingKeyword) return

    if (atMin) {
      setError(`Keep at least ${MIN_TARGET_KEYWORDS} target keywords.`)
      return
    }

    setRemovingKeyword(keyword)
    setError(null)

    const result = await onRemove(keyword)

    if (result) setError(result)
    setRemovingKeyword(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    void handleAdd()
  }

  const inputHeight = isOnboarding ? "h-12" : "h-10"

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="backlink outreach software"
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isAdding || atMax}
          className={cn(inputHeight, "flex-1")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleAdd()}
          disabled={!value.trim() || isAdding || atMax}
          className={cn(inputHeight, "shrink-0 rounded-lg")}
        >
          {isAdding ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconPlus className="size-4" />
          )}
          Add
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {atMax && !error && !isOnboarding && (
        <p className="text-xs text-muted-foreground">
          You&apos;ve reached the limit of {MAX_TARGET_KEYWORDS} target
          keywords. Remove one to add another.
        </p>
      )}

      <PriorityReorderList
        items={keywords}
        getKey={(keyword) => keyword}
        max={MAX_TARGET_KEYWORDS}
        onReorder={onReorder}
        onReorderCommit={onReorderCommit}
        placeholderLabel={(priority) => `Add a keyword to fill priority ${priority}`}
        renderItem={(keyword) => (
          <KeywordRow
            keyword={keyword}
            isRemoving={removingKeyword === keyword}
            onRemove={() => void handleRemove(keyword)}
          />
        )}
      />
    </div>
  )
}

function KeywordRow({
  keyword,
  isRemoving,
  onRemove,
}: {
  keyword: string
  isRemoving: boolean
  onRemove: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{keyword}</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`Remove ${keyword}`}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        {isRemoving ? (
          <IconLoader2 className="size-3.5 animate-spin" />
        ) : (
          <IconX className="size-3.5" />
        )}
      </button>
    </div>
  )
}
