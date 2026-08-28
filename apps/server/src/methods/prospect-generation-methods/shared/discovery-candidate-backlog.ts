import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("discovery-candidate-backlog")

export const DISCOVERY_CANDIDATE_MAX_ATTEMPTS = 5
const STALE_CLAIM_SECONDS = 6 * 60 * 60

export type BacklogSource =
  | "listicle_roundup"
  | "resource_page_inclusion"
  | "unlinked_mention"

export type CandidateToStore = {
  candidateKey: string
  url: string
  domain: string
  title?: string
  snippet?: string
  query?: string | null
  targetPageId?: string | null
  targetUrl?: string | null
  priorityScore?: number
  metadata?: Record<string, unknown>
}

export type ClaimedCandidate = CandidateToStore & {
  id: string
  attemptCount: number
  discoveredAt: string
}

export type CandidateClaimMetrics = {
  claimedCount: number
  retryClaimCount: number
  existingProspectDuplicatesProcessed: number
  concurrentDomainDuplicatesProcessed: number
  invalidCandidatesDiscarded: number
  attemptLimitDiscarded: number
  staleClaimsRetried: number
  oldestClaimedAgeSeconds: number | null
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function numberValue(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function candidateFromRpc(value: unknown): ClaimedCandidate | null {
  if (!isObject(value)) return null
  const id = stringValue(value.id)
  const candidateKey = stringValue(value.candidate_key)
  const url = stringValue(value.url)
  const domain = stringValue(value.domain)
  if (!id || !candidateKey || !url || !domain) return null

  return {
    id,
    candidateKey,
    url,
    domain,
    title: stringValue(value.title),
    snippet: stringValue(value.snippet),
    query: nullableString(value.query),
    targetPageId: nullableString(value.target_page_id),
    targetUrl: nullableString(value.target_url),
    priorityScore: numberValue(value.priority_score),
    attemptCount: numberValue(value.attempt_count),
    metadata: isObject(value.metadata) ? value.metadata : {},
    discoveredAt: stringValue(value.discovered_at),
  }
}

export function mapCandidateClaimResult(payload: unknown): {
  candidates: ClaimedCandidate[]
  metrics: CandidateClaimMetrics
} {
  const result = isObject(payload) ? payload : {}
  const metrics = isObject(result.metrics) ? result.metrics : {}
  return {
    candidates: Array.isArray(result.candidates)
      ? result.candidates
          .map(candidateFromRpc)
          .filter(
            (candidate): candidate is ClaimedCandidate => candidate !== null
          )
      : [],
    metrics: {
      claimedCount: numberValue(metrics.claimed_count),
      retryClaimCount: numberValue(metrics.retry_claim_count),
      existingProspectDuplicatesProcessed: numberValue(
        metrics.existing_prospect_duplicates_processed
      ),
      concurrentDomainDuplicatesProcessed: numberValue(
        metrics.concurrent_domain_duplicates_processed
      ),
      invalidCandidatesDiscarded: numberValue(
        metrics.invalid_candidates_discarded
      ),
      attemptLimitDiscarded: numberValue(metrics.attempt_limit_discarded),
      staleClaimsRetried: numberValue(metrics.stale_claims_retried),
      oldestClaimedAgeSeconds:
        metrics.oldest_claimed_age_seconds === null ||
        metrics.oldest_claimed_age_seconds === undefined
          ? null
          : numberValue(metrics.oldest_claimed_age_seconds),
    },
  }
}

export async function storeDiscoveryCandidates(
  productId: string,
  source: BacklogSource,
  candidates: CandidateToStore[]
): Promise<void> {
  if (candidates.length === 0) return
  const now = new Date().toISOString()
  const rows = candidates.map((candidate) => ({
    candidate_key: candidate.candidateKey,
    url: candidate.url,
    domain: candidate.domain,
    title: candidate.title ?? "",
    snippet: candidate.snippet ?? "",
    query: candidate.query ?? null,
    target_page_id: candidate.targetPageId ?? null,
    target_url: candidate.targetUrl ?? null,
    priority_score: candidate.priorityScore ?? 0,
    metadata: candidate.metadata ?? {},
    last_seen_at: now,
  }))

  const { data, error } = await supabaseAdmin.rpc(
    "store_discovery_candidates",
    {
      p_product_id: productId,
      p_source: source,
      p_candidates: rows,
    }
  )
  if (error) {
    log.warn("failed to store candidates", {
      productId,
      source,
      count: rows.length,
      error: error.message,
    })
    return
  }
  if (isObject(data) && numberValue(data.terminal_refreshed_count) > 0) {
    log.info(
      "rediscovery refreshed terminal candidates without reactivating them",
      {
        productId,
        source,
        count: numberValue(data.terminal_refreshed_count),
      }
    )
  }
}

export async function claimDiscoveryCandidates(
  productId: string,
  source: BacklogSource,
  limit: number
): Promise<ClaimedCandidate[]> {
  if (limit <= 0) return []
  const { data, error } = await supabaseAdmin.rpc(
    "claim_discovery_candidates",
    {
      p_product_id: productId,
      p_source: source,
      p_limit: limit,
      p_max_attempts: DISCOVERY_CANDIDATE_MAX_ATTEMPTS,
      p_stale_after_seconds: STALE_CLAIM_SECONDS,
    }
  )

  if (error) {
    log.warn("failed to claim candidate queue", {
      productId,
      source,
      error: error.message,
    })
    return []
  }

  const result = mapCandidateClaimResult(data)
  log.info("candidate backlog claim completed", {
    productId,
    source,
    ...result.metrics,
  })
  return result.candidates
}

export async function completeDiscoveryCandidates(
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return
  const { data, error } = await supabaseAdmin.rpc(
    "complete_discovery_candidates",
    { p_ids: ids }
  )
  if (error) {
    log.warn("failed to complete candidates", {
      count: ids.length,
      error: error.message,
    })
    return
  }
  if (isObject(data)) {
    log.info("candidate backlog items completed", {
      requestedCount: ids.length,
      completedCount: numberValue(data.completed_count),
      duplicateCount: numberValue(data.duplicate_count),
    })
  }
}

export async function retryDiscoveryCandidates(
  ids: string[],
  reason: string
): Promise<void> {
  if (ids.length === 0) return
  const { data, error } = await supabaseAdmin.rpc(
    "retry_discovery_candidates",
    {
      p_ids: ids,
      p_reason: reason.slice(0, 500),
      p_max_attempts: DISCOVERY_CANDIDATE_MAX_ATTEMPTS,
    }
  )
  if (error) {
    log.warn("failed to retry candidates", {
      count: ids.length,
      error: error.message,
    })
    return
  }
  if (isObject(data)) {
    log.info("candidate backlog retry policy applied", {
      requestedCount: ids.length,
      reason,
      retriedCount: numberValue(data.retried_count),
      discardedCount: numberValue(data.discarded_count),
      ignoredCount: numberValue(data.ignored_count),
      nextAttemptAt: nullableString(data.next_attempt_at),
    })
  }
}
