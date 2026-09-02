const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

/**
 * Kicks off the activated backend onboarding pipeline (crawl + discovery +
 * outreach sequences) after Stripe checkout confirms entitlement.
 */
export async function startDiscoveryJobs(payload: {
  userId: string
  productId: string
  crawlLimit: number
  autoDiscoverPages: boolean
  activatePreview?: boolean
}) {
  const serverResponse = await fetch(`${SERVER_URL}/onboarding/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
    },
    body: JSON.stringify(payload),
  })

  if (!serverResponse.ok) {
    const data = await serverResponse
      .json()
      .catch(() => ({ error: "Failed to complete onboarding." }))
    console.error("Failed to run onboarding jobs on server:", data)
    throw new Error("Failed to queue activated onboarding discovery")
  }
}

/** Starts the bounded discovery-only pipeline. It never allocates a sender. */
export async function startPreviewJobs(payload: {
  userId: string
  productId: string
  previewId: string
  crawlLimit: number
  autoDiscoverPages: boolean
}) {
  const response = await fetch(`${SERVER_URL}/onboarding/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ error: "Failed to start preview." }))
    console.error("Failed to run onboarding preview on server:", data)
    throw new Error("Failed to queue onboarding preview")
  }
}
