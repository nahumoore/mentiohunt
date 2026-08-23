export type AnnouncementType =
  | "launch"
  | "funding"
  | "partnership"
  | "milestone"

export interface PressReleaseInput {
  companyName: string
  announcementType: AnnouncementType
  headline: string
  city: string
  keyDetails: string
  quotePerson?: string
  quoteTitle?: string
  quoteText?: string
  boilerplate?: string
  contactName?: string
  contactEmail?: string
  website?: string
}

export interface PressRelease {
  headline: string
  text: string
}

const TYPE_LABELS: Record<AnnouncementType, string> = {
  launch: "Product launch",
  funding: "Funding round",
  partnership: "Partnership",
  milestone: "Milestone / traction",
}

export { TYPE_LABELS }

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const LEAD_IN: Record<AnnouncementType, string> = {
  launch: "today announced the launch of",
  funding: "today announced it has raised",
  partnership: "today announced a partnership with",
  milestone: "today announced a new milestone:",
}

export function generatePressRelease(
  input: PressReleaseInput
): PressRelease | null {
  const companyName = input.companyName.trim()
  const headline = input.headline.trim()
  const city = input.city.trim()
  const keyDetails = input.keyDetails.trim()

  if (!companyName || !headline || !city || !keyDetails) return null

  const dateline = `${city.toUpperCase()}, ${formatDate()}`
  const leadIn = LEAD_IN[input.announcementType]

  const lines: string[] = []

  lines.push(headline)
  lines.push("")
  lines.push(
    `${dateline} — ${companyName} ${leadIn} ${keyDetails}`
  )

  const quotePerson = input.quotePerson?.trim()
  const quoteText = input.quoteText?.trim()
  if (quotePerson && quoteText) {
    const quoteTitle = input.quoteTitle?.trim()
    const attribution = quoteTitle
      ? `${quotePerson}, ${quoteTitle} at ${companyName}`
      : `${quotePerson}, ${companyName}`
    lines.push("")
    lines.push(`"${quoteText}" said ${attribution}.`)
  }

  const boilerplate = input.boilerplate?.trim()
  lines.push("")
  lines.push(`About ${companyName}`)
  lines.push(
    boilerplate ||
      `${companyName} is a company focused on ${keyDetails}. For more information, visit ${input.website?.trim() || "the company website"}.`
  )

  const contactName = input.contactName?.trim()
  const contactEmail = input.contactEmail?.trim()
  if (contactName || contactEmail) {
    lines.push("")
    lines.push("Media Contact")
    if (contactName) lines.push(contactName)
    if (contactEmail) lines.push(contactEmail)
  }

  lines.push("")
  lines.push("###")

  return {
    headline,
    text: lines.join("\n"),
  }
}
