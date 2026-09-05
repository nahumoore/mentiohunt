/**
 * Per-tier explanation copy for a discovered prospect. Extracted from
 * app/onboarding/preview/page.tsx so the live preview and the candidate
 * layouts under /designs/onboarding can't drift apart.
 */
export function opportunityText(tier: string) {
  if (tier === "unlinked_mention") {
    return {
      reason:
        "This page already mentions your market, so a useful source link is a natural fit.",
      angle: "Offer your target page as the missing supporting source.",
    }
  }
  if (tier === "listicle_roundup") {
    return {
      reason:
        "This roundup reaches readers who are actively comparing products like yours.",
      angle:
        "Pitch a concise addition that highlights your clearest differentiator.",
    }
  }
  if (tier === "resource_page_inclusion") {
    return {
      reason:
        "This curated page covers the same topic as one of your strongest resources.",
      angle:
        "Offer the selected resource as a useful addition for its readers.",
    }
  }
  if (tier === "broken_link_building") {
    return {
      reason:
        "This page links to a resource that no longer works, and you have a relevant replacement.",
      angle:
        "Point out the broken link and offer your selected page as a low-pressure replacement.",
    }
  }
  return {
    reason:
      "This site already links to a close competitor and is relevant to your category.",
    angle: "Suggest your target page as a complementary or fresher resource.",
  }
}

export function tierLabel(tier: string) {
  const labels: Record<string, string> = {
    unlinked_mention: "Unlinked mention",
    listicle_roundup: "Listicle roundup",
    resource_page_inclusion: "Resource page",
    broken_link_building: "Broken link",
  }
  return labels[tier] ?? "Competitor backlink"
}
