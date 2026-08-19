import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard, statusNote } from "./base.js"

type ProspectOnboardingResult = {
  prospectsCreated: number
  totalCostUsd: number
}

type PagesOnboardingResult = {
  candidatesFound: number
  pagesCrawled: number
  pagesSelected: number
  pagesFailed: number
  totalCostUsd: number
}

export async function sendOnboardingCompleteEmail({
  to,
  userId,
  userName,
  productName,
  backlinkResult,
  pagesResult,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  backlinkResult: PromiseSettledResult<ProspectOnboardingResult>
  pagesResult: PromiseSettledResult<PagesOnboardingResult>
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)

  const backlinkCard =
    backlinkResult.status === "fulfilled"
      ? statCard(
          "Backlink prospects",
          String(backlinkResult.value.prospectsCreated),
          "new prospects found from competitor backlinks",
          "33%"
        )
      : ""

  const pagesCard =
    pagesResult.status === "fulfilled"
      ? statCard(
          "Target pages",
          String(pagesResult.value.pagesSelected),
          "pages selected from your target keywords",
          "33%"
        )
      : ""

  const statsRow =
    backlinkCard || pagesCard
      ? `<tr>${backlinkCard}${pagesCard}</tr>`
      : ""

  const statusNotes = `
    ${
      backlinkResult.status === "rejected"
        ? statusNote(
            "Backlink discovery did not finish",
            "Your product setup was saved, but the first backlink discovery run failed. We will keep the setup available so it can be run again."
          )
        : ""
    }
    ${
      pagesResult.status === "rejected"
        ? statusNote(
            "Page crawl did not finish",
            "Your product setup was saved, but the initial page crawl failed. Pages will be retried on the next discovery run."
          )
        : ""
    }
    `

  await sendMentiohuntEmail({
    to,
    subject: `Your Mentiohunt onboarding results for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(backlinkResult.status === "fulfilled" ? backlinkResult.value.prospectsCreated : 0, "backlink prospect")} for ${productName}.`,
    footerReason:
      "You received this email because you completed onboarding for Mentiohunt.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your first opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">We finished the initial Mentiohunt setup for <strong style="color:#241611;">${escapedProductName}</strong>. Here is what we found across backlink discovery and page crawling.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        ${statsRow}
        ${statusNotes}
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:18px 0 24px; line-height:1.7;">Next, review the queue and decide which opportunities are worth acting on first. Mentiohunt will show the fit rationale and prep work before you reach out.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Review your opportunities</a>
          </td>
        </tr>
      </table>
    `,
  })
}
