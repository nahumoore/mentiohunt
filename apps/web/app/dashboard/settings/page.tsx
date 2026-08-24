"use client"

import {
  IconBellRinging,
  IconCreditCard,
  IconExternalLink,
  IconLock,
  IconShieldLock,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"

import { AccountTab } from "@/components/dashboard/settings/account-tab"
import { PasswordTab } from "@/components/dashboard/settings/password-tab"
import { SettingsSaveFooter } from "@/components/link-building/sources/settings-save-footer"
import {
  updateEmailSettings,
  updateProfileName,
} from "@/actions/update-profile"
import { useQueryState } from "@/hooks/use-query-state"
import { useProfileStore } from "@/stores/profile-store"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

type EmailSettings = { alerts: boolean; marketing: boolean }

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  alerts: true,
  marketing: true,
}

type SettingsTab = "profile" | "notifications" | "billing" | "password" | "account"

function isSettingsTab(value: string): value is SettingsTab {
  return (
    value === "profile" ||
    value === "notifications" ||
    value === "billing" ||
    value === "password" ||
    value === "account"
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useQueryState<SettingsTab>(
    "tab",
    "profile",
    isSettingsTab
  )
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)

  const [name, setName] = useState(profile?.name ?? "")
  const [isSavingName, startNameTransition] = useTransition()
  const [nameMessage, setNameMessage] = useState<string | null>(null)

  useEffect(() => {
    setName(profile?.name ?? "")
  }, [profile?.name])

  const hasUnsavedNameChanges = name.trim() !== (profile?.name ?? "")

  const emailSettings =
    (profile?.email_settings as EmailSettings | null) ??
    DEFAULT_EMAIL_SETTINGS
  const [isSavingEmailSettings, startEmailSettingsTransition] = useTransition()

  function handleSaveName() {
    setNameMessage(null)
    startNameTransition(async () => {
      const result = await updateProfileName(name)
      if (result.error) {
        setNameMessage(result.error)
        return
      }
      if (profile) setProfile({ ...profile, name: result.name ?? null })
      setNameMessage("Profile saved.")
    })
  }

  function handleToggleEmailSetting(key: keyof EmailSettings) {
    const next = { ...emailSettings, [key]: !emailSettings[key] }
    startEmailSettingsTransition(async () => {
      const result = await updateEmailSettings(next)
      if (result.error || !profile) return
      setProfile({ ...profile, email_settings: result.email_settings ?? next })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)} className="gap-4">
        <div className="overflow-x-auto overflow-y-hidden">
        <TabsList>
          <TabsTrigger value="profile">
            <IconUser className="size-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBellRinging className="size-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing">
            <IconCreditCard className="size-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="password">
            <IconLock className="size-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="account">
            <IconShieldLock className="size-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="profile">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
            <div className="border-b border-border/70 px-6 py-5">
              <p className="text-base font-semibold">Profile</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Your name and account email.
              </p>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="settings-name" className="text-sm">Name</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-10 max-w-sm text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email" className="text-sm">Email</Label>
                <Input
                  id="settings-email"
                  value={profile?.email ?? ""}
                  disabled
                  className="h-10 max-w-sm text-base"
                />
              </div>
            </div>
            <SettingsSaveFooter
              message={nameMessage}
              helper="Your name appears on outreach drafts sent on your behalf."
              isSaving={isSavingName}
              hasUnsavedChanges={hasUnsavedNameChanges}
              onSave={handleSaveName}
              saveLabel="Save profile"
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
            <div className="border-b border-border/70 px-6 py-5">
              <p className="text-base font-semibold">Notifications</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose which emails you want to receive.
              </p>
            </div>
            <div className="flex items-center gap-4 border-b border-border/70 px-6 py-5 last:border-b-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconBellRinging className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium">Opportunity alerts</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  New backlink opportunities ready for review.
                </p>
              </div>
              <Switch
                checked={emailSettings.alerts}
                disabled={isSavingEmailSettings}
                onCheckedChange={() => handleToggleEmailSetting("alerts")}
                className="mt-0.5 shrink-0"
              />
            </div>
            <div className="flex items-center gap-4 px-6 py-5 last:border-b-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconSparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium">Product updates</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Tips, new features, and occasional offers.
                </p>
              </div>
              <Switch
                checked={emailSettings.marketing}
                disabled={isSavingEmailSettings}
                onCheckedChange={() => handleToggleEmailSetting("marketing")}
                className="mt-0.5 shrink-0"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
            <div className="border-b border-border/70 px-6 py-5">
              <p className="text-base font-semibold">Billing</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Manage your plan and payment details.
              </p>
            </div>
            <div className="px-6 py-5">
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">
                  <IconCreditCard />
                  Go to billing
                  <IconExternalLink />
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="password">
          <PasswordTab />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
