import { notifyOwnMailboxActivated } from "@/lib/notify-outreach-mailbox-activated"
import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { encryptSecret } from "@workspace/supabase/crypto"
import type { TablesInsert } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"
import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const postSchema = z.object({
  provider: z.enum(["gmail", "outlook", "zoho", "smtp"]),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  smtpHost: z.string().min(1, "SMTP host is required."),
  smtpPort: z.coerce.number().int().positive("SMTP port must be a positive integer."),
  smtpUser: z.string().min(1, "SMTP username is required."),
  smtpPass: z.string().min(1, "SMTP password is required."),
  imapHost: z.string().optional(),
  imapPort: z.coerce.number().int().positive().optional(),
  imapUser: z.string().optional(),
  imapPass: z.string().optional(),
  sameCredentials: z.boolean().default(true),
  dailySendCap: z.coerce.number().int().positive().optional(),
  sendAutomatedOutreach: z.boolean().default(false),
})

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return err("Unauthorized.", 401)

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  if (!isPaid) return err("Email accounts are available on paid plans only.", 403)

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const {
    provider,
    name,
    email,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    imapHost,
    imapPort,
    imapUser,
    imapPass,
    sameCredentials,
    dailySendCap,
    sendAutomatedOutreach,
  } = parsed.data

  // Test SMTP before saving
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    })
    await transporter.verify()
  } catch (e) {
    return NextResponse.json(
      { error: `SMTP connection failed: ${(e as Error).message}`, field: "smtp" },
      { status: 422 }
    )
  }

  // Test IMAP before saving (if configured)
  if (imapHost && imapPort) {
    const resolvedUser = sameCredentials ? smtpUser : (imapUser ?? smtpUser)
    const resolvedPass = sameCredentials ? smtpPass : (imapPass ?? smtpPass)
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapPort === 993,
      auth: { user: resolvedUser, pass: resolvedPass },
      logger: false,
      connectionTimeout: 10_000,
    })
    try {
      await client.connect()
      await client.logout()
    } catch (e) {
      return NextResponse.json(
        { error: `IMAP connection failed: ${(e as Error).message}`, field: "imap" },
        { status: 422 }
      )
    }
  }

  const payload: TablesInsert<"email_accounts"> = {
    user_id: user.id,
    is_public: false,
    provider,
    name,
    email,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_user: smtpUser,
    smtp_pass: encryptSecret(smtpPass),
    imap_host: imapHost ?? null,
    imap_port: imapPort ?? null,
    imap_user: sameCredentials ? null : (imapUser ?? null),
    imap_pass: sameCredentials || !imapPass ? null : encryptSecret(imapPass),
    status: "active",
    send_automated_outreach: sendAutomatedOutreach,
    ...(dailySendCap !== undefined ? { daily_send_cap: dailySendCap } : {}),
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("email_accounts")
    .insert(payload)
    .select("id")
    .single()

  if (insertError) {
    console.error("Failed to insert email account:", insertError)
    return err("Failed to save email account.", 500)
  }

  if (sendAutomatedOutreach) {
    await notifyOwnMailboxActivated(email, user.id)
  }

  return NextResponse.json({ ok: true, id: inserted.id })
}
