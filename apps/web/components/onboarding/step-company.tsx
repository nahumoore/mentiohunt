"use client"

import {
  COMPANY_SIZES,
  PRIMARY_USES,
  REFERRAL_SOURCES,
  USER_ROLES,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
  type PrimaryUse,
} from "@/consts/onboarding"
import { cn } from "@workspace/ui/lib/utils"

const selectClass =
  "flex h-12 w-full appearance-none rounded-xl border border-border bg-white px-4 text-base text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"

function SelectField({
  label,
  value,
  error,
  placeholder,
  options,
  onChange,
}: {
  label: string
  value: string
  error?: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          selectClass,
          error ? "border-destructive" : "border-border"
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function StepCompany({
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
  return (
    <div className="space-y-6">
      <SelectField
        label="Company size"
        value={data.companySize}
        error={errors.companySize}
        placeholder="Select company size"
        options={COMPANY_SIZES}
        onChange={(value) => updateField("companySize", value)}
      />

      <SelectField
        label="Your role"
        value={data.role}
        error={errors.role}
        placeholder="Select your role"
        options={USER_ROLES}
        onChange={(value) => updateField("role", value)}
      />

      <SelectField
        label="Where did you hear about us?"
        value={data.referralSource}
        error={errors.referralSource}
        placeholder="Select source"
        options={REFERRAL_SOURCES}
        onChange={(value) => updateField("referralSource", value)}
      />

      <div className="space-y-2">
        <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
          What will you mainly use Mentiohunt for?
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_USES.map(({ id, label }) => {
            const isActive = data.primaryUse === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateField("primaryUse", id as PrimaryUse)}
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-transparent text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, var(--blaze-orange), var(--amber-flame))",
                      }
                    : undefined
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
