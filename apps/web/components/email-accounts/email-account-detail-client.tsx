"use client"

import {
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconRefresh,
  IconServer,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

import type { EmailAccount } from "@/app/dashboard/email-accounts/_data"
import { PROVIDER_CONFIG, ProviderIcon } from "./provider-config"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      {children}
    </div>
  )
}

function SaveFooter({
  onRemove,
}: {
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button size="sm">Save changes</Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <IconTrash className="size-3.5" />
        Remove account
      </Button>
    </div>
  )
}

export function EmailAccountDetailClient({
  account,
}: {
  account: EmailAccount
}) {
  const [name, setName] = useState(account.name)
  const [cap, setCap] = useState(String(account.dailySendCap))

  const providerCfg = PROVIDER_CONFIG[account.provider]

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="flex items-center gap-2.5 font-heading text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">
            <ProviderIcon provider={account.provider} size="size-8" />
            {account.name}
          </h1>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ring-1",
              account.status === "active"
                ? "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20"
                : "text-red-600 bg-red-500/10 ring-red-500/20"
            )}
          >
            {account.status === "active" ? (
              <IconCircleCheckFilled className="size-3" />
            ) : (
              <IconAlertTriangle className="size-3" />
            )}
            {account.status === "active" ? "Active" : "Error"}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {account.email} · {providerCfg.label} · Connected{" "}
          {new Date(account.connectedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {account.status === "error" && account.errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-500/5 px-4 py-3 ring-1 ring-red-500/15">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Connection error
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              {account.errorMessage}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto shrink-0 text-red-600 hover:bg-red-500/10 hover:text-red-700"
          >
            <IconRefresh className="size-3.5" />
            Reconnect
          </Button>
        </div>
      )}

      <Tabs defaultValue="general" className="gap-4">
        <TabsList>
          <TabsTrigger value="general">
            <IconSettings className="size-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="connection">
            <IconServer className="size-4" />
            <span>Connection</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-6">
          <SectionCard>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Display name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                  />
                </Field>
                <Field label="Email address">
                  <Input
                    value={account.email}
                    readOnly
                    className="text-muted-foreground"
                  />
                </Field>
              </div>

              <Field label="Daily send cap">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={cap}
                    onChange={(e) => setCap(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">
                    emails / day
                  </span>
                </div>
              </Field>
            </div>
          </SectionCard>

          <SaveFooter onRemove={() => {}} />
        </TabsContent>

        <TabsContent value="connection" className="flex flex-col gap-6">
          <SectionCard>
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p className="text-[0.7rem] font-bold tracking-wide text-muted-foreground uppercase">
                  SMTP (sending)
                </p>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <IconRefresh className="size-3.5" />
                  Test connection
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[0.68rem] text-muted-foreground">
                    Host
                  </label>
                  <Input defaultValue={account.smtpHost ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.68rem] text-muted-foreground">
                    Port
                  </label>
                  <Input
                    defaultValue={account.smtpPort ?? ""}
                    type="number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[0.68rem] text-muted-foreground">
                    Username
                  </label>
                  <Input defaultValue={account.email} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.68rem] text-muted-foreground">
                    Password
                  </label>
                  <Input placeholder="••••••••" type="password" />
                </div>
              </div>

              <div className="space-y-3 border-t border-border/50 pt-2">
                <p className="text-[0.7rem] font-bold tracking-wide text-muted-foreground uppercase">
                  IMAP (reply reading)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[0.68rem] text-muted-foreground">
                      Host
                    </label>
                    <Input defaultValue={account.imapHost ?? ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[0.68rem] text-muted-foreground">
                      Port
                    </label>
                    <Input
                      defaultValue={account.imapPort ?? ""}
                      type="number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[0.68rem] text-muted-foreground">
                      Username
                    </label>
                    <Input defaultValue={account.email} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[0.68rem] text-muted-foreground">
                      Password
                    </label>
                    <Input placeholder="••••••••" type="password" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Credentials are encrypted at rest. We only send from this
                address and read replies.
              </p>
            </div>
          </SectionCard>

          <SaveFooter onRemove={() => {}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
