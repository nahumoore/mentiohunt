"use client"

import {
  IconAlertTriangle,
  IconArrowLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconInfoCircle,
  IconLink,
  IconMailForward,
  IconMailOff,
  IconPlus,
  IconShieldLock,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

import type {
  AccountProvider,
  AccountStatus,
  EmailAccount,
} from "@/app/dashboard/email-accounts/_data"
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
      className="group flex flex-col gap-3 rounded-2xl bg-card px-5 py-4 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md hover:ring-foreground/10 sm:grid sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3 sm:contents">
        <ProviderIcon provider={account.provider} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-none">
          <span className="truncate text-sm font-semibold text-foreground">
            {account.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {PROVIDER_CONFIG[account.provider].label}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/50">
          Inbox
        </span>
        <span className="truncate text-sm text-foreground">
          {account.email}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/50">
          Daily cap
        </span>
        <span className="text-sm text-foreground tabular-nums">
          {account.dailySendCap} emails/day
        </span>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={account.status} />
        <IconChevronRight className="size-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60 sm:ml-auto" />
      </div>
    </Link>
  )
}

const APP_PASSWORD_CALLOUT: Partial<
  Record<AccountProvider, { text: string; href: string }>
> = {
  gmail: {
    text: "Gmail blocks plain passwords. Enable 2-Step Verification, then generate a 16-character App Password to use here.",
    href: "https://myaccount.google.com/apppasswords",
  },
  outlook: {
    text: "Microsoft requires an App Password when MFA is enabled. Generate one in your Microsoft account security settings.",
    href: "https://account.live.com/proofs/AppPassword",
  },
}

