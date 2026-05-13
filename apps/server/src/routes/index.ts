import type { Application } from "express"
import { devSeoMetricsRouter } from "./dev-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { directoryOpportunitiesRouter } from "./find-directory-opportunities.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)

  if (isDev) {
    app.use(directoryOpportunitiesRouter)
    app.use(verifyDirectoryUrlsRouter)
    app.use(devSeoMetricsRouter)
  }
}
