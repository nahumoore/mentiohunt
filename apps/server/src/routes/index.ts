import type { Application } from "express"
import { analyzeBacklinkSiteRouter } from "./analyze-backlink-site.js"
import { devDiscoverCompetitorBacklinksRouter } from "./dev-discover-competitor-backlinks.js"
import { devTestScraperRouter } from "./dev-test-scraper.js"
import { devDiscoverProductMentionsRouter } from "./dev-discover-product-mentions.js"
import { devPopulateMissingSeoMetricsRouter } from "./dev-populate-missing-seo-metrics.js"
import { devSendOnboardingEmailRouter } from "./dev-send-onboarding-email.js"
import { devUpdateAllSeoMetricsRouter } from "./dev-update-all-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { directoryOpportunitiesRouter } from "./find-directory-opportunities.js"
import { googleIndexCheckerRouter } from "./google-index-checker.js"
import { onboardingCompleteRouter } from "./onboarding-complete.js"
import { resendInboundWebhookRouter } from "./resend-inbound-webhook.js"
import { redditUserAnalyzerRouter } from "./reddit-user-analyzer.js"
import { runReplyQueueRouter } from "./run-reply-queue.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)
  app.use(analyzeBacklinkSiteRouter)
  app.use(onboardingCompleteRouter)
  app.use(resendInboundWebhookRouter)
  app.use(redditUserAnalyzerRouter)
  app.use(googleIndexCheckerRouter)

  if (isDev) {
    app.use(directoryOpportunitiesRouter)
    app.use(verifyDirectoryUrlsRouter)
    app.use(devUpdateAllSeoMetricsRouter)
    app.use(runReplyQueueRouter)
    app.use(devPopulateMissingSeoMetricsRouter)
    app.use(devSendOnboardingEmailRouter)
    app.use(devDiscoverProductMentionsRouter)
    app.use(devDiscoverCompetitorBacklinksRouter)
    app.use(devTestScraperRouter)
  }
}
