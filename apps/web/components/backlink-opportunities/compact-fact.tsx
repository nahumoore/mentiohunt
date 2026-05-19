export function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-border/70 pl-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}
