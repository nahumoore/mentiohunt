function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const URL_PATTERN = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

/** Turns bare URLs typed into the free-text signature into real links.
 * Only matches http(s):// and www. prefixes — deliberately not bare domains
 * like "acme.com", which would false-positive on ordinary sentences. */
function linkify(escapedText: string): string {
  return escapedText.replace(URL_PATTERN, (match) => {
    const href = /^https?:\/\//i.test(match) ? match : `https://${match}`
    return `<a href="${href}" style="color:#555555;text-decoration:underline;">${match}</a>`
  })
}

/** Plain-text signature, appended below the LLM sign-off at send time — never
 * baked into the stored body, so an edit here reaches emails already drafted. */
export function buildSignatureText(signatureText: string | null | undefined): string {
  return signatureText?.trim() ?? ""
}

/** HTML counterpart, appended after the escaped body paragraphs. Preserves
 * the user's line breaks and auto-linkifies any URL it finds. */
export function buildSignatureHtml(signatureText: string | null | undefined): string {
  const trimmed = signatureText?.trim()
  if (!trimmed) return ""

  const withBreaks = linkify(escapeHtml(trimmed)).replace(/\n/g, "<br>")
  return `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e5e5;font-size:13px;line-height:1.5;color:#555555;">${withBreaks}</div>`
}
