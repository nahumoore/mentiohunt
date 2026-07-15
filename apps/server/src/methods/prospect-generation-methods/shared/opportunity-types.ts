// Canonical list of opportunity types — keep in sync with
// apps/web/lib/opportunity-types.ts (DEFAULT_PROSPECT_TIERS). Used as the
// fallback when a product has no backlink_prospects_settings row yet.
export const ALL_OPPORTUNITY_TYPES = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
]
