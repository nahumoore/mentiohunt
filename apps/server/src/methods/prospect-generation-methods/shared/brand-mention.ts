/**
 * A backlink to a competitor's domain does not mean the linking page actually
 * named the competitor — a citation link can use unrelated anchor text and
 * never print the brand name anywhere visible. Outreach copy that claims
 * "you mentioned {competitor}" when the page only linked to it reads as
 * inaccurate/automated to the recipient. This is a loose heuristic (brand
 * name as a substring of the available text), not a guarantee.
 */
export function competitorNamedInVisibleText(
  competitorDomain: string,
  texts: (string | null | undefined)[]
): boolean {
  const brand = competitorDomain.split(".")[0]?.toLowerCase()
  if (!brand) return false
  return texts.some((t) => !!t && t.toLowerCase().includes(brand))
}
