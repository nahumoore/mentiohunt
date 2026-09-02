import { supabaseAdmin } from "@workspace/supabase/admin"
import type { LimitFunction } from "p-limit"
import { createLogger } from "../../../helpers/logger.js"
import type {
  EnrichedColumns,
  ProspectCreatedPayload,
} from "./prospect-types.js"
import {
  claimPersistenceBudget,
  normalizeProspectDomain,
  selectUniqueProspectDomains,
  type PersistenceCandidate,
} from "./persistence-policy.js"

const log = createLogger("persist-and-enrich")

export type PersistenceFunnel = {
  enrichmentAttempts: number
  prospectsInserted: number
  contactReady: number
  emailNotFound: number
  enrichmentFailures: number
  persistenceFailures: number
  callbackFailures: number
  duplicatesSkipped: number
  budgetSkipped: number
}

type BareProspectRow = {
  product_id: string
  domain: string | null
  found_url: string | null
  [column: string]: unknown
}

export type PersistAndEnrichOptions<T> = {
  productId: string
  candidates: PersistenceCandidate<T>[]
  budget?: { remaining: number }
  /** Optional cross-strategy cap used by preview runs. Candidates beyond the
   * cap are persisted for review but contact enrichment is deferred. */
  enrichmentBudget?: { remaining: number }
  enrichLimit: LimitFunction
  buildBareRow: (candidate: PersistenceCandidate<T>) => BareProspectRow
  enrich: (candidate: PersistenceCandidate<T>) => Promise<EnrichedColumns>
  onProspectCreated?: (payload: ProspectCreatedPayload) => void
  logContext?: Record<string, unknown>
}

function emptyFunnel(): PersistenceFunnel {
  return {
    enrichmentAttempts: 0,
    prospectsInserted: 0,
    contactReady: 0,
    emailNotFound: 0,
    enrichmentFailures: 0,
    persistenceFailures: 0,
    callbackFailures: 0,
    duplicatesSkipped: 0,
    budgetSkipped: 0,
  }
}

/**
 * Persist and enrich qualified candidates with a single set of invariants for
 * every automated strategy. Strategy-specific scoring and row metadata remain
 * outside this function.
 */
