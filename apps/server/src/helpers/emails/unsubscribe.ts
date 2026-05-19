import { createHmac } from "node:crypto"

const APP_URL = "https://mentiohunt.com"

export type EmailType = "alerts" | "marketing"

function getSecret(): string {
  const secret = process.env.INTERNAL_API_KEY
  if (!secret) throw new Error("Missing INTERNAL_API_KEY")
  return secret
}

export function generateUnsubscribeUrl(userId: string, type: EmailType): string {
  const sig = createHmac("sha256", getSecret())
    .update(`${userId}:${type}`)
    .digest("hex")
  return `${APP_URL}/api/unsubscribe?uid=${encodeURIComponent(userId)}&type=${type}&sig=${sig}`
}
