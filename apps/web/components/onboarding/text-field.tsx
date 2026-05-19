"use client"

import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type TextFieldProps = {
  label: string
  value: string
  error?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function TextField({ label, value, error, placeholder, onChange }: TextFieldProps) {
  return (
    <Field>
      <FieldLabel className="text-[0.7rem] font-bold tracking-[0.24em] text-muted-foreground uppercase">
        {label}
      </FieldLabel>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-12", error ? "border-destructive" : "border-border")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  )
}
