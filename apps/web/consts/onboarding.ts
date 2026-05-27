import { z } from "zod"

export const ONBOARDING_STEPS = [
  {
    title: "Welcome to Mentiohunt",
    description:
      "Enter your URL and we'll help you discover opportunities for your product.",
  },
  {
    title: "Your product",
    description:
      "Review your product name and description. Edit anything that looks off.",
  },
  {
    title: "Competitors",
    description:
      "These are the sites we'll mine for backlink opportunities. Add or remove as needed.",
  },
  {
    title: "Where to listen",
    description:
      "Review the keywords and communities we'll monitor for relevant posts.",
  },
  {
    title: "Launch",
    description:
      "Backlink discovery and community monitoring will both activate immediately.",
  },
] as const

export const OPPORTUNITY_TYPE_IDS = [
  "competitor_backlinks",
  "unlinked_mentions",
  "media_mentions",
] as const

export const OPPORTUNITY_TYPES = [
  {
    id: "competitor_backlinks",
    label: "Competitor backlinks",
    description:
      "Find sites linking to competitors and pitch your product as an alternative.",
  },
  {
    id: "unlinked_mentions",
    label: "Unlinked mentions",
    description:
      "Find pages that mention your product but forgot to link to you.",
  },
] as const

export const DEFAULT_OPPORTUNITY_TYPES = [
  "competitor_backlinks",
  "unlinked_mentions",
  "media_mentions",
] satisfies OpportunityTypeId[]

export const DEFAULT_MONITORING_PLATFORMS = ["reddit", "bluesky"] as const

export type OpportunityTypeId = (typeof OPPORTUNITY_TYPE_IDS)[number]
export type MonitoringPlatform = (typeof DEFAULT_MONITORING_PLATFORMS)[number]

export type MonitoringCommunity = {
  platform: "reddit"
  community: string
}

export type OnboardingData = {
  websiteUrl: string
  productName: string
  productDescription: string
  competitors: string[]
  opportunityTypes: OpportunityTypeId[]
  monitoringPlatforms: MonitoringPlatform[]
  monitoringKeywords: string[]
  monitoringCommunities: MonitoringCommunity[]
  emailAlertsEnabled: boolean
  userName: string
}

export type OnboardingField = keyof OnboardingData
export type OnboardingFieldErrors = Partial<Record<OnboardingField, string>>

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  websiteUrl: "",
  productName: "",
  productDescription: "",
  competitors: [],
  opportunityTypes: DEFAULT_OPPORTUNITY_TYPES,
  monitoringPlatforms: [...DEFAULT_MONITORING_PLATFORMS],
  monitoringKeywords: [],
  monitoringCommunities: [],
  emailAlertsEnabled: true,
  userName: "",
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

export const websiteUrlStepSchema = z.object({
  websiteUrl: siteUrlSchema,
})

export const productDescriptionStepSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(1, "Add your product name.")
    .max(80, "Keep the product name under 80 characters."),
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

const monitoringCommunitySchema = z.object({
  platform: z.literal("reddit"),
  community: z
    .string()
    .trim()
    .min(1, "Add at least one community.")
    .max(80, "Keep community names under 80 characters.")
    .transform((value) =>
      value
        .replace(/^\/?r\//i, "")
        .replace(/^\/+/, "")
        .trim()
    ),
})

export const monitoringStepSchema = z.object({
  monitoringPlatforms: z
    .array(z.enum(["reddit", "bluesky"]))
    .min(1, "Keep at least one monitoring platform active."),
  monitoringKeywords: z
    .array(z.string().trim().min(2).max(120))
    .min(1, "Add at least one monitoring keyword.")
    .max(10, "You can add up to 10 monitoring keywords."),
  monitoringCommunities: z
    .array(monitoringCommunitySchema)
    .min(1, "Add at least one Reddit community.")
    .max(15, "You can add up to 15 communities."),
  emailAlertsEnabled: z.boolean(),
})

export const opportunityTypesStepSchema = z.object({
  opportunityTypes: z
    .array(z.enum(OPPORTUNITY_TYPE_IDS))
    .min(1, "Select at least one opportunity type."),
})

export const userNameStepSchema = z.object({
  userName: z.string().trim().max(80).optional().default(""),
})

export const onboardingSchema = websiteUrlStepSchema
  .merge(productDescriptionStepSchema)
  .merge(competitorsStepSchema)
  .merge(opportunityTypesStepSchema)
  .merge(monitoringStepSchema)
  .merge(userNameStepSchema)
