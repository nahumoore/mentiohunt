import type { Application } from "express"
import { analyzeBacklinkSiteRouter } from "./analyze-backlink-site.js"
import { devDiscoverMediaMentionsRouter } from "./dev-discover-media-mentions.js"
import { devPopulateMissingSeoMetricsRouter } from "./dev-populate-missing-seo-metrics.js"
import { devSendOnboardingEmailRouter } from "./dev-send-onboarding-email.js"
import { devProcessMediaMentionsRouter } from "./dev-process-media-mentions.js"
import { devUpdateAllSeoMetricsRouter } from "./dev-update-all-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { directoryOpportunitiesRouter } from "./find-directory-opportunities.js"
import { ingestMediaMentionsRouter } from "./ingest-media-mentions.js"
import { onboardingCompleteRouter } from "./onboarding-complete.js"
import { resendInboundWebhookRouter } from "./resend-inbound-webhook.js"
import { runReplyQueueRouter } from "./run-reply-queue.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)
  app.use(analyzeBacklinkSiteRouter)
  app.use(onboardingCompleteRouter)
  app.use(ingestMediaMentionsRouter)
  app.use(resendInboundWebhookRouter)

  if (isDev) {
    app.use(directoryOpportunitiesRouter)
    app.use(verifyDirectoryUrlsRouter)
    app.use(devUpdateAllSeoMetricsRouter)
    app.use(runReplyQueueRouter)
    app.use(devProcessMediaMentionsRouter)
    app.use(devDiscoverMediaMentionsRouter)
    app.use(devPopulateMissingSeoMetricsRouter)
    app.use(devSendOnboardingEmailRouter)
  }
}
