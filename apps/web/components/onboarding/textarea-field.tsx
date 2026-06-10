"use client"

import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

type TextareaFieldProps = {
  label: string
  value: string
  error?: string
  isLoading?: boolean
  onChange: (value: string) => void
}

export function TextareaField({ label, value, error, isLoading, onChange }: TextareaFieldProps) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel className="text-[0.7rem] font-bold text-muted-foreground uppercase">
          {label}
        </FieldLabel>
        {!isLoading && <span className="text-xs text-muted-foreground">{value.trim().length} / 280</span>}
      </div>
      {isLoading ? (
        <div className="min-h-[120px] animate-pulse rounded-md bg-muted" />
      ) : (
        <Textarea
          className={cn(
            "min-h-[120px] bg-card px-4 py-3 leading-6",
            error ? "border-destructive" : "border-border"
          )}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  )
}
