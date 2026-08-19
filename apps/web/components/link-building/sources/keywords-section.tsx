"use client"

import { IconLoader2, IconPlus, IconSearch, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useState, type KeyboardEvent } from "react"

type KeywordsSectionProps = {
  keywords: string[]
  maxKeywords: number
  onAdd: (keyword: string) => Promise<string | null>
  onRemove: (keyword: string) => Promise<string | null>
}

export function KeywordsSection({
  keywords,
  maxKeywords,
  onAdd,
  onRemove,
}: KeywordsSectionProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null)

  const atLimit = keywords.length >= maxKeywords

  async function handleAdd() {
    if (!value.trim() || isAdding) return

    if (atLimit) {
      setError(`You can track up to ${maxKeywords} target keywords.`)
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

  async function handleRemove(keyword: string) {
    if (removingKeyword) return

    setRemovingKeyword(keyword)
    setError(null)

    const result = await onRemove(keyword)

    if (result) setError(result)
    setRemovingKeyword(null)
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
          <p className="text-sm font-medium">Target keywords</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            What you want to rank for. We scan your site for the pages that
            match best and build backlinks to those.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {keywords.length} / {maxKeywords}
        </span>
      </div>

      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex gap-2">
          <Input
            value={value}
            placeholder="backlink outreach software"
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
            You&apos;ve reached the limit of {maxKeywords} target keywords.
            Remove one to add another.
          </p>
        )}
      </div>

      {keywords.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm font-medium">No target keywords set</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Add 5-10 keywords you want to rank for so we know which pages on
            your site to target for backlinks.
          </p>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">
            Target keywords:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 py-1.5 pr-2 pl-3 text-xs text-foreground"
              >
                <IconSearch className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{keyword}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(keyword)}
                  disabled={removingKeyword === keyword}
                  className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                  aria-label={`Remove ${keyword}`}
                >
                  {removingKeyword === keyword ? (
                    <IconLoader2 className="size-3 animate-spin" />
                  ) : (
                    <IconX className="size-3" />
                  )}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
