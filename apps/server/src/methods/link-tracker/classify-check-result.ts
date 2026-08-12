// One-shot classifier for the free-tool backlink monitor — unlike
// detectChanges (used by the paid tracker's nightly sweep), this has no prior
// row to diff against and no hysteresis: a single check result maps straight
// to a display status. Never invoked from the paid tracking path.

import type { CheckLinkResult, LinkAnchor } from "../../helpers/link-tracker/check-link-client.js"

export type BacklinkCheckStatus = "live" | "nofollow" | "removed" | "page_dead" | "check_failed"

export type BacklinkCheckRow = {
  url: string
  status: BacklinkCheckStatus
  httpStatus: number | null
  finalUrl: string | null
  redirected: boolean
  anchorText: string | null
  href: string | null
  rel: string[] | null
}

function pickAnchor(targetLinks: LinkAnchor[]): LinkAnchor | null {
  if (targetLinks.length === 0) return null
  const nonImage = targetLinks.find((a) => !a.is_image_link)
  return nonImage ?? targetLinks[0]!
}

export function classifyCheckResult(url: string, result: CheckLinkResult | null): BacklinkCheckRow {
  if (!result) {
    return {
      url,
      status: "check_failed",
      httpStatus: null,
      finalUrl: null,
      redirected: false,
      anchorText: null,
      href: null,
      rel: null,
    }
  }

  if (result.outcome === "dead") {
    return {
      url,
      status: "page_dead",
      httpStatus: result.status_code,
      finalUrl: result.final_url,
      redirected: result.redirected,
      anchorText: null,
      href: null,
      rel: null,
    }
  }

  if (result.outcome !== "ok") {
    return {
      url,
      status: "check_failed",
      httpStatus: result.status_code,
      finalUrl: result.final_url,
      redirected: result.redirected,
      anchorText: null,
      href: null,
      rel: null,
    }
  }

  const matched = pickAnchor(result.target_links)
  if (!matched) {
    return {
      url,
      status: "removed",
      httpStatus: result.status_code,
      finalUrl: result.final_url,
      redirected: result.redirected,
      anchorText: null,
      href: null,
      rel: null,
    }
  }

  return {
    url,
    status: matched.rel_tokens.length > 0 ? "nofollow" : "live",
    httpStatus: result.status_code,
    finalUrl: result.final_url,
    redirected: result.redirected,
    anchorText: matched.anchor_text || null,
    href: matched.href,
    rel: matched.rel_tokens,
  }
}
