import { z } from "zod"

export const ONBOARDING_STEPS = [
  {
    title: "Mentiohunt",
    description:
      "A simple daily queue for backlink opportunities your team can actually act on.",
  },
  {
    title: "Your site",
    description:
      "Tell us what you are building so we can surface relevant backlink opportunities.",
  },
  {
    title: "Competitors",
    description:
      "Add a few competitors so discovery can find overlap, gaps, and alternative-page angles.",
  },
  {
    title: "Opportunity types",
    description:
      "Choose the outreach motions you want to prioritize in your daily queue.",
  },
  {
    title: "Discovery source",
    description: "Help us understand how you found mentions.",
  },
  {
    title: "Review",
    description:
      "Confirm your inputs before we prepare the first opportunity queue.",
  },
] as const

export const OPPORTUNITY_TYPE_IDS = [
  "directories",
  "resource_pages",
  "listicles",
  "alternatives",
  "competitor_mentions",
  "niche_blogs",
] as const

export const DISCOVERY_SOURCE_IDS = [
  "twitter",
  "linkedin",
  "reddit",
  "hacker_news",
  "google",
  "friend",
  "other",
] as const

export const OPPORTUNITY_TYPES = [
  {
    id: "directories",
    label: "Directories",
    description: "Submit your product to niche directories.",
  },
  {
    id: "resource_pages",
    label: "Resource pages",
    description: "Get listed on relevant curated resource pages.",
  },
  {
    id: "listicles",
    label: "Best tools articles",
    description: "Pitch listicles that compare products in your category.",
  },
  {
    id: "alternatives",
    label: "Alternatives pages",
    description: "Show up on competitor comparison and alternative pages.",
  },
  {
    id: "competitor_mentions",
    label: "Competitor mentions",
    description: "Find pages that already mention competitors but not you.",
  },
  {
    id: "niche_blogs",
    label: "Niche blogs",
    description: "Prioritize editorial sites that cover your market closely.",
  },
] as const

export const DISCOVERY_SOURCES = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reddit", label: "Reddit" },
  { id: "hacker_news", label: "Hacker News" },
  { id: "google", label: "Google" },
  { id: "friend", label: "Friend / referral" },
  { id: "other", label: "Other" },
] as const

export type OpportunityTypeId = (typeof OPPORTUNITY_TYPE_IDS)[number]
export type DiscoverySourceId = (typeof DISCOVERY_SOURCE_IDS)[number]

export type OnboardingData = {
  websiteUrl: string
  productDescription: string
  competitors: string[]
  opportunityTypes: OpportunityTypeId[]
  discoverySource: DiscoverySourceId | ""
}

export type OnboardingField = keyof OnboardingData
export type OnboardingFieldErrors = Partial<Record<OnboardingField, string>>

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  websiteUrl: "",
  productDescription: "",
  competitors: [],
  opportunityTypes: [],
  discoverySource: "",
}

const URL_PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//

export function normalizeUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return trimmedValue
  }

  return URL_PROTOCOL_PATTERN.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`
}

const siteUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter your website URL.")
  .transform(normalizeUrl)
  .pipe(z.string().url("Enter a valid website URL."))

const competitorUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a competitor URL.")
  .transform(normalizeUrl)
  .pipe(z.string().url("Enter a valid competitor URL."))

export const websiteStepSchema = z.object({
  websiteUrl: siteUrlSchema,
  productDescription: z
    .string()
    .trim()
    .min(24, "Add a short description with at least 24 characters.")
    .max(280, "Keep the description under 280 characters."),
})

export const competitorsStepSchema = z.object({
  competitors: z
    .array(competitorUrlSchema)
    .min(3, "Add at least 3 competitors.")
    .max(10, "You can add up to 10 competitors.")
    .refine((competitors) => new Set(competitors).size === competitors.length, {
      message: "Each competitor should be unique.",
    }),
})

export const opportunityTypesStepSchema = z.object({
  opportunityTypes: z
    .array(z.enum(OPPORTUNITY_TYPE_IDS))
    .min(1, "Select at least one opportunity type."),
})

export const discoveryStepSchema = z.object({
  discoverySource: z.enum(DISCOVERY_SOURCE_IDS, {
    required_error: "Choose how you heard about mentions.",
    invalid_type_error: "Choose how you heard about mentions.",
  }),
})

export const onboardingSchema = websiteStepSchema
  .merge(competitorsStepSchema)
  .merge(opportunityTypesStepSchema)
  .merge(discoveryStepSchema)
