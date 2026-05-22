import type { Application } from "express"
import { analyzeBacklinkSiteRouter } from "./analyze-backlink-site.js"
import { devUpdateAllSeoMetricsRouter } from "./dev-update-all-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { directoryOpportunitiesRouter } from "./find-directory-opportunities.js"
import { ingestMediaMentionsRouter } from "./ingest-media-mentions.js"
import { onboardingCompleteRouter } from "./onboarding-complete.js"
import { runReplyQueueRouter } from "./run-reply-queue.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)
  app.use(analyzeBacklinkSiteRouter)
  app.use(onboardingCompleteRouter)
  app.use(ingestMediaMentionsRouter)

  if (isDev) {
    app.use(directoryOpportunitiesRouter)
    app.use(verifyDirectoryUrlsRouter)
    app.use(devUpdateAllSeoMetricsRouter)
    app.use(runReplyQueueRouter)
  }
}
