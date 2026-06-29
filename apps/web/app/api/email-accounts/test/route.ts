import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { decryptSecret } from "@workspace/supabase/crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const testSchema = z.object({
  id: z.string().uuid("Invalid account ID."),
})

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return err("Unauthorized.", 401)

  const body = await request.json().catch(() => null)
  const parsed = testSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { data: row } = await supabaseAdmin
    .from("email_accounts")
    .select(
      "id, smtp_host, smtp_port, smtp_user, smtp_pass, imap_host, imap_port, imap_user, imap_pass"
    )
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .eq("is_public", false)
    .maybeSingle()

  if (!row) return err("Account not found.", 404)

  if (!row.smtp_host || !row.smtp_port || !row.smtp_user || !row.smtp_pass) {
    return err("Account is missing SMTP configuration.", 422)
  }

  let smtpPassword: string
  let imapPassword: string | null = null

  try {
    smtpPassword = decryptSecret(row.smtp_pass)
    if (row.imap_pass) imapPassword = decryptSecret(row.imap_pass)
  } catch {
    return err("Failed to decrypt credentials.", 500)
  }

  const results: {
    smtp: { ok: boolean; error?: string }
    imap: { ok: boolean; error?: string } | null
  } = { smtp: { ok: false }, imap: null }

  // SMTP test
  try {
    const transporter = nodemailer.createTransport({
      host: row.smtp_host,
      port: row.smtp_port,
      secure: row.smtp_port === 465,
      auth: { user: row.smtp_user, pass: smtpPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    })
    await transporter.verify()
    results.smtp = { ok: true }
  } catch (e) {
    results.smtp = { ok: false, error: (e as Error).message }
  }

  // IMAP test
  const imapHost = row.imap_host
  const imapPort = row.imap_port
  const imapUser = row.imap_user ?? row.smtp_user
  const resolvedImapPass = imapPassword ?? smtpPassword

  if (imapHost && imapPort) {
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapPort === 993,
      auth: { user: imapUser, pass: resolvedImapPass },
      logger: false,
      connectionTimeout: 10_000,
    })
    try {
      await client.connect()
      await client.logout()
      results.imap = { ok: true }
    } catch (e) {
      results.imap = { ok: false, error: (e as Error).message }
    }
  }

  const allOk = results.smtp.ok && (results.imap === null || results.imap.ok)
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 422 })
}
