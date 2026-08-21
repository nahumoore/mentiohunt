"use client"

import { MAX_TARGET_KEYWORDS, MIN_TARGET_KEYWORDS } from "@/consts/onboarding"
import {
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconLoader2,
  IconPlus,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { Reorder, useDragControls } from "framer-motion"
import { useRef, useState, type KeyboardEvent } from "react"

type MaybePromise<T> = T | Promise<T>

export type KeywordPriorityListProps = {
  keywords: string[]
  /**
   * Fires immediately with the new order, including mid-drag. The list
   * already tracks its own order locally while dragging, so this is only
   * for consumers with no separate commit step (e.g. onboarding's local
   * form state). Consumers with an async commit (below) should leave this
   * out — mirroring every drag tick into a store makes the pre-drag
   * snapshot for rollback impossible to recover.
   */
  onReorder?: (keywords: string[]) => void
  /** Fires once the order settles (drag release or arrow click) — persist here. Return an error message to roll back. */
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

  const [localKeywords, setLocalKeywords] = useState(keywords)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Reorder.Group needs a controlled, locally-mutable order for the drag
  // gesture itself. Whenever `keywords` changes for a reason other than a
  // drag we're mid-way through (add, remove, an AI-generated replacement
  // list upstream), re-sync — via the render-phase pattern React recommends
  // for adjusting state from props, not an effect, so there's no extra
  // render pass. https://react.dev/learn/you-might-not-need-an-effect
  const [syncedKeywords, setSyncedKeywords] = useState(keywords)
  if (keywords !== syncedKeywords) {
    setSyncedKeywords(keywords)
    setLocalKeywords(keywords)
  }

  // Mirrors localKeywords for handlers (onDragEnd) that need the
  // just-settled order in the same tick a state update was requested,
  // before React has re-rendered with the new state.
  const localKeywordsRef = useRef(localKeywords)

  const atMax = localKeywords.length >= MAX_TARGET_KEYWORDS
  const atMin = localKeywords.length <= MIN_TARGET_KEYWORDS

  function handleReorder(next: string[]) {
    localKeywordsRef.current = next
    setLocalKeywords(next)
    onReorder?.(next)
  }

  async function commitOrder(next: string[]) {
    if (!onReorderCommit) return
    setIsSavingOrder(true)
    const result = await onReorderCommit(next)
    if (result) {
      setError(result)
      // `keywords` is the pre-drag prop — onReorderCommit is the only thing
      // allowed to change it (settings never wires the live onReorder), so
      // this is a true rollback, not a no-op.
      handleReorder(keywords)
    }
    setIsSavingOrder(false)
  }

  function moveKeyword(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= localKeywords.length) return
    const a = localKeywords[index]
    const b = localKeywords[target]
    if (a === undefined || b === undefined) return
    const next = [...localKeywords]
    next[index] = b
    next[target] = a
    handleReorder(next)
    void commitOrder(next)
  }

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

      <Reorder.Group
        axis="y"
        values={localKeywords}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {localKeywords.map((keyword, index) => (
          <KeywordRow
            key={keyword}
            keyword={keyword}
            priority={index + 1}
            canMoveUp={index > 0}
            canMoveDown={index < localKeywords.length - 1}
            disabled={isSavingOrder}
            isRemoving={removingKeyword === keyword}
            onDragEnd={() => void commitOrder(localKeywordsRef.current)}
            onMoveUp={() => moveKeyword(index, -1)}
            onMoveDown={() => moveKeyword(index, 1)}
            onRemove={() => void handleRemove(keyword)}
          />
        ))}
      </Reorder.Group>

      {Array.from({ length: Math.max(0, MAX_TARGET_KEYWORDS - localKeywords.length) }).map(
        (_, i) => (
          <PlaceholderRow
            key={`placeholder-${localKeywords.length + i + 1}`}
            priority={localKeywords.length + i + 1}
          />
        )
      )}
    </div>
  )
}

function KeywordRow({
  keyword,
  priority,
  canMoveUp,
  canMoveDown,
  disabled,
  isRemoving,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  keyword: string
  priority: number
  canMoveUp: boolean
  canMoveDown: boolean
  disabled: boolean
  isRemoving: boolean
  onDragEnd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={keyword}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-sm"
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          priorityBadgeClass(priority)
        )}
      >
        {priority}
      </span>
      <button
        type="button"
        onPointerDown={(event) => !disabled && controls.start(event)}
        disabled={disabled}
        aria-label={`Drag ${keyword} to reorder`}
        className="shrink-0 touch-none cursor-grab text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconGripVertical className="size-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{keyword}</span>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp || disabled}
          aria-label={`Move ${keyword} up in priority`}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown || disabled}
          aria-label={`Move ${keyword} down in priority`}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronDown className="size-3.5" />
        </button>
      </div>
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
    </Reorder.Item>
  )
}

// Priorities 1-3 get a primary-color gradient, strongest at 1, fading down
// to the plain muted badge that priorities 4-5 already used.
function priorityBadgeClass(priority: number): string {
  if (priority === 1) return "bg-primary text-primary-foreground"
  if (priority === 2) return "bg-primary/60 text-primary-foreground"
  if (priority === 3) return "bg-primary/25 text-primary-foreground"
  return "bg-muted text-foreground"
}

function PlaceholderRow({ priority }: { priority: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground/50">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border/60 text-xs font-semibold">
        {priority}
      </span>
      <span>Add a keyword to fill priority {priority}</span>
    </div>
  )
}
