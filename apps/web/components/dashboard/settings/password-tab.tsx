"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { SettingsSaveFooter } from "@/components/link-building/sources/settings-save-footer"
import { supabaseClient } from "@/lib/supabase/client"
import { useProfileStore } from "@/stores/profile-store"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function PasswordTab() {
  const email = useProfileStore((state) => state.profile?.email)

  // null = still checking; true = account already has a password (email/password
  // identity); false = OAuth-only account (e.g. Google), no password set yet.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = supabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const identities = data.user?.identities ?? []
      setHasPassword(identities.some((identity) => identity.provider === "email"))
    })
  }, [])

  const hasUnsavedChanges = Boolean(
    (hasPassword ? currentPassword : true) && newPassword && confirmPassword
  )

  function resetFields() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  function fail(text: string) {
    setMessage(text)
    toast.error(text)
  }

  function handleSave() {
    setMessage(null)

    if (!email) {
      fail("Not authenticated.")
      return
    }
    if ((hasPassword && !currentPassword) || !newPassword || !confirmPassword) {
      fail("Fill in the required fields.")
      return
    }
    if (newPassword.length < 8) {
      fail("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      fail("New password and confirmation don't match.")
      return
    }
    if (hasPassword && newPassword === currentPassword) {
      fail("New password must be different from your current password.")
      return
    }

    startTransition(async () => {
      const supabase = supabaseClient()

      if (hasPassword) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        })

        if (verifyError) {
          fail("Current password is incorrect.")
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        fail(updateError.message)
        return
      }

      resetFields()
      setHasPassword(true)
      const successMessage = hasPassword
        ? "Password updated."
        : "Password set. You can now also sign in with email and password."
      setMessage(successMessage)
      toast.success(successMessage)
    })
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Password</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {hasPassword === false
            ? "You signed in with Google, so there's no password on this account yet. Set one below if you'd rather sign in with email and password, or to share access with a colleague."
            : "Change the password used to sign in. Sharing account access with a colleague? Give them the new password directly — Mentiohunt doesn’t support separate team logins yet."}
        </p>
      </div>
      <div className="space-y-4 px-5 py-4">
        {hasPassword !== false && (
          <div className="space-y-2">
            <Label htmlFor="settings-current-password">Current password</Label>
            <Input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Your current password"
              autoComplete="current-password"
              disabled={hasPassword === null}
              className="max-w-sm"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="settings-new-password">
            {hasPassword === false ? "Password" : "New password"}
          </Label>
          <Input
            id="settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={hasPassword === null}
            className="max-w-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-confirm-password">
            {hasPassword === false ? "Confirm password" : "Confirm new password"}
          </Label>
          <Input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            disabled={hasPassword === null}
            className="max-w-sm"
          />
        </div>
      </div>
      <SettingsSaveFooter
        message={message}
        helper="Use at least 8 characters."
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        saveLabel={hasPassword === false ? "Set password" : "Update password"}
      />
    </div>
  )
}
