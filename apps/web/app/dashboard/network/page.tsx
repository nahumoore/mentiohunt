"use client"

import {
  IconCheck,
  IconLoader2,
  IconMail,
  IconUsers,
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
    <div className="rounded-[2rem] border border-border/70 bg-white p-6 sm:p-8">
      <div className="max-w-2xl space-y-5">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            Meet founders already open to backlink collaboration.
          </h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Join the network to reserve your spot for direct, opt-in backlink exchanges when matching goes live.
          </p>
        </div>

        <div className="w-fit rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-blaze-orange/10 text-(--color-blaze-orange)">
              <IconUsers className="size-4" />
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-sm font-semibold text-foreground">84 users joined</span>
                <span className="text-sm font-semibold text-(--color-blaze-orange)">
                  26 in your niche
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Founders already interested in exchanging relevant backlinks.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={onJoin}
          className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
        >
          Join the backlink network
        </Button>
      </div>
    </div>
  )
}

function JoinedState({ email }: { email: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 right-0 h-56 w-56 rounded-full bg-princeton-orange/10 blur-[100px]" />
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,22rem)] lg:items-start">
        <div className="space-y-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-bold text-emerald-700 uppercase">
            <IconCheck className="size-3.5" />
            You&apos;re in the network waitlist
          </span>

          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
              Your spot is saved for launch.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              When the backlink network opens, other opted-in founders will be
              able to contact you at <span className="font-medium text-foreground">{email}</span>
              {" "}for relevant collaboration opportunities. We&apos;ll send you a heads-up as soon as matching starts.
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold text-foreground">What happens next</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconCheck className="size-3" />
              </span>
              We keep your waitlist spot active.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconCheck className="size-3" />
              </span>
              We notify you when niche-based exchanges open.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-(--color-blaze-orange)">
                <IconCheck className="size-3" />
              </span>
              You decide which collaboration requests to respond to.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
