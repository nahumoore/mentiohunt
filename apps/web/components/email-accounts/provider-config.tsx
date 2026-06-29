import { IconServer } from "@tabler/icons-react"

import type { AccountProvider } from "@/app/dashboard/email-accounts/_data"

type ProviderMeta = {
  label: string
  faviconDomain: string | null
  smtpHost?: string
  smtpPort?: number
  imapHost?: string
  imapPort?: number
  smtpUserPlaceholder?: string
  smtpPassPlaceholder?: string
}

export const PROVIDER_CONFIG: Record<AccountProvider, ProviderMeta> = {
  gmail: {
    label: "Gmail / Google Workspace",
    faviconDomain: "gmail.com",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    imapHost: "imap.gmail.com",
    imapPort: 993,
    smtpUserPlaceholder: "you@yourdomain.com",
    smtpPassPlaceholder: "Password",
  },
  outlook: {
    label: "Outlook / Microsoft 365",
    faviconDomain: "outlook.com",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    imapHost: "outlook.office365.com",
    imapPort: 993,
    smtpUserPlaceholder: "you@outlook.com",
    smtpPassPlaceholder: "Password",
  },
zoho: {
    label: "Zoho Mail",
    faviconDomain: "zoho.com",
    smtpHost: "smtp.zoho.com",
    smtpPort: 587,
    imapHost: "imap.zoho.com",
    imapPort: 993,
    smtpUserPlaceholder: "you@zoho.com",
    smtpPassPlaceholder: "Password",
  },
  smtp: {
    label: "Custom SMTP",
    faviconDomain: null,
    smtpUserPlaceholder: "you@yourdomain.com",
    smtpPassPlaceholder: "••••••••",
  },
}

export function ProviderIcon({
  provider,
  size = "size-9",
}: {
  provider: AccountProvider
  size?: string
}) {
  const cfg = PROVIDER_CONFIG[provider]

  if (!cfg.faviconDomain) {
    return (
      <span
        className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-muted shadow-sm ring-1 ring-border/60`}
      >
        <IconServer className="size-4 text-muted-foreground" />
      </span>
    )
  }

  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/60`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${cfg.faviconDomain}&sz=32`}
        alt={cfg.label}
        width={18}
        height={18}
        className="size-[18px]"
      />
    </span>
  )
}
