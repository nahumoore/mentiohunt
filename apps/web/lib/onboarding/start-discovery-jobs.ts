const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

/**
 * Kicks off the backend onboarding pipeline (crawl + discovery + outreach
 * sequences) for a freshly-completed product. Called by
 * app/onboarding/checkout-complete/route.ts once Stripe checkout confirms.
 */
export async function startDiscoveryJobs(payload: {
  userId: string
  productId: string
  crawlLimit: number
  autoDiscoverPages: boolean
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
  }
}
