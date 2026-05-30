export async function runApifyActor<T>(
  actorId: string,
  input: unknown,
  timeoutSec = 300
): Promise<T> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSec + 60) * 1000),
  })
  if (!res.ok) throw new Error(`Apify ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}
