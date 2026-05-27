"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { IconX } from "@tabler/icons-react"
import { useState, type KeyboardEvent } from "react"

type EditableListProps = {
  label: string
  items: string[]
  placeholder: string
  prefix?: string
  error?: string
  maxItems: number
  showFavicon?: boolean
  isLoading?: boolean
  normalizeItem?: (value: string) => string
  onChange: (items: string[]) => void
}

export function EditableList({
  label,
  items,
  placeholder,
  prefix,
  error,
  maxItems,
  showFavicon = false,
  isLoading = false,
  normalizeItem = (value) => value.trim(),
  onChange,
}: EditableListProps) {
  const [value, setValue] = useState("")
  const [draftError, setDraftError] = useState("")

  const addItem = () => {
    const normalized = normalizeItem(value)
    if (!normalized) return
    if (items.length >= maxItems) {
      setDraftError(`You can add up to ${maxItems}.`)
      return
    }
    if (items.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setDraftError("Already added.")
      return
    }
    onChange([...items, normalized])
    setValue("")
    setDraftError("")
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    addItem()
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
          {label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[48, 72, 60, 56, 80].map((w) => (
            <div
              key={w}
              className="h-6 animate-pulse rounded-full bg-muted"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
          {label}
        </label>
        <span className="text-xs text-muted-foreground">
          {items.length} / {maxItems}
        </span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(event) => {
              setValue(event.target.value)
              setDraftError("")
            }}
            onKeyDown={handleKeyDown}
            className={cn("h-12", prefix && "pl-7")}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          disabled={!value.trim() || items.length >= maxItems}
          className="shrink-0 h-12 rounded-lg"
        >
          Add
        </Button>
      </div>
      {(error || draftError) && (
        <p className="text-xs text-destructive">{error || draftError}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          let hostname = ""
          if (showFavicon) {
            try { hostname = new URL(item).hostname } catch { /* ignore */ }
          }
          return (
          <span
            key={item}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground"
          >
            {showFavicon && hostname && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                alt=""
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 rounded-sm"
              />
            )}
            <span className="truncate">
              {prefix}
              {item.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((current) => current !== item))}
              className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Remove ${item}`}
            >
              <IconX className="h-3 w-3" />
            </button>
          </span>
          )
        })}
      </div>
    </div>
  )
}