const PROVIDER_ORDER: AccountProvider[] = [
  "gmail",
  "outlook",
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
    <div className="grid grid-cols-2 gap-3">
      {PROVIDER_ORDER.map((p) => {
        const cfg = PROVIDER_CONFIG[p]
        const active = selected === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 bg-background hover:border-border hover:bg-muted/30"
            )}
          >
            <ProviderIcon provider={p} size="size-8" />
            <span className="text-sm font-medium text-foreground">
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function CredentialsForm({
  provider,
  onBack,
  onConnected,
}: {
  provider: AccountProvider
  onBack: () => void
  onConnected: () => void
}) {
  const cfg = PROVIDER_CONFIG[provider]
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [smtpHost, setSmtpHost] = useState(cfg.smtpHost ?? "")
  const [smtpPort, setSmtpPort] = useState(String(cfg.smtpPort ?? ""))
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [sameCredentials, setSameCredentials] = useState(true)
  const [imapHost, setImapHost] = useState(cfg.imapHost ?? "")
  const [imapPort, setImapPort] = useState(String(cfg.imapPort ?? ""))
  const [imapUser, setImapUser] = useState("")
  const [imapPass, setImapPass] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callout = APP_PASSWORD_CALLOUT[provider]

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/email-accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name,
          email,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          imapHost: imapHost || undefined,
          imapPort: imapPort ? Number(imapPort) : undefined,
          imapUser: imapUser || undefined,
          imapPass: imapPass || undefined,
          sameCredentials,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.")
        return
      }
      router.refresh()
      onConnected()
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 pt-1">
      {callout && (
        <div className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-3">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
            {callout.text}{" "}
            <a
              href={callout.href}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2"
            >
              Generate App Password →
            </a>
          </p>
        </div>
      )}

      {/* Identity */}
      <div className="space-y-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
          Account name
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Send from</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Email address</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourdomain.com"
              type="email"
            />
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div className="space-y-2 border-t border-border/50 pt-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
          SMTP — sending
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Host</label>
            <Input
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.yourdomain.com"
            />
          </div>
          <div className="w-20 space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Port</label>
            <Input
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              type="number"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Username</label>
            <Input
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder={cfg.smtpUserPlaceholder ?? "you@yourdomain.com"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Password</label>
            <Input
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder={cfg.smtpPassPlaceholder ?? "••••••••"}
              type="password"
            />
          </div>
        </div>
      </div>

      {/* IMAP */}
      <div className="space-y-2 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
            IMAP — reply reading
          </p>
          <label className="flex cursor-pointer items-center gap-1.5">
            <span className="text-[0.68rem] text-muted-foreground">
              Same credentials
            </span>
            <Switch
              checked={sameCredentials}
              onCheckedChange={setSameCredentials}
              className="scale-75"
            />
          </label>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Host</label>
            <Input
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              placeholder="imap.yourdomain.com"
            />
          </div>
          <div className="w-20 space-y-1.5">
            <label className="text-[0.68rem] text-muted-foreground">Port</label>
            <Input
              value={imapPort}
              onChange={(e) => setImapPort(e.target.value)}
              placeholder="993"
              type="number"
            />
          </div>
        </div>
        {!sameCredentials && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[0.68rem] text-muted-foreground">Username</label>
              <Input
                value={imapUser}
                onChange={(e) => setImapUser(e.target.value)}
                placeholder={cfg.smtpUserPlaceholder ?? "you@yourdomain.com"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.68rem] text-muted-foreground">Password</label>
              <Input
                value={imapPass}
                onChange={(e) => setImapPass(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Credentials are encrypted at rest. We only send from this address and read replies.
      </p>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={loading}>
          <IconArrowLeft className="size-3.5" />
          Back
        </Button>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Connecting…" : "Connect account"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConnectAccountDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedProvider, setSelectedProvider] =
    useState<AccountProvider | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setStep(1)
      setSelectedProvider(null)
    }
  }

  function handleProviderSelect(p: AccountProvider) {
    setSelectedProvider(p)
  }

  function handleContinue() {
    if (selectedProvider) setStep(2)
  }

  function handleBack() {
    setStep(1)
  }

  function handleConnected() {
    setOpen(false)
    setStep(1)
    setSelectedProvider(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4" />
          Connect account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>Connect email account</DialogTitle>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose your email provider. We&apos;ll pre-fill the server settings for you.
            </p>
            <ProviderPicker
              selected={selectedProvider}
              onSelect={handleProviderSelect}
            />
            <div className="flex justify-end gap-2 pt-1">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                size="sm"
                disabled={!selectedProvider}
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && selectedProvider && (
          <CredentialsForm
            provider={selectedProvider}
            onBack={handleBack}
            onConnected={handleConnected}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export type UserPlan = "active" | "free_trial" | "canceled"

const REPLY_BULLETS = [
  {
    icon: <IconMailForward className="size-4 text-primary" />,
    title: "Reply as yourself",
    body: "The moment a prospect responds, you continue the conversation from your own address — not Mentiohunt's shared pool.",
  },
  {
    icon: <IconLink className="size-4 text-primary" />,
    title: "Keep every thread intact",
    body: "Your reply matches the original message headers, so it lands in the same thread instead of starting a new email.",
  },
  {
    icon: <IconTrendingUp className="size-4 text-primary" />,
    title: "Protect your sending reputation",
    body: "Dedicated inboxes hold their own reputation. One bad actor in a shared pool doesn't affect you.",
  },
]

function LockedFeatureState({ plan }: { plan: Exclude<UserPlan, "active"> }) {
  const isTrial = plan === "free_trial"

  return (
    <div className="max-w-3xl">
      {/* Plan badge + context */}
      {!isTrial && (
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-red-600 ring-1 ring-red-500/20">
            <IconX className="size-3" />
            Subscription inactive
          </span>
          <p className="text-sm text-muted-foreground">
            Your subscription is inactive. Outreach has paused.
          </p>
        </div>
      )}

      {/* Current state card — what happens today when a prospect replies */}
      <div className="mb-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/50">
          Where replies land today
        </p>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border/60">
            <IconMailOff className="size-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Mentiohunt&apos;s shared inbox
            </p>
            <p className="text-xs text-muted-foreground">
              You can see a reply arrived — you can&apos;t respond from it
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-700 ring-1 ring-amber-500/20">
            <IconShieldLock className="size-3" />
            {isTrial ? "Free trial" : "Subscription inactive"}
          </span>
        </div>
      </div>

      {/* Unlock bullets — 3 columns to stay compact */}
      <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/4 px-5 py-5">
        <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-wider text-primary/70">
          Connect your inbox on a paid plan to
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {REPLY_BULLETS.map((bullet) => (
            <div key={bullet.title} className="flex flex-col gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg border border-primary/15 bg-primary/8">
                {bullet.icon}
              </span>
              <p className="text-sm font-semibold text-foreground">{bullet.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{bullet.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/billing"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-crimson-carrot"
        >
          {isTrial ? "Upgrade to reply personally" : "Reactivate to reply personally"}
        </Link>
        <p className="text-xs text-muted-foreground">
          Reply as yourself · keep threads intact · protect your reputation
        </p>
      </div>
    </div>
  )
}

export function EmailAccountsClient({
  userPlan = "active",
  accounts,
}: {
  userPlan?: UserPlan
  accounts: EmailAccount[]
}) {
  if (userPlan === "free_trial" || userPlan === "canceled") {
    return <LockedFeatureState plan={userPlan} />
  }

  const activeCount = accounts.filter((a) => a.status === "active").length
  const totalCap = accounts.reduce((sum, a) => sum + a.dailySendCap, 0)

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-4xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <IconMailOff className="size-5 text-primary" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            No inbox connected yet
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Connect your own mailbox so you&apos;re ready the moment a prospect
            replies. Outreach keeps sending automatically either way — this is
            what lets you pick up the conversation personally.
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
