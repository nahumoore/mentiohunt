import type { Application } from "express"
import { analyzeBacklinkSiteRouter } from "./analyze-backlink-site.js"
import { billingNotificationRouter } from "./billing-notification.js"
import { crawlSinglePageRouter } from "./crawl-single-page.js"
import { devDiscoverCompetitorBacklinksRouter } from "./dev-discover-competitor-backlinks.js"
import { devDiscoverListicleRoundupsRouter } from "./dev-discover-listicle-roundups.js"
import { devDiscoverResourcePageInclusionsRouter } from "./dev-discover-resource-page-inclusions.js"
import { freeToolCompetitorBacklinkGapRouter } from "./free-tool-competitor-backlink-gap.js"
import { devDiscoverUnlinkedMentionsRouter } from "./dev-discover-unlinked-mentions.js"
import { devRunDailyBacklinkDiscoveryRouter } from "./dev-run-daily-backlink-discovery.js"
import { devTestScraperRouter } from "./dev-test-scraper.js"
import { devPopulateMissingSeoMetricsRouter } from "./dev-populate-missing-seo-metrics.js"
import { devRunOutreachJobsRouter } from "./dev-run-outreach-jobs.js"
import { devSendBillingNotificationEmailRouter } from "./dev-send-billing-notification-email.js"
import { devSendOnboardingEmailRouter } from "./dev-send-onboarding-email.js"
import { devUpdateAllSeoMetricsRouter } from "./dev-update-all-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { freeToolAuthorContactFinderRouter } from "./free-tool-author-contact-finder.js"
import { googleIndexCheckerRouter } from "./google-index-checker.js"
import { onboardingCompleteRouter } from "./onboarding-complete.js"
import { prospectManualOutreachRouter } from "./prospect-manual-outreach.js"
import { resendInboundWebhookRouter } from "./resend-inbound-webhook.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)
  app.use(analyzeBacklinkSiteRouter)
  app.use(billingNotificationRouter)
  app.use(freeToolCompetitorBacklinkGapRouter)
  app.use(freeToolAuthorContactFinderRouter)
  app.use(onboardingCompleteRouter)
  app.use(prospectManualOutreachRouter)
  app.use(crawlSinglePageRouter)
  app.use(resendInboundWebhookRouter)
  app.use(googleIndexCheckerRouter)

  if (isDev) {
    app.use(verifyDirectoryUrlsRouter)
    app.use(devUpdateAllSeoMetricsRouter)
    app.use(devPopulateMissingSeoMetricsRouter)
    app.use(devSendOnboardingEmailRouter)
    app.use(devSendBillingNotificationEmailRouter)
    app.use(devDiscoverCompetitorBacklinksRouter)
    app.use(devDiscoverUnlinkedMentionsRouter)
    app.use(devRunDailyBacklinkDiscoveryRouter)
    app.use(devDiscoverListicleRoundupsRouter)
    app.use(devDiscoverResourcePageInclusionsRouter)
    app.use(devTestScraperRouter)
    app.use(devRunOutreachJobsRouter)
  }
}
