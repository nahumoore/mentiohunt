import { ALERTS_FROM } from "@workspace/supabase/email-settings"
import { Resend } from "resend"
import { createLogger } from "../logger.js"
import { escapeHtml, mentiohuntTemplate } from "./email-template.js"
import { generateUnsubscribeUrl } from "./unsubscribe.js"

const log = createLogger("email")
const APP_URL = "https://mentiohunt.com"

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

type MediaMentionsOnboardingResult = {
  prospectsCreated: number
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")
  return new Resend(apiKey)
}

export async function sendMentiohuntEmail({
  to,
  subject,
  body,
  previewText,
  footerReason,
  unsubscribeUrl,
}: {
  to: string
  subject: string
  body: string
  previewText?: string
  footerReason?: string
  unsubscribeUrl?: string
}) {
  try {
    const resend = getResend()
    const email = mentiohuntTemplate({
      subject,
      body,
      previewText,
      footerReason,
      unsubscribeUrl,
    })

    await resend.emails.send({
      from: ALERTS_FROM,
      to,
      subject: email.subject,
      html: email.html,
      headers: unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    })
  } catch (err) {
    log.warn("failed to send email", { error: String(err), to, subject })
  }
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function statCard(label: string, value: string, detail: string) {
  return `
    <td class="mobile-stack" width="50%" style="padding:0 6px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #F0ECE8; border-radius:12px; background-color:#FFFFFF;">
        <tr>
          <td style="padding:18px;">
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#FF5400; margin:0 0 8px; line-height:1.4;">${escapeHtml(label)}</p>
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; font-weight:700; color:#241611; margin:0; line-height:1.1;">${escapeHtml(value)}</p>
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#6F625A; margin:8px 0 0; line-height:1.5;">${escapeHtml(detail)}</p>
          </td>
        </tr>
      </table>
    </td>`
}

function statusNote(title: string, message: string) {
  return `
    <tr>
      <td colspan="2" style="padding:14px 16px; border:1px solid #F0ECE8; border-radius:12px; background-color:#FFF8F2;">
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#241611; margin:0 0 4px; line-height:1.5;">${escapeHtml(title)}</p>
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#6F625A; margin:0; line-height:1.6;">${escapeHtml(message)}</p>
      </td>
    </tr>`
}

export async function sendMentionsAlert({
  to,
  userId,
  productName,
  mentionsCount,
}: {
  to: string
  userId: string
  productName: string
  mentionsCount: number
}) {
  const mentionLabel = mentionsCount === 1 ? "mention" : "mentions"
  const subject = `${mentionsCount} new ${mentionLabel} found for ${productName}`

  await sendMentiohuntEmail({
    to,
    subject,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(mentionsCount, "mention")} that could be worth replying to.`,
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">Hi,</p>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 24px; line-height:1.7;">We found <strong style="color:#241611;">${escapeHtml(pluralize(mentionsCount, "mention"))}</strong> for <strong style="color:#241611;">${escapeHtml(productName)}</strong> that could be worth replying to.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/community-mentions/reply-queue" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">View your reply queue</a>
          </td>
        </tr>
      </table>
    `,
  })
}

export async function sendOnboardingCompleteEmail({
  to,
  userId,
  userName,
  productName,
  replyQueueResult,
  directoryResult,
  mediaMentionsResult,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  replyQueueResult: PromiseSettledResult<ReplyQueueOnboardingResult>
  directoryResult: PromiseSettledResult<DirectoryOnboardingResult>
  mediaMentionsResult: PromiseSettledResult<MediaMentionsOnboardingResult>
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)
  const replyQueueFound =
    replyQueueResult.status === "fulfilled"
      ? replyQueueResult.value.mentionsFound
      : 0
  const backlinkProspectsCreated =
    mediaMentionsResult.status === "fulfilled"
      ? mediaMentionsResult.value.prospectsCreated
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

  const backlinkOpportunitiesCard =
    mediaMentionsResult.status === "fulfilled"
      ? statCard(
          "Backlink opportunities",
          String(mediaMentionsResult.value.prospectsCreated),
          `${mediaMentionsResult.value.prospectsCreated === 1 ? "backlink prospect row" : "backlink prospect rows"} created from recent media mentions`
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

  const primaryCardsRow =
    replyQueueCard || backlinkOpportunitiesCard
      ? `<tr>${replyQueueCard}${backlinkOpportunitiesCard}</tr>`
      : ""
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
      mediaMentionsResult.status === "rejected"
        ? statusNote(
            "Backlink opportunity processing did not finish",
            "Your setup was saved. We will match relevant backlink opportunities against your product on the next run."
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
    previewText: `We found ${pluralize(replyQueueFound, "possible mention")}, created ${pluralize(backlinkProspectsCreated, "backlink opportunity", "backlink opportunities")}, and indexed ${indexedDirectories}/${totalActiveDirectories} active directories for ${productName}.`,
    footerReason:
      "You received this email because you completed onboarding for Mentiohunt.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your first opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">We finished the initial Mentiohunt setup for <strong style="color:#241611;">${escapedProductName}</strong>. Here is what we found across community monitoring and backlink prospecting.</p>
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
