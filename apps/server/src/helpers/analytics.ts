import { createLogger } from "./logger.js"

const log = createLogger("analytics")

export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, string | number | boolean | null | undefined> = {}
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!apiKey) return
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        properties: {
          distinct_id: distinctId,
          $lib: "mentiohunt-server",
          ...properties,
        },
      }),
    })
    if (!response.ok)
      log.warn("capture failed", { event, status: response.status })
  } catch (error) {
    log.warn("capture failed", { event, error: String(error) })
  }
}
