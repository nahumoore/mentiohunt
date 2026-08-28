import assert from "node:assert/strict"
import test from "node:test"

// The imported logger initializes the admin client; these values are never used by the pure mapping tests.
// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321"
process.env.SUPABASE_SECRET_KEY ??= "test-only-key"

const { DISCOVERY_CANDIDATE_MAX_ATTEMPTS, mapCandidateClaimResult } =
  await import("./discovery-candidate-backlog.js")

test("maps atomic claim rows and post-claim attempt counts", () => {
  const result = mapCandidateClaimResult({
    candidates: [
      {
        id: "candidate-1",
        candidate_key: "https://example.com/resources",
        url: "https://example.com/resources",
        domain: "example.com",
        title: "Resources",
        snippet: "Useful tools",
        query: "saas resources",
        target_page_id: "page-1",
        target_url: "https://product.test/guide",
        priority_score: "12.5",
        attempt_count: 2,
        metadata: { query_appearances: 3 },
        discovered_at: "2026-08-20T12:00:00.000Z",
      },
    ],
    metrics: {
      claimed_count: 1,
      retry_claim_count: 1,
      existing_prospect_duplicates_processed: 4,
      concurrent_domain_duplicates_processed: 1,
      invalid_candidates_discarded: 2,
      attempt_limit_discarded: 3,
      stale_claims_retried: 1,
      oldest_claimed_age_seconds: 600,
    },
  })

  assert.deepEqual(result.candidates, [
    {
      id: "candidate-1",
      candidateKey: "https://example.com/resources",
      url: "https://example.com/resources",
      domain: "example.com",
      title: "Resources",
      snippet: "Useful tools",
      query: "saas resources",
      targetPageId: "page-1",
      targetUrl: "https://product.test/guide",
      priorityScore: 12.5,
      attemptCount: 2,
      metadata: { query_appearances: 3 },
      discoveredAt: "2026-08-20T12:00:00.000Z",
    },
  ])
  assert.deepEqual(result.metrics, {
    claimedCount: 1,
    retryClaimCount: 1,
    existingProspectDuplicatesProcessed: 4,
    concurrentDomainDuplicatesProcessed: 1,
    invalidCandidatesDiscarded: 2,
    attemptLimitDiscarded: 3,
    staleClaimsRetried: 1,
    oldestClaimedAgeSeconds: 600,
  })
})

test("ignores malformed claim rows and supplies safe metric defaults", () => {
  const result = mapCandidateClaimResult({
    candidates: [null, { id: "missing-required-fields" }],
    metrics: {},
  })

  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.metrics, {
    claimedCount: 0,
    retryClaimCount: 0,
    existingProspectDuplicatesProcessed: 0,
    concurrentDomainDuplicatesProcessed: 0,
    invalidCandidatesDiscarded: 0,
    attemptLimitDiscarded: 0,
    staleClaimsRetried: 0,
    oldestClaimedAgeSeconds: null,
  })
})

test("uses an explicit terminal retry limit", () => {
  assert.equal(DISCOVERY_CANDIDATE_MAX_ATTEMPTS, 5)
})
