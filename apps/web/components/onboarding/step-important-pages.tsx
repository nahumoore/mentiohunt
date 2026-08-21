"use client"

import { PriorityReorderList } from "@/components/ui/priority-reorder-list"
import { MAX_TRACKED_PAGES } from "@/consts/billing"
import {
  normalizeUrl,
  validateImportantPageUrl,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
} from "@/consts/onboarding"
import { IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useState, type KeyboardEvent } from "react"

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

export function StepImportantPages({
  data,
  errors,
  updateField,
}: {
  data: OnboardingData
  errors: OnboardingFieldErrors
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
}) {
  const [value, setValue] = useState("")
  const [draftError, setDraftError] = useState<string | null>(null)

  const remaining = MAX_TRACKED_PAGES - data.importantPages.length
  const atMax = data.importantPages.length >= MAX_TRACKED_PAGES

  function addPage() {
    const normalized = normalizeUrl(value)
    if (!normalized) return

    if (atMax) {
      setDraftError(`You can add up to ${MAX_TRACKED_PAGES} pages.`)
      return
    }
    if (data.importantPages.some((url) => url.toLowerCase() === normalized.toLowerCase())) {
      setDraftError("Already added.")
      return
    }
    const validationError = validateImportantPageUrl(normalized, data.websiteUrl)
    if (validationError) {
      setDraftError(validationError)
      return
    }

    updateField("importantPages", [...data.importantPages, normalized])
    setValue("")
    setDraftError(null)
  }

  function removePage(url: string) {
    updateField(
      "importantPages",
      data.importantPages.filter((current) => current !== url)
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    addPage()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
            Page URLs
          </label>
          <span className="text-xs text-muted-foreground">
            {data.importantPages.length} / {MAX_TRACKED_PAGES}
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            value={value}
            placeholder="https://yoursite.com/blog/your-post"
            onChange={(event) => {
              setValue(event.target.value)
              setDraftError(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={atMax}
            className="h-12 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addPage}
            disabled={!value.trim() || atMax}
            className="h-12 shrink-0 rounded-lg"
          >
            Add
          </Button>
        </div>

        {(errors.importantPages || draftError) && (
          <p className="text-xs text-destructive">{errors.importantPages || draftError}</p>
        )}

        <PriorityReorderList
          items={data.importantPages}
          getKey={(url) => url}
          max={MAX_TRACKED_PAGES}
          onReorder={(pages) => updateField("importantPages", pages)}
          placeholderLabel={(priority) =>
            data.autoDiscoverPages
              ? `We'll auto-discover a page for priority ${priority}`
              : `Add a page to fill priority ${priority}`
          }
          renderItem={(url) => <PageRow url={url} onRemove={() => removePage(url)} />}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border px-4 py-3.5">
        <Checkbox
          id="auto-discover-pages"
          checked={data.autoDiscoverPages}
          onCheckedChange={(checked) => updateField("autoDiscoverPages", checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label
            htmlFor="auto-discover-pages"
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            Find my best pages automatically from my target keywords
          </Label>
          <p className="text-xs leading-5 text-muted-foreground">
            {remaining > 0
              ? `We'll scan your site and fill the remaining ${remaining} of ${MAX_TRACKED_PAGES} slots with pages that best match your target keywords, ranked below whatever you add here.`
              : `You've reached the ${MAX_TRACKED_PAGES}-page limit, so there's nothing left for us to auto-discover.`}
          </p>
        </div>
      </div>
    </div>
  )
}

function PageRow({ url, onRemove }: { url: string; onRemove: () => void }) {
  const hostname = getHostname(url)

  return (
    <div className="flex min-w-0 items-center gap-2">
      {hostname && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-sm"
        />
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {url.replace(/^https?:\/\//, "")}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${url}`}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
      >
        <IconX className="size-3.5" />
      </button>
    </div>
  )
}
