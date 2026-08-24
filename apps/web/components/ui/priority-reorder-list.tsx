"use client"

import { IconChevronDown, IconChevronUp, IconGripVertical } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { Reorder, useDragControls } from "framer-motion"
import { useRef, useState, type ReactNode } from "react"

type MaybePromise<T> = T | Promise<T>

export type PriorityReorderListProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T, priority: number) => ReactNode
  max: number
  /**
   * Fires immediately with the new order, including mid-drag. The list
   * already tracks its own order locally while dragging, so this is only
   * for consumers with no separate commit step (e.g. onboarding's local
   * form state). Consumers with an async commit (below) should leave this
   * out — mirroring every drag tick into a store makes the pre-drag
   * snapshot for rollback impossible to recover.
   */
  onReorder?: (items: T[]) => void
  /** Fires once the order settles (drag release or arrow click) — persist here. Return an error message to roll back. */
  onReorderCommit?: (items: T[]) => MaybePromise<string | null>
  /** Rendered in place of empty slots up to `max`, e.g. "Add a page to fill priority 3". */
  placeholderLabel?: (priority: number) => string
  disabled?: boolean
}

export function PriorityReorderList<T>({
  items,
  getKey,
  renderItem,
  max,
  onReorder,
  onReorderCommit,
  placeholderLabel,
  disabled,
}: PriorityReorderListProps<T>) {
  const [localItems, setLocalItems] = useState(items)
  const [error, setError] = useState<string | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Reorder.Group needs a controlled, locally-mutable order for the drag
  // gesture itself. Whenever `items` changes for a reason other than a
  // drag we're mid-way through (add, remove, an upstream replacement list),
  // re-sync — via the render-phase pattern React recommends for adjusting
  // state from props, not an effect, so there's no extra render pass.
  // https://react.dev/learn/you-might-not-need-an-effect
  const [syncedItems, setSyncedItems] = useState(items)
  if (items !== syncedItems) {
    setSyncedItems(items)
    setLocalItems(items)
  }

  // Mirrors localItems for handlers (onDragEnd) that need the just-settled
  // order in the same tick a state update was requested, before React has
  // re-rendered with the new state.
  const localItemsRef = useRef(localItems)

  function handleReorder(next: T[]) {
    localItemsRef.current = next
    setLocalItems(next)
    onReorder?.(next)
  }

  async function commitOrder(next: T[]) {
    if (!onReorderCommit) return
    setIsSavingOrder(true)
    const result = await onReorderCommit(next)
    if (result) {
      setError(result)
      // `items` is the pre-drag prop — onReorderCommit is the only thing
      // allowed to change it (consumers with a live onReorder shouldn't
      // also wire onReorderCommit), so this is a true rollback.
      handleReorder(items)
    } else {
      setError(null)
    }
    setIsSavingOrder(false)
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= localItems.length) return
    const a = localItems[index]
    const b = localItems[target]
    if (a === undefined || b === undefined) return
    const next = [...localItems]
    next[index] = b
    next[target] = a
    handleReorder(next)
    void commitOrder(next)
  }

  const isDisabled = disabled || isSavingOrder

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Reorder.Group
        axis="y"
        values={localItems}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {localItems.map((item, index) => (
          <ReorderRow
            key={getKey(item)}
            item={item}
            priority={index + 1}
            canMoveUp={index > 0}
            canMoveDown={index < localItems.length - 1}
            disabled={isDisabled}
            onDragEnd={() => void commitOrder(localItemsRef.current)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
          >
            {renderItem(item, index + 1)}
          </ReorderRow>
        ))}
      </Reorder.Group>

      {placeholderLabel &&
        Array.from({ length: Math.max(0, max - localItems.length) }).map((_, i) => (
          <PlaceholderRow
            key={`placeholder-${localItems.length + i + 1}`}
            priority={localItems.length + i + 1}
            label={placeholderLabel(localItems.length + i + 1)}
          />
        ))}
    </div>
  )
}

function ReorderRow<T>({
  item,
  priority,
  canMoveUp,
  canMoveDown,
  disabled,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  children,
}: {
  item: T
  priority: number
  canMoveUp: boolean
  canMoveDown: boolean
  disabled: boolean
  onDragEnd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  children: ReactNode
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-sm"
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          priorityBadgeClass(priority)
        )}
      >
        {priority}
      </span>
      <button
        type="button"
        onPointerDown={(event) => !disabled && controls.start(event)}
        disabled={disabled}
        aria-label={`Drag to reorder, priority ${priority}`}
        className="shrink-0 touch-none cursor-grab text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconGripVertical className="size-4.5" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp || disabled}
          aria-label="Move up in priority"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown || disabled}
          aria-label="Move down in priority"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronDown className="size-3.5" />
        </button>
      </div>
    </Reorder.Item>
  )
}

// Priorities 1-3 get a primary-color gradient, strongest at 1, fading down
// to the plain muted badge that priorities 4-5 already used.
export function priorityBadgeClass(priority: number): string {
  if (priority === 1) return "bg-primary text-primary-foreground"
  if (priority === 2) return "bg-primary/60 text-primary-foreground"
  if (priority === 3) return "bg-primary/25 text-primary-foreground"
  return "bg-muted text-foreground"
}

function PlaceholderRow({ priority, label }: { priority: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3.5 text-xs text-muted-foreground/50">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border/60 text-xs font-semibold">
        {priority}
      </span>
      <span>{label}</span>
    </div>
  )
}
