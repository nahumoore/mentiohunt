/**
 * Moz JSON-RPC API — data.site.link.list
 *
 * Endpoint:  POST https://api.moz.com/jsonrpc
 * Auth:      x-moz-token header (set MOZ_TOKEN env var)
 * Docs:      https://moz.com/api/docs  (Links API → data.site.link.list)
 *
 * Returns backlinks pointing TO a target URL/domain.
 * Max 50 results per request. Use offset.token for cursor pagination.
 *
 * Useful filters:
 *   - gained_last_60_days  → only backlinks gained in the last 60 days (rolling window)
 *   - external             → exclude self-links (almost always required)
 *   - follow               → only dofollow links
 *   - not_deleted          → only currently live links
 *
 * Pagination strategy for daily jobs:
 *   1. First request: omit offset.token (starts from beginning).
 *   2. Save response.offset.token to DB (backlink_prospect_runs.metadata.moz_cursor).
 *   3. Next run: pass saved token as offset.token.
 *   4. When response.offset.token is null, cursor exhausted — reset to null.
 *      The 60-day window will have rolled forward, surfacing new backlinks.
 */

const MOZ_JSONRPC_URL = "https://api.moz.com/jsonrpc"

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Target query. scope determines how the query string is parsed.
 *
 * - domain    → moz.com  (all subdomains + paths)
 * - subdomain → blog.moz.com
 * - subfolder → moz.com/blog
 * - url       → moz.com/blog/specific-post (exact page)
 */
export type SiteQueryScope = "domain" | "subdomain" | "subfolder" | "url"

export type SiteQuery = {
  query: string
  scope: SiteQueryScope
}

/**
 * Per-link deduplication scope.
 * - page      → return every individual linking page (default)
 * - subdomain → return at most one link per source subdomain
 * - domain    → return at most one link per source root domain
 */
export type LinkScope = "page" | "subdomain" | "domain"

/**
 * Sort order (descending). Determines which link surfaces when scope deduplication
 * collapses multiple links from the same source.
 */
export type LinkSortField =
  | "source_page_authority"        // default
  | "source_domain_authority"
  | "source_link_propensity"
  | "source_spam_score"
  | "root_domains_to_source_page"
  | "root_domains_to_source_root_domain"

/**
 * Filter values. external must be included when combining multiple filters.
 *
 * - external          required when using multiple filters; excludes self-links
 * - follow            only dofollow links
 * - nofollow          only nofollow links (all links from source are nofollow)
 * - not_deleted       currently live links only
 * - deleted           lost links only
 * - gained_last_60_days  only backlinks gained in the last 60 days (rolling window)
 * - lost_last_60_days    only backlinks lost in the last 60 days
 * - redirect          at least one redirect link from source to target
 * - not_redirect
 * - rel_canonical     at least one rel-canonical link
 * - not_rel_canonical
 * - via_redirect
 * - not_via_redirect
 * - via_rel_canonical
 * - not_via_rel_canonical
 */
export type LinkFilter =
  | "external"
  | "follow"
  | "nofollow"
  | "not_deleted"
  | "deleted"
  | "gained_last_60_days"
  | "lost_last_60_days"
  | "redirect"
  | "not_redirect"
  | "rel_canonical"
  | "not_rel_canonical"
  | "via_redirect"
  | "not_via_redirect"
  | "via_rel_canonical"
  | "not_via_rel_canonical"

export type DataSiteLinkListParams = {
  site_query: SiteQuery

  options?: {
    /** Deduplication scope per source. Defaults to "page". */
    scope?: LinkScope

    /**
     * Return at most one link from each of these specific subdomains
     * (ordered by sort). Requires sort to be set.
     */
    subdomains_limited_to_one?: string[]

    /** Sort field (descending). Defaults to source_page_authority. */
    sort?: LinkSortField

    /**
     * Filters. Defaults to ["external"].
     * If providing multiple filters, "external" must be one of them.
     */
    filters?: LinkFilter[]
  }

  offset?: {
    /**
     * Pagination cursor from a previous response (offset.token).
     * Omit or pass null to start from the beginning.
     */
    token?: string | null

    /** Results per page. 1–50. Default 25. */
    limit?: number
  }
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type SiteMetrics = {
  page: string
  subdomain: string
  root_domain: string
  title: string
  last_crawled: string
  http_code: number
  page_authority: number
  domain_authority: number
  link_propensity: number
  spam_score: number
  pages_to_page: number
  external_pages_to_page: number
  root_domains_to_page: number
  deleted_root_domains_to_page: number
  nofollow_root_domains_to_page: number
  pages_to_root_domain: number
  external_pages_to_root_domain: number
  root_domains_to_root_domain: number
  deleted_root_domains_to_root_domain: number
  nofollow_root_domains_to_root_domain: number
  root_domains_from_root_domain: number
  pages_from_root_domain: number
  pages_crawled_from_root_domain: number
}

export type LinkItem = {
  source_site_metrics: SiteMetrics
  target_site_metrics: SiteMetrics
  anchor_text: string
  /** ISO date string, e.g. "2024-03-15" */
  date_first_seen: string
  /** ISO date string */
  date_last_seen: string
  /** ISO date string, or null if still live */
  date_disappeared: string | null
  nofollow: boolean
  redirect: boolean
  rel_canonical: boolean
  via_redirect: boolean
  via_rel_canonical: boolean
  /** The linking page URL */
  source_url?: string
  /** The target URL this link points to */
  target_url?: string
}

export type DataSiteLinkListResult = {
  site_query: SiteQuery
  original_site_query: SiteQuery
  site_query_suggestion: {
    query: string
    scope: SiteQueryScope
    explanation: string
    issue: string
  } | null
  offset: {
    /** Token passed in (null if first request) */
    provided_token: string | null
    /** Token for next page. null when no more results. */
    token: string | null
    limit: number
  }
  links: LinkItem[]
  options: {
    scope: LinkScope
    subdomains_limited_to_one: string[]
    sort: LinkSortField
    filters: LinkFilter[]
  }
}

type JsonRpcResponse<T> = {
  jsonrpc: "2.0"
  id: string
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export async function dataSiteLinkList(
  params: DataSiteLinkListParams
): Promise<DataSiteLinkListResult> {
  const token = process.env.MOZ_TOKEN
  if (!token) throw new Error("MOZ_TOKEN env var required")

  const body = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "data.site.link.list",
    params: { data: params },
  }

  const res = await fetch(MOZ_JSONRPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-moz-token": token,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Moz HTTP ${res.status}: ${res.statusText}${text ? ` — ${text}` : ""}`)
  }

  const json = (await res.json()) as JsonRpcResponse<DataSiteLinkListResult>

  if (json.error) {
    throw new Error(`Moz RPC error ${json.error.code}: ${json.error.message}`)
  }

  if (!json.result) {
    throw new Error("Moz API returned no result")
  }

  return json.result
}
