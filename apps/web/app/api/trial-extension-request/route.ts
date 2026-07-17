import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

import { PRIMARY_EMAIL } from "@workspace/email-settings"
import { supabaseServer } from "@/lib/supabase/server"

function isValidPostUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const { testimonialUrl } = body

  if (!isValidPostUrl(testimonialUrl)) {
    return NextResponse.json(
      { error: "Please provide a valid public post URL" },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, tier, active_trial, billing_period_end_at")
    .eq("id", user.id)
    .maybeSingle()

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "Mentiohunt <contact@mentiohunt.com>",
    to: PRIMARY_EMAIL,
    replyTo: profile?.email ?? user.email ?? undefined,
    subject: `Trial extension request: ${profile?.email ?? user.email ?? user.id}`,
    html: `
      <h2>Trial Extension Request (testimonial)</h2>

      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td><strong>User ID</strong></td><td>${user.id}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(profile?.email ?? user.email ?? "—")}</td></tr>
        <tr><td><strong>Name</strong></td><td>${escapeHtml(profile?.name ?? "—")}</td></tr>
        <tr><td><strong>Tier</strong></td><td>${escapeHtml(profile?.tier ?? "—")}</td></tr>
        <tr><td><strong>Active trial</strong></td><td>${String(profile?.active_trial ?? "—")}</td></tr>
        <tr><td><strong>Billing period ends</strong></td><td>${escapeHtml(profile?.billing_period_end_at ?? "—")}</td></tr>
        <tr><td><strong>Testimonial URL</strong></td><td><a href="${encodeURI(testimonialUrl)}">${escapeHtml(testimonialUrl)}</a></td></tr>
      </table>

      <h3>Grant snippet (after review)</h3>
      <pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:13px">update profiles
set active_trial = true,
    billing_period_end_at = greatest(billing_period_end_at, now()) + interval '7 days'
where id = '${user.id}';</pre>
    `,
  })

  if (error) {
    console.error("Resend error:", error)
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
