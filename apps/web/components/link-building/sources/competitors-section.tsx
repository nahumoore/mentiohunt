"use client"

import { IconExternalLink, IconLoader2, IconPlus, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useState, type KeyboardEvent } from "react"

type CompetitorsSectionProps = {
  competitors: string[]
  maxCompetitors: number
  onAdd: (url: string) => Promise<string | null>
  onRemove: (url: string) => Promise<string | null>
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "")
  }
}

export function CompetitorsSection({
  competitors,
  maxCompetitors,
  onAdd,
  onRemove,
}: CompetitorsSectionProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [removingUrl, setRemovingUrl] = useState<string | null>(null)

  const atLimit = competitors.length >= maxCompetitors

  async function handleAdd() {
    if (!value.trim() || isAdding) return

    if (atLimit) {
      setError(`You can track up to ${maxCompetitors} competitors on your plan.`)
      return
    }

    setIsAdding(true)
    setError(null)

    const result = await onAdd(value.trim())

    if (result) {
      setError(result)
    } else {
      setValue("")
    }

    setIsAdding(false)
  }

  async function handleRemove(url: string) {
    if (removingUrl) return

    setRemovingUrl(url)
    setError(null)

    const result = await onRemove(url)

    if (result) setError(result)
    setRemovingUrl(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    handleAdd()
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-sm font-medium">Competitors</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            Sites used to find overlap, comparison pages, and
            alternative-page opportunities.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {competitors.length} / {maxCompetitors}
        </span>
      </div>

      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex gap-2">
          <Input
            value={value}
            placeholder="https://competitor.com"
            onChange={(event) => {
              setValue(event.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="h-10 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!value.trim() || isAdding || atLimit}
            className="shrink-0 h-10 rounded-lg"
          >
            {isAdding ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconPlus className="size-4" />
            )}
            Add
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {atLimit && !error && (
          <p className="mt-2 text-xs text-muted-foreground">
            You&apos;ve reached your plan&apos;s limit of {maxCompetitors}{" "}
            competitors. Remove one to add another, or upgrade for more.
          </p>
        )}
      </div>

      {competitors.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm font-medium">No competitors added yet</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Add competitor sites so discovery can find overlap, comparison
            pages, and alternative-page opportunities.
          </p>
        </div>
      ) : (
        competitors.map((competitor) => (
          <div
            key={competitor}
            className="group flex items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/30"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange/10">
              {/* Favicons are loaded from Google's dynamic favicon endpoint. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${getHostname(competitor)}&sz=32`}
                className="size-5 rounded"
                alt=""
              />
            </div>
            <a
              href={competitor}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <p className="text-sm font-medium">{getHostname(competitor)}</p>
              <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
                {competitor}
              </p>
            </a>
            <a
              href={competitor}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Open ${competitor}`}
            >
              <IconExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => handleRemove(competitor)}
              disabled={removingUrl === competitor}
              className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              aria-label={`Remove ${competitor}`}
            >
              {removingUrl === competitor ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconX className="size-4" />
              )}
            </button>
          </div>
        ))
      )}
    </div>
  )
}
