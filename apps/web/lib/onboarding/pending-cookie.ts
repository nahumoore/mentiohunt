import { cookies } from "next/headers"

import type { OnboardingData } from "@/consts/onboarding"

const COOKIE_NAME = "onboarding_pending"
// Long enough to cover a slow Stripe Checkout — the data is only written to
// the DB once the payment confirms, in app/onboarding/checkout-complete.
const COOKIE_MAX_AGE_SECONDS = 60 * 30

export async function setPendingOnboardingData(data: OnboardingData) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

export async function readPendingOnboardingData(): Promise<OnboardingData | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as OnboardingData
  } catch {
    return null
  }
}

export async function clearPendingOnboardingData() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
