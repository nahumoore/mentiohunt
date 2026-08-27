export type ProspectRunMetadata = Record<string, unknown>

function asRecord(value: unknown): ProspectRunMetadata {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ProspectRunMetadata)
    : {}
}

function hasPositiveNumber(value: unknown): boolean {
  return typeof value === "number" && value > 0
}

function hasTransportFailures(metadata: ProspectRunMetadata): boolean {
  for (const key of ["transport_failures", "serp_failures", "fetch_failures"]) {
    if (hasPositiveNumber(metadata[key])) return true
  }

  const fetchOutcomes = asRecord(metadata.fetch_outcomes)
  return Object.entries(fetchOutcomes).some(([outcome, count]) => outcome !== "ok" && hasPositiveNumber(count))
}

/**
 * Add a health marker to every newly completed run. Transport failures are
 * partial results: the strategy did run, but its zero-yield result is not
 * strong enough evidence that the opportunity pool is exhausted.
 */
export function withCompletedRunHealth(metadata: unknown): ProspectRunMetadata {
  const normalized = asRecord(metadata)
  return {
    ...normalized,
    health: hasTransportFailures(normalized) ? "partial" : "healthy",
  }
}

export function withFailedRunHealth(metadata: unknown = {}): ProspectRunMetadata {
  return {
    ...asRecord(metadata),
    health: "failed",
  }
}

export function isGenuineZeroYieldRun(run: {
  status: string
  prospects_created: number | null
  metadata: unknown
  error?: string | null
}): boolean {
  if (run.status !== "completed" || run.prospects_created !== 0 || run.error) return false

  const metadata = asRecord(run.metadata)
  if (metadata.health !== "healthy") return false

  // These outcomes are operational/configuration states, not evidence that
  // the strategy searched cleanly and found no new opportunity.
  return !metadata.skip_reason && metadata.budget_exhausted !== true && metadata.dry_run !== true
}
