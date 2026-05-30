import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard, statusNote } from "./base.js"

export async function sendDirectoryWeeklyDigestEmail({
  to,
  userId,
  userName,
  productName,
  checked,
  indexed,
  gaps,
  errors,
  newRows,
  totalActiveDirectories,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  checked: number
  indexed: number
  gaps: number
  errors: number
  newRows: number
  totalActiveDirectories: number
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)

  const coverageCard = statCard(
    "Indexed",
    `${indexed}/${totalActiveDirectories}`,
    "active directories listing your product"
  )
  const gapsCard = statCard(
    "Gaps found",
    String(gaps),
    `${gaps === 1 ? "directory" : "directories"} where your product is missing`
  )
  const newRowsRow =
    newRows > 0
      ? `<tr>${statCard("New directories", String(newRows), "newly tracked directories added this week")}</tr>`
      : ""
  const errorNote =
    errors > 0
      ? statusNote(
          "Some directory checks were inconclusive",
          `${pluralize(errors, "directory", "directories")} could not be verified during this run.`
        )
      : ""

  await sendMentiohuntEmail({
    to,
    subject: `Weekly directory update for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "digest"),
    previewText: `${indexed}/${totalActiveDirectories} indexed, ${gaps} ${gaps === 1 ? "gap" : "gaps"} found across ${checked} directories.`,
    footerReason: "You received this email because you have an active Mentiohunt account.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your weekly directory coverage</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">Here is the latest coverage check for <strong style="color:#241611;">${escapedProductName}</strong> across ${escapeHtml(String(checked))} ${checked === 1 ? "directory" : "directories"}.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        <tr>${coverageCard}${gapsCard}</tr>
        ${newRowsRow}
        ${errorNote ? `<tr>${errorNote}</tr>` : ""}
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:18px 0 24px; line-height:1.7;">Review the gaps and submit your product to directories where you are missing. Each submission builds a new backlink.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/backlinks/directories" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">View directory opportunities</a>
          </td>
        </tr>
      </table>
    `,
  })
}
