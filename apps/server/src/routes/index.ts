import type { Application } from "express"
import { analyzeBacklinkSiteRouter } from "./analyze-backlink-site.js"
import { billingNotificationRouter } from "./billing-notification.js"
import { crawlSinglePageRouter } from "./crawl-single-page.js"
import { devDiscoverCompetitorBacklinksRouter } from "./dev-discover-competitor-backlinks.js"
import { devDiscoverListicleRoundupsRouter } from "./dev-discover-listicle-roundups.js"
import { devDiscoverResourcePageInclusionsRouter } from "./dev-discover-resource-page-inclusions.js"
import { freeToolBrokenLinkBuildingRouter } from "./free-tool-broken-link-building.js"
import { freeToolBacklinkOpportunityFinderRouter } from "./free-tool-backlink-opportunity-finder.js"
import { freeToolBacklinkMonitorRouter } from "./free-tool-backlink-monitor.js"
import { freeToolCompetitorBacklinkGapRouter } from "./free-tool-competitor-backlink-gap.js"
import { devDiscoverUnlinkedMentionsRouter } from "./dev-discover-unlinked-mentions.js"
import { devRunDailyBacklinkDiscoveryRouter } from "./dev-run-daily-backlink-discovery.js"
import { devRunLinkTrackerRouter } from "./dev-run-link-tracker.js"
import { devTestScraperRouter } from "./dev-test-scraper.js"
import { devPopulateMissingSeoMetricsRouter } from "./dev-populate-missing-seo-metrics.js"
import { devRunOutreachJobsRouter } from "./dev-run-outreach-jobs.js"
import { devSendBillingNotificationEmailRouter } from "./dev-send-billing-notification-email.js"
import { devSelectTargetPagesRouter } from "./dev-select-target-pages.js"
import { devSendOnboardingEmailRouter } from "./dev-send-onboarding-email.js"
import { devUpdateAllSeoMetricsRouter } from "./dev-update-all-seo-metrics.js"
import { directoryOpportunitiesByUrlRouter } from "./find-directory-opportunities-by-url.js"
import { freeToolAuthorContactFinderRouter } from "./free-tool-author-contact-finder.js"
import { freeToolGuestPostSitesRouter } from "./free-tool-guest-post-sites.js"
import { googleIndexCheckerRouter } from "./google-index-checker.js"
import { linkTrackerCheckRouter } from "./link-tracker-check.js"
import { onboardingCompleteRouter } from "./onboarding-complete.js"
import { onboardingFetchSiteRouter } from "./onboarding-fetch-site.js"
import { pagesReselectRouter } from "./pages-reselect.js"
import { prospectManualOutreachRouter } from "./prospect-manual-outreach.js"
import { prospectReplyRouter } from "./prospect-reply.js"
import { prospectSubmittedUrlRouter } from "./prospect-submitted-url.js"
import { resendInboundWebhookRouter } from "./resend-inbound-webhook.js"
import { runDiscoveryRouter } from "./run-discovery.js"
import { verifyDirectoryUrlsRouter } from "./verify-directory-urls.js"
import { devSubmitUrlRouter } from "./dev-submit-url.js"

export function registerRoutes(app: Application, isDev: boolean): void {
  app.use(directoryOpportunitiesByUrlRouter)
  app.use(analyzeBacklinkSiteRouter)
  app.use(billingNotificationRouter)
  app.use(freeToolCompetitorBacklinkGapRouter)
  app.use(freeToolAuthorContactFinderRouter)
  app.use(freeToolGuestPostSitesRouter)
  app.use(freeToolBrokenLinkBuildingRouter)
  app.use(freeToolBacklinkOpportunityFinderRouter)
  app.use(freeToolBacklinkMonitorRouter)
  app.use(onboardingCompleteRouter)
  app.use(onboardingFetchSiteRouter)
  app.use(runDiscoveryRouter)
  app.use(prospectManualOutreachRouter)
  app.use(prospectReplyRouter)
  app.use(prospectSubmittedUrlRouter)
  app.use(crawlSinglePageRouter)
  app.use(pagesReselectRouter)
  app.use(resendInboundWebhookRouter)
  app.use(googleIndexCheckerRouter)
  app.use(linkTrackerCheckRouter)

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
    app.use(devSelectTargetPagesRouter)
    app.use(devTestScraperRouter)
    app.use(devRunOutreachJobsRouter)
    app.use(devSubmitUrlRouter)
    app.use(devRunLinkTrackerRouter)
  }
}
