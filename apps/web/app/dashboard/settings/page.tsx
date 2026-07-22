"use client"

import {
  IconBellRinging,
  IconCreditCard,
  IconExternalLink,
  IconLock,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"

import { PasswordTab } from "@/components/dashboard/settings/password-tab"
import { SettingsSaveFooter } from "@/components/link-building/sources/settings-save-footer"
import {
  updateEmailSettings,
  updateProfileName,
} from "@/actions/update-profile"
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

export default function SettingsPage() {
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
      <Tabs defaultValue="profile" className="gap-4">
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
        </TabsList>
        </div>

        <TabsContent value="profile">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
            <div className="border-b border-border/70 px-5 py-4">
              <p className="text-sm font-medium">Profile</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your name and account email.
              </p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name">Name</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  value={profile?.email ?? ""}
                  disabled
                  className="max-w-sm"
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
            <div className="border-b border-border/70 px-5 py-4">
              <p className="text-sm font-medium">Notifications</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose which emails you want to receive.
              </p>
            </div>
            <div className="flex items-center gap-4 border-b border-border/70 px-5 py-4 last:border-b-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconBellRinging className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Opportunity alerts</p>
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
            <div className="flex items-center gap-4 px-5 py-4 last:border-b-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconSparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Product updates</p>
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
            <div className="border-b border-border/70 px-5 py-4">
              <p className="text-sm font-medium">Billing</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage your plan and payment details.
              </p>
            </div>
            <div className="px-5 py-4">
              <Button variant="outline" size="sm" asChild>
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
      </Tabs>
    </div>
  )
}
