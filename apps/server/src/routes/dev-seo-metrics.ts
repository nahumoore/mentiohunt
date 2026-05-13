import { Router, type IRouter } from "express"

const ACTOR_ID = "seo-scraper~moz-domain-authority-checker"

export const devSeoMetricsRouter: IRouter = Router()

devSeoMetricsRouter.get("/dev/seo-metrics", async (req, res) => {
  const domain = typeof req.query.url === "string" ? req.query.url : null

  if (!domain) {
    res.status(400).json({ error: "Missing required query param: url" })
    return
  }

  if (!process.env.APIFY_TOKEN) {
    res.status(500).json({ error: "APIFY_TOKEN not set" })
    return
  }

  const normalized = domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
  // todo: research for another actor, this takes too much. Get an error on zignalify.com
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}&timeout=300`

  let results: unknown
  try {
    const apifyRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: [normalized] }),
      signal: AbortSignal.timeout(360_000),
    })

    if (!apifyRes.ok) {
      res
        .status(502)
        .json({ error: `Apify ${apifyRes.status}: ${apifyRes.statusText}` })
      return
    }

    results = await apifyRes.json()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: msg })
    return
  }

  res.json({ domain: normalized, results })
})