export async function persistAndEnrich<T>(
  options: PersistAndEnrichOptions<T>
): Promise<PersistenceFunnel> {
  const funnel = emptyFunnel()
  if (options.candidates.length === 0) return funnel

  const candidateDomains = [
    ...new Set(
      options.candidates.map((candidate) =>
        normalizeProspectDomain(candidate.domain || candidate.foundUrl)
      )
    ),
  ].filter(Boolean)
  let existingQuery = supabaseAdmin
    .from("backlink_prospects")
    .select("domain")
    .eq("product_id", options.productId)

  if (candidateDomains.length > 0) {
    existingQuery = existingQuery.or(
      candidateDomains
        .flatMap((domain) => [
          `domain.eq.${domain}`,
          `domain.ilike.*.${domain}`,
        ])
        .join(",")
    )
  }

  const { data: existing, error: existingError } = await existingQuery

  if (existingError) {
    throw new Error(`prospect domain lookup failed: ${existingError.message}`)
  }

  const existingDomains = new Set(
    (existing ?? [])
      .map((row) => row.domain)
      .filter((domain): domain is string => typeof domain === "string")
  )
  const unique = selectUniqueProspectDomains(
    options.candidates,
    existingDomains
  )
  funnel.duplicatesSkipped = unique.duplicatesSkipped

  // This mutation is deliberately synchronous and happens before the insert.
  const budgetClaim = claimPersistenceBudget(unique.selected, options.budget)
  funnel.budgetSkipped = budgetClaim.budgetSkipped
  if (budgetClaim.claimed.length === 0) return funnel

  const bareRows = budgetClaim.claimed.map((candidate) => ({
    ...options.buildBareRow(candidate),
    product_id: options.productId,
    domain: candidate.domain,
    found_url: candidate.foundUrl,
  }))
  const { data: insertedRows, error: insertError } = await supabaseAdmin
    .from("backlink_prospects")
    .upsert(bareRows, {
      onConflict: "product_id,found_url",
      ignoreDuplicates: true,
    })
    .select("id, found_url")

  if (insertError) {
    throw new Error(`bare prospect insert failed: ${insertError.message}`)
  }

  const idByUrl = new Map(
    (insertedRows ?? [])
      .filter((row) => typeof row.found_url === "string")
      .map((row) => [row.found_url as string, row.id as string])
  )
  funnel.prospectsInserted = idByUrl.size

  const insertedCandidates = budgetClaim.claimed.filter((candidate) =>
    idByUrl.has(candidate.foundUrl)
  )
  const enrichmentCount = options.enrichmentBudget
    ? Math.min(
        insertedCandidates.length,
        Math.max(0, options.enrichmentBudget.remaining)
      )
    : insertedCandidates.length
  if (options.enrichmentBudget)
    options.enrichmentBudget.remaining -= enrichmentCount
  const candidatesToEnrich = insertedCandidates.slice(0, enrichmentCount)
  funnel.enrichmentAttempts = candidatesToEnrich.length

  await Promise.all(
    candidatesToEnrich
      // An ignored conflict is not a newly inserted row and must never be enriched.
      .map((candidate) =>
        options.enrichLimit(async () => {
          const id = idByUrl.get(candidate.foundUrl)!
          const context = {
            ...options.logContext,
            domain: candidate.domain,
            prospectId: id,
          }
          const { error: stateError } = await supabaseAdmin
            .from("backlink_prospects")
            .update({ enrichment_status: "enriching" as const })
            .eq("id", id)

          if (stateError) {
            funnel.persistenceFailures += 1
            log.warn("failed to mark prospect enriching", {
              ...context,
              error: stateError.message,
            })
            return
          }

          let enriched: EnrichedColumns
          try {
            enriched = await options.enrich(candidate)
          } catch (error) {
            funnel.enrichmentFailures += 1
            const message =
              error instanceof Error ? error.message : String(error)
            const { error: failureStateError } = await supabaseAdmin
              .from("backlink_prospects")
              .update({ enrichment_status: "failed" as const })
              .eq("id", id)
            if (failureStateError) funnel.persistenceFailures += 1
            log.warn("prospect enrichment failed", {
              ...context,
              error: message,
            })
            return
          }

          const { step2_body, step3_body, ...dbEnriched } = enriched
          const hasEmail = Boolean(enriched.contact_email)
          const contactReady = Boolean(
            enriched.contact_email &&
            enriched.email_subject &&
            enriched.email_body
          )
          const { error: updateError } = await supabaseAdmin
            .from("backlink_prospects")
            .update({
              ...dbEnriched,
              enrichment_status: contactReady
                ? ("ready" as const)
                : ("failed" as const),
              status: hasEmail
                ? ("new" as const)
                : ("email_not_found" as const),
            })
            .eq("id", id)

          if (updateError) {
            funnel.persistenceFailures += 1
            log.warn("prospect enrichment update failed", {
              ...context,
              error: updateError.message,
            })
            return
          }

          if (!hasEmail) {
            funnel.emailNotFound += 1
            log.info("no email found, marked email_not_found", context)
            return
          }

          if (!contactReady) {
            funnel.enrichmentFailures += 1
            log.warn("contact found without usable first email", context)
            return
          }

          funnel.contactReady += 1
          try {
            options.onProspectCreated?.({
              id,
              contactName: enriched.contact_name,
              emailSubject: enriched.email_subject,
              emailBody: enriched.email_body,
              step2Body: step2_body,
              step3Body: step3_body,
            })
          } catch (error) {
            funnel.callbackFailures += 1
            log.warn("prospect callback failed", {
              ...context,
              error: String(error),
            })
          }
        })
      )
  )

  log.info("persistence digest", {
    ...options.logContext,
    productId: options.productId,
    ...funnel,
  })
  return funnel
}
