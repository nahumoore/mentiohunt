"use client"

import {
  IconCheck,
  IconLoader2,
  IconMail,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useState } from "react"

import { useBacklinkNetworkStore } from "@/stores/backlink-network-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProductStore } from "@/stores/product-store"

export default function BacklinkNetworkPage() {
  const membership = useBacklinkNetworkStore((state) => state.membership)
  const setMembership = useBacklinkNetworkStore((state) => state.setMembership)
  const profile = useProfileStore((state) => state.profile)
  const product = useProductStore((state) => state.product)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isJoined = membership?.isEnabled === true

  function openDialog() {
    setEmail(membership?.contactEmail || profile?.email || "")
    setAgreed(false)
    setError(null)
    setDialogOpen(true)
  }

  async function handleJoin() {
    if (isSaving || !agreed) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/link-building/backlink-network", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: true, contactEmail: email }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        membership?: { isEnabled: boolean; contactEmail: string; updatedAt: string | null }
      } | null

      if (!response.ok || !payload?.membership) {
        throw new Error(payload?.error ?? "Failed to join the network.")
      }

      setMembership(payload.membership)
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isJoined ? (
        <JoinedState email={membership.contactEmail} />
      ) : (
        <NotJoinedState onJoin={openDialog} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>Join the Backlink Network</DialogTitle>
          <DialogDescription className="mt-1">
            Share the email other founders can use to reach you for backlink
            collaboration.
          </DialogDescription>

          <div className="mt-5 flex flex-col gap-4">
            {product && (
              <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 opacity-60">
                {product.website_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(product.website_url)}&sz=32`}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 rounded-sm"
                  />
                )}
                <span className="text-sm font-medium text-foreground">
                  {product.product_name}
                </span>
              </div>
            )}

            <div className="relative">
              <IconMail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-9"
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-visible"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="agree-visible"
                className="cursor-pointer text-sm leading-5 text-muted-foreground"
              >
                I understand this email will be visible to other opted-in
                founders in the network.
              </Label>
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleJoin()}
                disabled={isSaving || !agreed || !email.trim()}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {isSaving ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : null}
                Join the network
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotJoinedState({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="max-w-lg">
      <div className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">How it works</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Opt in with your email. When the network opens, opted-in founders
            can reach each other directly for backlink collaboration — no
            middleman, no automated spam.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50 translate-y-1.5" />
            Manual opt-in only — you choose when to join.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50 translate-y-1.5" />
            One contact email shared with other founders.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50 translate-y-1.5" />
            Network is not live yet — we notify you at launch.
          </li>
        </ul>
        <div>
          <Button
            type="button"
            onClick={onJoin}
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            Reserve my spot
          </Button>
        </div>
      </div>
    </div>
  )
}

function JoinedState({ email }: { email: string }) {
  return (
    <div className="max-w-lg">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-(--color-blaze-orange)">
            <IconCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">You're on the list</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The network isn't live yet. When it opens, founders can reach you at{" "}
          <span className="font-medium text-foreground">{email}</span>.
          We'll send you a notification as soon as it launches.
        </p>
      </div>
    </div>
  )
}
