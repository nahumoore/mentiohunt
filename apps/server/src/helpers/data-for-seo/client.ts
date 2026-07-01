const BASE_URL = "https://api.dataforseo.com/v3"

type DataForSeoResponse<TResult> = {
  status_code: number
  status_message: string
  cost: number
  tasks: Array<{
    status_code: number
    status_message: string
    result: TResult[] | null
  }>
}

export async function dataForSeoPost<TResult>(
  path: string,
  task: object
): Promise<{ result: TResult; costUsd: number }> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD env vars required")

  const credentials = Buffer.from(`${login}:${password}`).toString("base64")

  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([task]),
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`DataForSEO HTTP ${res.status}: ${res.statusText}${body ? ` — ${body}` : ""}`)
  }

  const json = (await res.json()) as DataForSeoResponse<TResult>

  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO error ${json.status_code}: ${json.status_message}`)
  }

  const taskResult = json.tasks[0]
  if (!taskResult || taskResult.status_code !== 20000) {
    const msg = taskResult?.status_message ?? "unknown task error"
    throw new Error(`DataForSEO task error ${taskResult?.status_code ?? "?"}: ${msg}`)
  }

  const result = taskResult.result?.[0]
  if (result === undefined) throw new Error("DataForSEO returned no result")

  return { result, costUsd: json.cost }
}
