import { z } from "zod"

export const ONBOARDING_STEPS = [
  {
    title: "Welcome to Mentiohunt",
    description:
      "Enter your URL and we'll help you discover opportunities for your product.",
  },
  {
    title: "Tell us about your company",
    description:
      "This helps us tailor your opportunities and reply suggestions.",
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
    title: "Your target pages",
    description:
      "Add your sitemap URL or the specific pages you want to earn backlinks to.",
  },
  {
    title: "Launch",
    description:
      "Backlink discovery will activate immediately.",
  },
] as const

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const
export const USER_ROLES = ["Founder", "Marketing", "Growth", "Engineering", "Other"] as const
export const REFERRAL_SOURCES = [
  "X/Twitter",
  "Google Search",
  "Reddit",
  "Referral",
  "LinkedIn",
  "Other",
] as const

export type CompanySize = (typeof COMPANY_SIZES)[number]
export type UserRole = (typeof USER_ROLES)[number]
export type ReferralSource = (typeof REFERRAL_SOURCES)[number]
export type ResourceMode = "sitemap" | "pages"

export const OPPORTUNITY_TYPE_IDS = [
  "competitor_backlinks",
  "unlinked_mentions",
  "listicle_roundups",
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
  {
    id: "listicle_roundups",
    label: "Listicle roundups",
    description:
      "Find \"best X tools\" and \"top N alternatives\" posts that don't list your product yet.",
  },
] as const

export const DEFAULT_OPPORTUNITY_TYPES = [
  "competitor_backlinks",
  "unlinked_mentions",
  "listicle_roundups",
] satisfies OpportunityTypeId[]

export type OpportunityTypeId = (typeof OPPORTUNITY_TYPE_IDS)[number]

export type OnboardingData = {
  websiteUrl: string
  productName: string
  productDescription: string
  competitors: string[]
  opportunityTypes: OpportunityTypeId[]
  resourceMode: ResourceMode
  resourceUrls: string[]
  userName: string
  companySize: string
  role: string
  referralSource: string
}

export type OnboardingField = keyof OnboardingData
export type OnboardingFieldErrors = Partial<Record<OnboardingField, string>>

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  websiteUrl: "",
  productName: "",
  productDescription: "",
  competitors: [],
  opportunityTypes: DEFAULT_OPPORTUNITY_TYPES,
  resourceMode: "sitemap",
  resourceUrls: [],
  userName: "",
  companySize: "",
  role: "",
  referralSource: "",
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

export const opportunityTypesStepSchema = z.object({
  opportunityTypes: z
    .array(z.enum(OPPORTUNITY_TYPE_IDS))
    .min(1, "Select at least one opportunity type."),
})

export const userNameStepSchema = z.object({
  userName: z.string().trim().max(80).optional().default(""),
})

export const companyStepSchema = z.object({
  companySize: z.string().trim().min(1, "Select your company size."),
  role: z.string().trim().min(1, "Select your role."),
  referralSource: z.string().trim().optional().default(""),
})

const resourceUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a URL.")
  .transform(normalizeUrl)
  .pipe(z.string().url("Enter a valid URL."))

export const resourcesStepSchema = z.object({
  resourceMode: z.enum(["sitemap", "pages"]).default("sitemap"),
  resourceUrls: z
    .array(resourceUrlSchema)
    .min(1, "Add at least one page URL or your sitemap URL.")
    .max(20, "You can add up to 20 URLs."),
})

export const onboardingSchema = websiteUrlStepSchema
  .merge(productDescriptionStepSchema)
  .merge(competitorsStepSchema)
  .merge(opportunityTypesStepSchema)
  .merge(resourcesStepSchema)
  .merge(userNameStepSchema)
  .merge(companyStepSchema)
