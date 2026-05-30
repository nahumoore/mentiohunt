/**
 * Email Verifier & Validator by michael.g
 * https://apify.com/michael.g/email-verifier-validator
 *
 * Bulk verifies deliverability via syntax, MX, SMTP, catch-all, disposable checks.
 *
 * Input: EmailVerifierInput
 * Output per item: EmailVerificationResult
 *
 * Pricing: $0.001 / email ($0.60 / 1,000). Free tier: ~50 emails/mo.
 */
export const EMAIL_VERIFIER = "michael.g~email-verifier-validator"

export type EmailVerifierInput = {
  emails: string[]
}

export type EmailVerificationStatus = "good" | "risky" | "bad"

export type EmailVerificationTechnicalStatus =
  | "valid"
  | "invalid"
  | "unknown"
  | "catch_all"
  | "disposable"
  | "error"

export type EmailVerificationResult = {
  email: string
  domain: string
  status: EmailVerificationStatus
  technical_status: EmailVerificationTechnicalStatus
  score: number
  reason: string
  free: boolean
  role: boolean
  disposable: boolean
  catch_all: boolean
  has_tag: boolean
  verification_details: Record<string, unknown>
}
