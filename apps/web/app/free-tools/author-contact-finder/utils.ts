export type ContactConfidence =
  | "personalized"
  | "email-only"
  | "inferred"
  | "generic"
  | "none"

export type OtherEmail = { value: string; type: string }

export type AuthorContactApiResponse = {
  domain: string
  url: string
  name: string | null
  email: string | null
  confidence: ContactConfidence
  socialLinks: Record<string, string>
  bio: string | null
  contactFormUrl: string | null
  otherEmails: OtherEmail[]
}

export function extractDomain(rawUrl: string): string {
  try {
    const withProtocol = rawUrl.startsWith("http")
      ? rawUrl
      : `https://${rawUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return (
      rawUrl
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0] ?? rawUrl
    )
  }
}
