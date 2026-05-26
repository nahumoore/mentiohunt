import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

import { supabaseServer } from "@/lib/supabase/server"
import { PRIMARY_EMAIL } from "@workspace/email-settings"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as {
    directoryDomain?: string
    message?: string
  }
  const { directoryDomain, message } = body

  if (!directoryDomain || !message?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: "Mentiohunt <alerts@mentiohunt.com>",
    to: PRIMARY_EMAIL,
    replyTo: user.email,
    subject: `Directory flagged: ${directoryDomain}`,
    html: `
      <h2 style="font-family:sans-serif;margin:0 0 16px">Directory flag report</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td><strong>Directory</strong></td><td>${directoryDomain}</td></tr>
        <tr><td><strong>Reported by</strong></td><td>${user.email}</td></tr>
      </table>
      <h3 style="font-family:sans-serif;margin:20px 0 8px">Report</h3>
      <p style="font-family:sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">${message}</p>
    `,
  })

  if (error) {
    console.error("Flag email error:", error)
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
