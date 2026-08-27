import { NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import { z } from "zod"

import { PRIMARY_EMAIL } from "@workspace/email-settings"
import {
  CANCELLATION_REASON_IDS,
  cancellationReasonLabel,
  toStripeCancellationFeedback,
} from "@/consts/cancellation"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"
import { getSubscriptionState } from "@/actions/stripe-subscription-state"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const cancelSchema = z.object({
  reason: z.enum(CANCELLATION_REASON_IDS),
  detail: z.string().trim().max(2000).optional(),
})

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return err("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }
  const { reason, detail } = parsed.data

  const state = await getSubscriptionState()
  if (!state) return err("No active subscription to cancel.", 404)
  if (state.cancelAtPeriodEnd) {
    return NextResponse.json({ ok: true, cancelAt: state.currentPeriodEnd })
  }

  try {
    await stripe.subscriptions.update(state.subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        feedback: toStripeCancellationFeedback(reason),
        comment: detail?.slice(0, 500),
      },
    })
  } catch (err2) {
    console.error("Stripe cancel error:", err2)
    return err("Could not cancel your subscription. Try again.", 500)
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, name, tier, active_trial")
    .eq("id", user.id)
    .maybeSingle()

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: "Mentiohunt <contact@mentiohunt.com>",
      to: PRIMARY_EMAIL,
      replyTo: profile?.email ?? user.email ?? undefined,
      subject: `Cancellation: ${profile?.email ?? user.email ?? user.id} (${cancellationReasonLabel(reason)})`,
      html: `
        <h2>Subscription Cancellation</h2>

        <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td><strong>User ID</strong></td><td>${user.id}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(profile?.email ?? user.email ?? "—")}</td></tr>
          <tr><td><strong>Name</strong></td><td>${escapeHtml(profile?.name ?? "—")}</td></tr>
          <tr><td><strong>Tier</strong></td><td>${escapeHtml(profile?.tier ?? "—")}</td></tr>
          <tr><td><strong>Was on trial</strong></td><td>${String(state.isTrialing || profile?.active_trial === true)}</td></tr>
          <tr><td><strong>Access ends</strong></td><td>${escapeHtml(state.currentPeriodEnd)}</td></tr>
          <tr><td><strong>Reason</strong></td><td>${escapeHtml(cancellationReasonLabel(reason))}</td></tr>
          <tr><td><strong>Detail</strong></td><td>${escapeHtml(detail ?? "—")}</td></tr>
        </table>
      `,
    })
  } catch (emailError) {
    // The Stripe cancel already went through — don't fail the request over
    // a notification email, same as notifyBillingChange in api/payment/route.ts.
    console.error("Failed to send cancellation notification email:", emailError)
  }

  return NextResponse.json({ ok: true, cancelAt: state.currentPeriodEnd })
}
