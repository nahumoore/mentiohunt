import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("discovery-candidate-backlog")

export type BacklogSource = "listicle_roundup" | "resource_page_inclusion" | "unlinked_mention"

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
}

type CandidateRow = {
  id: string
  candidate_key: string
  url: string
  domain: string
  title: string
  snippet: string
  query: string | null
  target_page_id: string | null
  target_url: string | null
  priority_score: number
  attempt_count: number
  metadata: Record<string, unknown> | null
}

export async function storeDiscoveryCandidates(
  productId: string,
  source: BacklogSource,
  candidates: CandidateToStore[]
): Promise<void> {
  if (candidates.length === 0) return
  const now = new Date().toISOString()
  const rows = candidates.map((candidate) => ({
    product_id: productId,
    source,
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

  const { error } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .upsert(rows, { onConflict: "product_id,source,candidate_key" })
  if (error) log.warn("failed to store candidates", { productId, source, count: rows.length, error: error.message })
}

export async function claimDiscoveryCandidates(
  productId: string,
  source: BacklogSource,
  limit: number
): Promise<ClaimedCandidate[]> {
  if (limit <= 0) return []
  const now = new Date().toISOString()
  const staleBefore = new Date(Date.now() - 6 * 60 * 60 * 1_000).toISOString()
  const { error: recoveryError } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .update({ state: "retry", next_attempt_at: now, last_error: "stale_processing_claim" })
    .eq("product_id", productId)
    .eq("source", source)
    .eq("state", "processing")
    .lt("claimed_at", staleBefore)
  if (recoveryError) {
    log.warn("failed to recover stale candidates", { productId, source, error: recoveryError.message })
  }

  const { data, error } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .select("id, candidate_key, url, domain, title, snippet, query, target_page_id, target_url, priority_score, attempt_count, metadata")
    .eq("product_id", productId)
    .eq("source", source)
    .in("state", ["pending", "retry"])
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order("priority_score", { ascending: false })
    .order("discovered_at", { ascending: true })
    .limit(limit)

  if (error) {
    log.warn("failed to load candidate queue", { productId, source, error: error.message })
    return []
  }
  const selectedRows = (data ?? []) as CandidateRow[]
  if (selectedRows.length === 0) return []

  const { data: existingProspects, error: prospectsError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("domain")
    .eq("product_id", productId)
    .in("domain", [...new Set(selectedRows.map((row) => row.domain))])
  if (prospectsError) {
    log.warn("failed to deduplicate candidate queue", { productId, source, error: prospectsError.message })
  }
  const existingDomains = new Set((existingProspects ?? []).map((row) => row.domain))
  const claimedDomains = new Set<string>()
  const rows: CandidateRow[] = []
  const duplicateIds: string[] = []
  for (const row of selectedRows) {
    if (existingDomains.has(row.domain) || claimedDomains.has(row.domain)) {
      duplicateIds.push(row.id)
      continue
    }
    claimedDomains.add(row.domain)
    rows.push(row)
  }

  if (duplicateIds.length > 0) {
    await completeDiscoveryCandidates(duplicateIds)
  }
  if (rows.length === 0) return []

  const { error: claimError } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .update({ state: "processing", claimed_at: now, last_error: null })
    .in("id", rows.map((row) => row.id))
  if (claimError) {
    log.warn("failed to claim candidates", { productId, source, error: claimError.message })
    return []
  }

  return rows.map((row) => ({
    id: row.id,
    candidateKey: row.candidate_key,
    url: row.url,
    domain: row.domain,
    title: row.title,
    snippet: row.snippet,
    query: row.query,
    targetPageId: row.target_page_id,
    targetUrl: row.target_url,
    priorityScore: row.priority_score,
    attemptCount: row.attempt_count,
    metadata: row.metadata ?? {},
  }))
}

export async function completeDiscoveryCandidates(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .update({ state: "processed", processed_at: now, claimed_at: null, next_attempt_at: null, last_error: null })
    .in("id", ids)
  if (error) log.warn("failed to complete candidates", { count: ids.length, error: error.message })
}

export async function retryDiscoveryCandidates(ids: string[], reason: string): Promise<void> {
  if (ids.length === 0) return
  const nextAttempt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString()
  const { error } = await supabaseAdmin
    .from("discovery_candidates" as string)
    .update({
      state: "retry",
      claimed_at: null,
      next_attempt_at: nextAttempt,
      last_error: reason.slice(0, 500),
    })
    .in("id", ids)
  if (error) log.warn("failed to retry candidates", { count: ids.length, error: error.message })
}
