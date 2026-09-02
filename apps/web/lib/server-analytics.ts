export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, string | number | boolean | null | undefined> = {}
) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!apiKey) return
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        properties: {
          distinct_id: distinctId,
          $lib: "mentiohunt-web-server",
          ...properties,
        },
      }),
    })
  } catch {
    // Analytics must never block onboarding or checkout.
  }
}
