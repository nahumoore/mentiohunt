import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

import { PRIMARY_EMAIL } from "@workspace/supabase/email-settings"

const PRICING_LABELS: Record<string, string> = {
  free: "Free",
  paid: "Paid",
  freemium: "Freemium",
  not_sure: "Not sure",
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await req.json()

  const {
    directoryName,
    directoryUrl,
    submissionUrl,
    category,
    contactName,
    contactEmail,
    pricingModel,
    primaryAudience,
    description,
    whySubmit,
  } = body

  if (
    !directoryName ||
    !directoryUrl ||
    !submissionUrl ||
    !category ||
    !contactName ||
    !contactEmail ||
    !pricingModel ||
    !primaryAudience ||
    !description ||
    !whySubmit
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: "Mentiohunt <submissions@mentiohunt.com>",
    to: PRIMARY_EMAIL,
    replyTo: contactEmail,
    subject: `New directory submission: ${directoryName}`,
    html: `
      <h2>New Directory Submission</h2>

      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td><strong>Name</strong></td><td>${directoryName}</td></tr>
        <tr><td><strong>Category</strong></td><td>${category}</td></tr>
        <tr><td><strong>Directory URL</strong></td><td><a href="${directoryUrl}">${directoryUrl}</a></td></tr>
        <tr><td><strong>Submission URL</strong></td><td><a href="${submissionUrl}">${submissionUrl}</a></td></tr>
        <tr><td><strong>Pricing</strong></td><td>${PRICING_LABELS[pricingModel] ?? pricingModel}</td></tr>
        <tr><td><strong>Audience</strong></td><td>${primaryAudience}</td></tr>
        <tr><td><strong>Contact</strong></td><td>${contactName} &lt;${contactEmail}&gt;</td></tr>
      </table>

      <h3>Description</h3>
      <p>${description}</p>

      <h3>Why founders should submit</h3>
      <p>${whySubmit}</p>
    `,
  })

  if (error) {
    console.error("Resend error:", error)
    return NextResponse.json({ error: "Failed to send submission" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
