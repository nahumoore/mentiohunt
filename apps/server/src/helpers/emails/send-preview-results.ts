import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail } from "./base.js"

type PreviewOpportunity = {
  domain: string
  domainRating: number | null
  reason: string
  angle: string
}

export async function sendPreviewResultsEmail({
  to,
  userName,
  productName,
  opportunities,
  previewId,
}: {
  to: string
  userName: string | null
  productName: string
  opportunities: PreviewOpportunity[]
  previewId: string
}) {
  const count = opportunities.length
  const firstName = userName?.trim().split(/\s+/)[0]
  const summaries = opportunities
    .slice(0, 3)
    .map(
      (opportunity) => `
        <tr><td style="padding:14px 0; border-bottom:1px solid #F0ECE8;">
          <p style="font-size:15px;font-weight:700;color:#241611;margin:0 0 5px;">${escapeHtml(opportunity.domain)}${opportunity.domainRating === null ? "" : ` · DR ${opportunity.domainRating}`}</p>
          <p style="font-size:14px;color:#6F625A;margin:0 0 4px;line-height:1.55;">${escapeHtml(opportunity.reason)}</p>
          <p style="font-size:14px;color:#4F423A;margin:0;line-height:1.55;"><strong>Suggested angle:</strong> ${escapeHtml(opportunity.angle)}</p>
        </td></tr>`
    )
    .join("")

  return sendMentiohuntEmail({
    to,
    subject:
      count > 0
        ? `We found ${count} backlink opportunities for ${productName}`
        : `Your Mentiohunt analysis for ${productName} is complete`,
    previewText:
      count > 0
        ? `${pluralize(count, "personalized opportunity")} ready to review. Nothing has been sent.`
        : "We did not find enough strong matches in this pass. Your setup is saved.",
    footerReason:
      "You received this transactional email because you requested a Mentiohunt preview.",
    idempotencyKey: `onboarding-preview-${previewId}`,
    body: `
      <p style="font-size:16px;color:#4F423A;margin:0 0 18px;line-height:1.7;">${escapeHtml(firstName ? `Hi ${firstName},` : "Hi,")}</p>
      <h1 style="font-size:28px;color:#241611;margin:0 0 16px;line-height:1.2;">${count > 0 ? "Your opportunities are ready" : "Your analysis is complete"}</h1>
      <p style="font-size:16px;color:#4F423A;margin:0 0 18px;line-height:1.7;">We analyzed <strong>${escapeHtml(productName)}</strong> and found ${pluralize(count, "match")} for your preview.</p>
      ${count > 0 ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${summaries}</table>` : `<p style="font-size:15px;color:#6F625A;line-height:1.7;">We did not find enough strong matches in this pass. Your setup is saved so we can investigate and retry it.</p>`}
      <p style="font-size:15px;color:#4F423A;margin:22px 0;line-height:1.7;"><strong>Nothing has been sent.</strong> Review the matches first, then decide whether you want Mentiohunt to run the outreach.</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background-color:#FF5400;"><a href="${APP_URL}/onboarding/preview?source=email" style="display:inline-block;padding:13px 18px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;">Review my opportunities</a></td></tr></table>
    `,
  })
}
