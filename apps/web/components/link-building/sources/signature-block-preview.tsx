"use client"

function isLinkLine(line: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(line.trim())
}

/** Renders just the signature block (no "Best," sign-off) — reused on the
 * outreach settings page and under a prospect's draft email body, so both
 * show exactly what gets appended at send time. */
export function SignatureBlockPreview({ text }: { text: string }) {
  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim())

  if (!lines.length) return null

  return (
    <div className="text-xs leading-5 text-muted-foreground">
      {lines.map((line, index) => (
        <p
          key={index}
          className={isLinkLine(line) ? "text-primary underline underline-offset-2" : undefined}
        >
          {line}
        </p>
      ))}
    </div>
  )
}
