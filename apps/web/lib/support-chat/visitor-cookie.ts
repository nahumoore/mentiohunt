import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

// Visitor identity is a signed httpOnly cookie rather than localStorage, so a
// forged/guessed visitor id can't be used to read someone else's support
// thread. `mh_support_active` is a companion non-httpOnly flag the client can
// read synchronously to know a thread already exists, without a network
// round trip on every cold pageview.
const VISITOR_COOKIE = "mh_support_vid"
export const ACTIVE_COOKIE = "mh_support_active"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getSecret(): string {
  const secret = process.env.SUPPORT_COOKIE_SECRET
  if (!secret) {
    throw new Error("Missing SUPPORT_COOKIE_SECRET env var")
  }
  return secret
}

function sign(visitorId: string): string {
  return createHmac("sha256", getSecret()).update(visitorId).digest("hex")
}

function verify(visitorId: string, signatureHex: string): boolean {
  const expectedHex = sign(visitorId)
  const expected = Buffer.from(expectedHex, "hex")
  const provided = Buffer.from(signatureHex, "hex")
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

function encode(visitorId: string): string {
  return `${visitorId}.${sign(visitorId)}`
}

function decode(cookieValue: string): string | null {
  const [visitorId, signature] = cookieValue.split(".")
  if (!visitorId || !signature) return null
  if (!UUID_RE.test(visitorId)) return null
  if (!verify(visitorId, signature)) return null
  return visitorId
}

function cookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  }
}

/** Reads the signed visitor id cookie. Returns null if absent or tampered with. */
export async function readVisitorId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(VISITOR_COOKIE)?.value
  if (!raw) return null
  return decode(raw)
}

/** Mints a fresh signed visitor id and writes both cookies. */
export async function issueVisitorId(): Promise<string> {
  const visitorId = randomUUID()
  const store = await cookies()
  store.set(VISITOR_COOKIE, encode(visitorId), cookieOptions(true))
  store.set(ACTIVE_COOKIE, "1", cookieOptions(false))
  return visitorId
}

/** Reads the existing visitor id, or mints a new one if missing/invalid. */
export async function getOrCreateVisitorId(): Promise<string> {
  const existing = await readVisitorId()
  if (existing) return existing
  return issueVisitorId()
}

/** Ensures the non-httpOnly "thread exists" flag is set once a conversation has a message. */
export async function markThreadActive(): Promise<void> {
  const store = await cookies()
  store.set(ACTIVE_COOKIE, "1", cookieOptions(false))
}
