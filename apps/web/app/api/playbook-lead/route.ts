import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import { PLAYBOOK_TITLE, PLAYBOOK_URL } from "@/lib/playbook"
import disposableDomains from "disposable-email-domains"
import disposableWildcards from "disposable-email-domains/wildcard.json"
import { escapeHtml, mentiohuntTemplate } from "@workspace/email-template"
import { FOUNDER_FROM } from "@workspace/email-settings"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  sourcePath: z.string().trim().max(300).optional(),
})

const DISPOSABLE_SET = new Set(disposableDomains as string[])
const DISPOSABLE_WILDCARDS = disposableWildcards as string[]

function isDisposableDomain(domain: string): boolean {
  if (DISPOSABLE_SET.has(domain)) return true
  return DISPOSABLE_WILDCARDS.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`)
  )
}

// Rolling window, per IP — a marketing form has no session/account to key
// off, so this is the only practical guard against a submit-spam script.
const WINDOW_MS = 60_000
const WINDOW_MAX = 5
const submitsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (submitsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  submitsByIp.set(ip, recent)
  return recent.length > WINDOW_MAX
}

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Backs the exit-intent playbook modal. Always responds { ok: true } for a
// well-formed, non-disposable email — whether or not it was already on the
// list — so the response never leaks list membership.
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (isRateLimited(ip)) {
    return err("Too many requests — try again in a minute.", 429)
  }

  const body = await request.json().catch(() => null)
  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return err("That email didn't go through. Mind checking it?")
  }

  const { email, sourcePath } = parsed.data
  const domain = email.split("@")[1]
  if (!domain || isDisposableDomain(domain)) {
    return err("That email didn't go through. Mind checking it?")
  }

  const { error: dbError } = await supabaseAdmin.from("leads").upsert(
    {
      email,
      source: "playbook_exit_modal",
      source_path: sourcePath ?? null,
    },
    { onConflict: "email", ignoreDuplicates: true }
  )

  if (dbError) {
    console.error("[playbook-lead] Failed to save lead:", dbError)
    return err("Something went wrong on our end. Try again shortly.", 500)
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(
      "[playbook-lead] Missing RESEND_API_KEY, skipping delivery email"
    )
    return NextResponse.json({ ok: true })
  }

  const resend = new Resend(apiKey)
  const { subject, html } = mentiohuntTemplate({
    subject: "Your backlink playbook",
    previewText: `${PLAYBOOK_TITLE} — the exact process, start to finish.`,
    footerReason:
      "You received this email because you requested our backlink playbook.",
    body: `
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:24px; color:#241611; margin:0 0 16px; line-height:1.3; letter-spacing:-0.4px;">${escapeHtml(PLAYBOOK_TITLE)}</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">It's the exact process we use for our own site and our customers' — prospecting methods, how we find the right contact, what we offer instead of paying, and the outreach emails word for word.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${PLAYBOOK_URL}" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Open the playbook</a>
          </td>
        </tr>
      </table>
    `,
  })

  const { error: sendError } = await resend.emails.send({
    from: FOUNDER_FROM,
    to: email,
    subject,
    html,
  })

  if (sendError) {
    // Lead is already saved — don't fail the request over delivery. Worth
    // knowing about, but not worth telling the visitor their submit failed.
    console.error("[playbook-lead] Failed to send delivery email:", sendError)
  }

  return NextResponse.json({ ok: true })
}
