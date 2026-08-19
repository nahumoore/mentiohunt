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
      "We'll mine these sites' backlinks for outreach targets. Use competitors similar in size to yours.",
  },
  {
    title: "Your target keywords",
    description:
      "Tell us what you want to rank for. We'll scan your site, pick the pages that match best, and hunt backlinks for them.",
  },
  {
    title: "Launch",
    description:
      "Discovery starts immediately, and outreach sends automatically as prospects are found.",
  },
] as const

export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
] as const
export const USER_ROLES = [
  "Founder",
  "Marketing",
  "Growth",
  "Engineering",
  "Other",
] as const
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
      'Find "best X tools" and "top N alternatives" posts that don\'t list your product yet.',
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
  targetKeywords: string[]
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
  targetKeywords: [],
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

export function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
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
    .min(5, "Add at least 5 competitors.")
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

const keywordSchema = z
  .string()
  .trim()
  .min(2, "Keywords must be at least 2 characters.")
  .max(60, "Keep each keyword under 60 characters.")
  .transform(normalizeKeyword)

export const keywordsStepSchema = z.object({
  targetKeywords: z
    .array(keywordSchema)
    .min(5, "Add at least 5 target keywords.")
    .max(10, "You can add up to 10 keywords.")
    .refine((keywords) => new Set(keywords).size === keywords.length, {
      message: "Each keyword should be unique.",
    }),
})

export const onboardingSchema = websiteUrlStepSchema
  .merge(productDescriptionStepSchema)
  .merge(competitorsStepSchema)
  .merge(opportunityTypesStepSchema)
  .merge(keywordsStepSchema)
  .merge(userNameStepSchema)
  .merge(companyStepSchema)
