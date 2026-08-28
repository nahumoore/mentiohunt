/**
 * Common discovery funnel fields. Strategy-specific metrics can still be
 * persisted alongside these fields, but schedulers should use this shape for
 * cross-strategy allocation and accounting.
 *
 * `sequenceReady` is intentionally optional: discovery strategies only know
 * when a contact-ready prospect has been persisted. The scheduler owns
 * sequence creation and fills this field after reconciling persisted rows.
 */
export type StrategyFunnel = {
  candidatesGathered: number
  candidatesFetched: number
  candidatesQualified: number
  enrichmentAttempts: number
  prospectsInserted: number
  contactReady: number
  sequenceReady?: number
  emailNotFound: number
  enrichmentFailures: number
  persistenceFailures: number
  callbackFailures: number
  transportFailures: number
  duplicatesSkipped: number
  budgetSkipped: number
  exhausted: boolean
  cursorState?: string | null
}

export type StrategyResult = {
  prospectsCreated: number
  totalCostUsd: number
  funnel?: StrategyFunnel
}

export function emptyStrategyFunnel(
  overrides: Partial<StrategyFunnel> = {}
): StrategyFunnel {
  return {
    candidatesGathered: 0,
    candidatesFetched: 0,
    candidatesQualified: 0,
    enrichmentAttempts: 0,
    prospectsInserted: 0,
    contactReady: 0,
    emailNotFound: 0,
    enrichmentFailures: 0,
    persistenceFailures: 0,
    callbackFailures: 0,
    transportFailures: 0,
    duplicatesSkipped: 0,
    budgetSkipped: 0,
    exhausted: false,
    ...overrides,
  }
}
