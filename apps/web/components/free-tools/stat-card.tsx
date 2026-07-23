import type { Icon } from "@tabler/icons-react"

const toneClasses = {
  orange: "bg-blaze-orange/8 text-(--color-princeton-orange)",
  amber: "bg-amber-500/10 text-amber-600",
  success: "bg-emerald-500/10 text-emerald-600",
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
  footnote,
}: {
  label: string
  value: string
  icon: Icon
  tone?: keyof typeof toneClasses
  footnote: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
          {label}
        </p>
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          <Icon size={16} stroke={2.2} />
        </div>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
    </div>
  )
}
