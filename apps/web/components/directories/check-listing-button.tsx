import { IconSearch } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

function buildGoogleQuery(
  directoryDomain: string,
  productName: string | null,
  websiteUrl: string | null
): string {
  const parts = [`site:${directoryDomain}`]
  if (productName) parts.push(`"${productName}"`)
  if (websiteUrl) {
    try {
      const normalized = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
      const hostname = new URL(normalized).hostname.replace(/^www\./, "")
      if (hostname) parts.push(`"${hostname}"`)
    } catch {
      // ignore malformed URLs
    }
  }
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(" "))}`
}

export function CheckListingButton({
  directoryDomain,
  productName,
  websiteUrl,
}: {
  directoryDomain: string
  productName: string | null
  websiteUrl: string | null
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={buildGoogleQuery(directoryDomain, productName, websiteUrl)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconSearch className="size-3.5" />
        Check listing
      </a>
    </Button>
  )
}
