// Single source of truth for domain-rating color coding — was previously
// duplicated with a different threshold set in prospect-pipeline-row.tsx.
export function drBadgeClass(dr: number | null | undefined): string {
  if (dr == null) return "text-muted-foreground bg-muted"
  if (dr >= 70) return "text-emerald-700 dark:text-brand-success bg-brand-success/10 ring-1 ring-inset ring-brand-success/20"
  if (dr >= 40) return "text-amber-700 dark:text-brand-warning bg-brand-warning/15 ring-1 ring-inset ring-brand-warning/25"
  return "text-muted-foreground bg-muted ring-1 ring-inset ring-border/60"
}
