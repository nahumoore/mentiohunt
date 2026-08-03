export type AccountProvider =
  | "gmail"
  | "outlook"
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
  sendAutomatedOutreach: boolean
  connectedAt: string
  errorMessage?: string
  smtpHost?: string
  smtpPort?: number
  imapHost?: string
  imapPort?: number
}
