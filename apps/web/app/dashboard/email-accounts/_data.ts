export type AccountProvider =
  | "gmail"
  | "google_workspace"
  | "outlook"
  | "yahoo"
  | "zoho"
  | "smtp"

export type AccountStatus = "active" | "error"

export type EmailAccount = {
  id: string
  email: string
  name: string
  provider: AccountProvider
  status: AccountStatus
  dailySendCap: number
  connectedAt: string
  errorMessage?: string
  smtpHost?: string
  smtpPort?: number
  imapHost?: string
  imapPort?: number
}

export const SEED_ACCOUNTS: EmailAccount[] = [
  {
    id: "1",
    email: "alex@acmecorp.io",
    name: "Alex Johnson",
    provider: "gmail",
    status: "active",
    dailySendCap: 30,
    connectedAt: "2026-06-10",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    imapHost: "imap.gmail.com",
    imapPort: 993,
  },
  {
    id: "2",
    email: "outreach@acmecorp.io",
    name: "Acme Outreach",
    provider: "outlook",
    status: "active",
    dailySendCap: 20,
    connectedAt: "2026-06-18",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    imapHost: "outlook.office365.com",
    imapPort: 993,
  },
  {
    id: "3",
    email: "hello@acmecorp.io",
    name: "Hello Acme",
    provider: "zoho",
    status: "error",
    dailySendCap: 15,
    connectedAt: "2026-06-20",
    errorMessage: "SMTP authentication failed. Check your credentials.",
    smtpHost: "smtp.zoho.com",
    smtpPort: 587,
    imapHost: "imap.zoho.com",
    imapPort: 993,
  },
]
