"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { IconCircleCheck, IconCircleX, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

import { useProspectStore } from "@/stores/prospect-store"

interface OpportunityActionsProps {
  prospectId: string
  targetUrl: string
  originalUrl: string | null | undefined
}

export function OpportunityActions({
  prospectId,
}: OpportunityActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"contacted" | "dismissed" | null>(
    null
  )
  const updateProspectStatuses = useProspectStore(
    (state) => state.updateProspectStatuses
  )

  async function updateStatus(status: "contacted" | "dismissed") {
    setLoading(status)
    try {
      const res = await fetch(
        `/api/link-building/opportunities/${prospectId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )
      if (res.ok) {
        updateProspectStatuses([prospectId], status)
        router.push("/dashboard/link-building/opportunities")
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
            Actions
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            What do you want to do with this opportunity?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            disabled={loading !== null}
            onClick={() => updateStatus("dismissed")}
          >
            {loading === "dismissed" ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconCircleX className="size-4" />
            )}
            Dismiss
          </Button>

          <Button
            size="sm"
            className="gap-2"
            disabled={loading !== null}
            onClick={() => updateStatus("contacted")}
          >
            {loading === "contacted" ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconCircleCheck className="size-4" />
            )}
            Mark as contacted
          </Button>
        </div>
      </div>
    </div>
  )
}
