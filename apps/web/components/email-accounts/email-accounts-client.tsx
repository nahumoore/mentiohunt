"use client"

import {
  IconAlertTriangle,
  IconBrandGoogle,
  IconBrandOffice,
  IconChevronRight,
  IconCircleCheckFilled,
  IconMailOff,
  IconPlus,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useState } from "react"

import type {
  AccountProvider,
  AccountStatus,
  EmailAccount,
  SmtpProvider,
} from "@/app/dashboard/email-accounts/_data"
import { SEED_ACCOUNTS, isOAuthProvider } from "@/app/dashboard/email-accounts/_data"
import { PROVIDER_CONFIG, ProviderIcon } from "./provider-config"

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  active: {
    label: "Active",
    icon: <IconCircleCheckFilled className="size-3" />,
    className: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20",
  },
  error: {
    label: "Error",
    icon: <IconAlertTriangle className="size-3" />,
    className: "text-red-600 bg-red-500/10 ring-red-500/20",
  },
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ring-1",
        cfg.className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function AccountCard({ account }: { account: EmailAccount }) {
  return (
    <Link
      href={`/dashboard/email-accounts/${account.id}`}
      className="group grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md hover:ring-foreground/10"
    >
      {/* Identity */}
      <ProviderIcon provider={account.provider} />

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">
          {account.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {account.email}
        </span>
      </div>

      {/* Provider */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/50">
          Provider
        </span>
        <span className="text-sm text-foreground">
          {PROVIDER_CONFIG[account.provider].label}
        </span>
      </div>

      {/* Send cap */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/50">
          Daily cap
        </span>
        <span className="text-sm text-foreground tabular-nums">
          {account.dailySendCap} emails/day
        </span>
      </div>

      {/* Status + arrow */}
      <div className="flex items-center gap-3">
        <StatusBadge status={account.status} />
        <IconChevronRight className="size-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
      </div>
    </Link>
  )
}

const PROVIDER_ORDER: AccountProvider[] = [
  "gmail",
  "google_workspace",
  "outlook",
  "yahoo",
  "zoho",
  "smtp",
]

function ProviderPicker({
  selected,
  onSelect,
}: {
  selected: AccountProvider | null
  onSelect: (p: AccountProvider) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PROVIDER_ORDER.map((p) => {
        const cfg = PROVIDER_CONFIG[p]
        const active = selected === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 bg-background hover:border-border hover:bg-muted/30"
            )}
          >
            <ProviderIcon provider={p} size="size-8" />
            <span className="text-[0.65rem] font-medium leading-tight text-muted-foreground">
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const OAUTH_ICON: Record<string, React.ReactNode> = {
  gmail: <IconBrandGoogle className="size-4" />,
  google_workspace: <IconBrandGoogle className="size-4" />,
  outlook: <IconBrandOffice className="size-4" />,
}

const OAUTH_BUTTON_LABEL: Record<string, string> = {
  gmail: "Continue with Google",
  google_workspace: "Continue with Google",
  outlook: "Continue with Microsoft",
}

function OAuthForm({ provider }: { provider: AccountProvider }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <ProviderIcon provider={provider} size="size-14" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Connect {PROVIDER_CONFIG[provider].label}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Authorize via OAuth — no password stored. Mentiohunt only sends from
          this address and reads replies.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button disabled className="gap-2">
          {OAUTH_ICON[provider]}
          {OAUTH_BUTTON_LABEL[provider]}
        </Button>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-amber-600 ring-1 ring-amber-500/20">
          Coming soon
        </span>
      </div>
    </div>
  )
}

function SmtpForm({ provider }: { provider: SmtpProvider }) {
  const cfg = PROVIDER_CONFIG[provider]
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
            Your name
          </label>
          <Input placeholder="Alex Johnson" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
            Email address
          </label>
          <Input placeholder="you@yourdomain.com" type="email" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[0.7rem] font-bold tracking-wide text-muted-foreground uppercase">
          SMTP (sending)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Host</label>
            <Input defaultValue={cfg.smtpHost ?? ""} placeholder="smtp.yourdomain.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Port</label>
            <Input defaultValue={cfg.smtpPort ?? ""} placeholder="587" type="number" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Username</label>
            <Input placeholder="you@yourdomain.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Password</label>
            <Input placeholder="••••••••" type="password" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[0.7rem] font-bold tracking-wide text-muted-foreground uppercase">
          IMAP (reply reading)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Host</label>
            <Input defaultValue={cfg.imapHost ?? ""} placeholder="imap.yourdomain.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Port</label>
            <Input defaultValue={cfg.imapPort ?? ""} placeholder="993" type="number" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Username</label>
            <Input placeholder="you@yourdomain.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Password</label>
            <Input placeholder="••••••••" type="password" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Credentials are encrypted at rest. We only send from this address and read replies.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="sm">
            Cancel
          </Button>
        </DialogClose>
        <Button type="button" size="sm">
          Connect account
        </Button>
      </div>
    </div>
  )
}

function ConnectAccountDialog() {
  const [open, setOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] =
    useState<AccountProvider | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSelectedProvider(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4" />
          Connect account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Connect email account</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Choose your email provider to get started.
        </p>

        <ProviderPicker
          selected={selectedProvider}
          onSelect={setSelectedProvider}
        />

        {selectedProvider && (
          <div className="border-t border-border/50 pt-4">
            {isOAuthProvider(selectedProvider) ? (
              <OAuthForm provider={selectedProvider} />
            ) : (
              <SmtpForm provider={selectedProvider as SmtpProvider} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EmailAccountsClient() {
  const [accounts] = useState<EmailAccount[]>(SEED_ACCOUNTS)

  const activeCount = accounts.filter((a) => a.status === "active").length
  const totalCap = accounts
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.dailySendCap, 0)

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-4xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <IconMailOff className="size-5 text-primary" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            No email accounts connected
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Connect your sending mailbox to let Mentiohunt run outreach on
            autopilot. Replies get classified automatically — you only see what
            needs a decision.
          </p>
          <ConnectAccountDialog />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{activeCount}</span> active ·{" "}
          <span className="font-medium text-foreground tabular-nums">{totalCap}</span> emails/day
          capacity
        </p>
        <div className="ml-auto">
          <ConnectAccountDialog />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

    </div>
  )
}
