import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard, statusNote } from "./base.js"

type ReplyQueueOnboardingResult = {
  postsScanned: number
  mentionsFound: number
}

type DirectoryOnboardingResult = {
  checked: number
  indexed: number
  gaps: number
  errors: number
  newRows: number
  totalActiveDirectories: number
}

export async function sendOnboardingCompleteEmail({
  to,
  userId,
  userName,
  productName,
  replyQueueResult,
  directoryResult,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  replyQueueResult: PromiseSettledResult<ReplyQueueOnboardingResult>
  directoryResult: PromiseSettledResult<DirectoryOnboardingResult>
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)
  const replyQueueFound =
    replyQueueResult.status === "fulfilled"
      ? replyQueueResult.value.mentionsFound
      : 0
  const indexedDirectories =
    directoryResult.status === "fulfilled" ? directoryResult.value.indexed : 0
  const totalActiveDirectories =
    directoryResult.status === "fulfilled"
      ? directoryResult.value.totalActiveDirectories
      : 0

  const replyQueueCard =
    replyQueueResult.status === "fulfilled"
      ? statCard(
          "Possible Mentions",
          String(replyQueueResult.value.mentionsFound),
          `suggested ${replyQueueResult.value.mentionsFound === 1 ? "reply" : "replies"} from ${pluralize(replyQueueResult.value.postsScanned, "post")} scanned`
        )
      : ""

  const directoryCoverageCard =
    directoryResult.status === "fulfilled"
      ? statCard(
          "Directory coverage",
          `${directoryResult.value.indexed}/${directoryResult.value.totalActiveDirectories}`,
          "active directories indexed for your product"
        )
      : ""

  const primaryCardsRow = replyQueueCard ? `<tr>${replyQueueCard}</tr>` : ""
  const directoryCardRow = directoryCoverageCard
    ? `<tr>${directoryCoverageCard}</tr>`
    : ""
  const statusNotes = `
    ${
      replyQueueResult.status === "rejected"
        ? statusNote(
            "Community monitoring scan did not finish",
            "Your monitoring setup was saved, but the first scan failed. We will keep the setup available so it can be run again."
          )
        : ""
    }
    ${
      directoryResult.status === "rejected"
        ? statusNote(
            "Directory discovery did not finish",
            "Your product setup was saved, but the first directory discovery run failed. We will keep the setup available so it can be run again."
          )
        : ""
    }
    ${
      directoryResult.status === "fulfilled" && directoryResult.value.errors > 0
        ? statusNote(
            "Some directory checks were inconclusive",
            `${pluralize(directoryResult.value.errors, "directory", "directories")} could not be verified during this run.`
          )
        : ""
    }`

  await sendMentiohuntEmail({
    to,
    subject: `Your Mentiohunt onboarding results for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(replyQueueFound, "possible mention")} and indexed ${indexedDirectories}/${totalActiveDirectories} active directories for ${productName}.`,
    footerReason:
      "You received this email because you completed onboarding for Mentiohunt.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your first opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">We finished the initial Mentiohunt setup for <strong style="color:#241611;">${escapedProductName}</strong>. Here is what we found across community monitoring and directory prospecting.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        ${primaryCardsRow}
        ${directoryCardRow}
        ${statusNotes}
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:18px 0 24px; line-height:1.7;">Next, review the queue and decide which opportunities are worth acting on first. Mentiohunt will show the fit rationale and prep work before you reach out or reply.</p>
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
