import { resolveMx } from "node:dns/promises"

import disposableDomains from "disposable-email-domains"
import disposableWildcards from "disposable-email-domains/wildcard.json"

export const MAX_EMAILS_PER_CHECK = 50

const MX_LOOKUP_TIMEOUT_MS = 4_000
const MX_LOOKUP_CONCURRENCY = 15

const DISPOSABLE_SET = new Set(disposableDomains as string[])
const DISPOSABLE_WILDCARDS = disposableWildcards as string[]

// Simple, deliberately permissive — catches malformed input, not RFC edge cases.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_PREFIXES = new Set([
  "info",
  "admin",
  "support",
  "contact",
  "sales",
  "hello",
  "help",
  "office",
  "team",
  "billing",
  "no-reply",
  "noreply",
  "postmaster",
  "webmaster",
  "marketing",
  "jobs",
  "careers",
  "press",
  "media",
  "abuse",
  "enquiries",
  "inquiries",
])

export type VerifyStatus =
  | "valid"
  | "invalid"
  | "disposable"
  | "role-based"
  | "unknown"

export interface EmailVerifyResult {
  email: string
  status: VerifyStatus
  reason: string
}

function isDisposableDomain(domain: string): boolean {
  if (DISPOSABLE_SET.has(domain)) return true
  return DISPOSABLE_WILDCARDS.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`)
  )
}

async function checkMx(domain: string): Promise<"has-mx" | "no-mx" | "unknown"> {
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), MX_LOOKUP_TIMEOUT_MS)
      ),
    ])
    return records.length > 0 ? "has-mx" : "no-mx"
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code
    if (code === "ENOTFOUND" || code === "ENODATA") return "no-mx"
    return "unknown"
  }
}

async function verifyOne(rawEmail: string): Promise<EmailVerifyResult> {
  const email = rawEmail.trim().toLowerCase()

  if (!EMAIL_REGEX.test(email)) {
    return {
      email: rawEmail.trim(),
      status: "invalid",
      reason: "Malformed address — missing an @ or a domain.",
    }
  }

  const [localPart, domain] = email.split("@")

  if (isDisposableDomain(domain!)) {
    return {
      email: rawEmail.trim(),
      status: "disposable",
      reason: "Domain belongs to a known temporary-inbox provider.",
    }
  }

  const mxResult = await checkMx(domain!)

  if (mxResult === "no-mx") {
    return {
      email: rawEmail.trim(),
      status: "invalid",
      reason: "Domain has no mail server — this address can't receive mail.",
    }
  }

  if (mxResult === "unknown") {
    return {
      email: rawEmail.trim(),
      status: "unknown",
      reason: "Could not confirm the domain's mail server — try again shortly.",
    }
  }

  if (ROLE_PREFIXES.has(localPart!)) {
    return {
      email: rawEmail.trim(),
      status: "role-based",
      reason: "Shared inbox, not a named contact — lower reply odds for outreach.",
    }
  }

  return {
    email: rawEmail.trim(),
    status: "valid",
    reason: "Well-formed address with a working mail server.",
  }
}

/** Tiny concurrency-limited map — avoids pulling in p-limit for one call site. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index] as T)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  )
  return results
}

export async function verifyEmails(
  emails: string[]
): Promise<EmailVerifyResult[]> {
  const unique = [...new Set(emails.map((e) => e.trim()).filter(Boolean))].slice(
    0,
    MAX_EMAILS_PER_CHECK
  )

  return mapWithConcurrency(unique, MX_LOOKUP_CONCURRENCY, verifyOne)
}
