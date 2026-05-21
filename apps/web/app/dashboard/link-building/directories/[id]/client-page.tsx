"use client"

import { IconArrowLeft, IconExternalLink, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { CheckListingButton } from "@/components/directories/check-listing-button"
import { DirectoryInfoCard } from "@/components/directories/directory-info-card"
import { ReportDialog } from "@/components/directories/report-dialog"
import { StatusCallout } from "@/components/directories/status-callout"
import { SubmissionCostBadge } from "@/components/directories/submission-cost-badge"
import { SubmitAssistSheet } from "@/components/directories/submit-assist-sheet"
import { TimelineCard } from "@/components/directories/timeline-card"
import { captureEvent } from "@/lib/analytics"
import { supabaseClient } from "@/lib/supabase/client"
import {
  useDirectorySubmissionStore,
  type DirectorySubmissionDetail,
  type DirectorySubmissionStatus,
} from "@/stores/directory-submission-store"
import { STATUS_CONFIG, daysSince } from "../_data"

type Product = { productName: string | null; websiteUrl: string | null; productDescription: string | null }

export function DirectoryDetailClientPage({
  submission: initialSubmission,
  product,
}: {
  submission: DirectorySubmissionDetail
  product: Product
}) {
  const router = useRouter()
  const upsertSubmissionDetail = useDirectorySubmissionStore((s) => s.upsertSubmissionDetail)
  const updateSubmissionStatuses = useDirectorySubmissionStore((s) => s.updateSubmissionStatuses)
  const stored = useDirectorySubmissionStore((s) => s.submissionDetailsById[initialSubmission.id])
  const submission = stored ?? initialSubmission

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [assistOpen, setAssistOpen] = useState(false)

  useEffect(() => {
    upsertSubmissionDetail(initialSubmission)
    captureEvent("directory_detail_viewed", {
      submission_id: initialSubmission.id,
      domain: initialSubmission.domain,
      status: initialSubmission.status,
      is_free: initialSubmission.directory?.is_free ?? null,
      domain_rating: initialSubmission.directory?.domain_rating ?? null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubmission.id])

  async function updateStatus(
    status: DirectorySubmissionStatus,
    extra: { submitted_at?: string } = {}
  ) {
    if (isUpdating) return
    setIsUpdating(true)
    setUpdateError(null)

    const fromStatus = submission.status
    const supabase = supabaseClient()

    try {
      const { error } = await supabase
        .from("directory_submissions")
        .update({ status, ...extra })
        .eq("id", submission.id)

      if (error) {
        setUpdateError(error.message)
        return
      }

      captureEvent("directory_status_updated", {
        submission_id: submission.id,
        domain: submission.domain,
        from_status: fromStatus,
        new_status: status,
      })

      updateSubmissionStatuses(
        [submission.id],
        status,
        extra.submitted_at ? { submitted_at: extra.submitted_at } : undefined
      )
      router.refresh()
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Could not update.")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleAssistSubmit() {
    await updateStatus("submitted", { submitted_at: new Date().toISOString() })
    captureEvent("directory_marked_submitted", {
      submission_id: submission.id,
      domain: submission.domain,
    })
    setAssistOpen(false)
  }

  const daysSinceSubmit = daysSince(submission.submitted_at)
  const isSubmitted = submission.status === "submitted"
  const isIndexed = submission.status === "indexed"
  const isNotIndexed = submission.status === "not_indexed"
  const isDismissed = submission.status === "dismissed"
  const directoryName = submission.directory?.name ?? submission.domain
  const statusCfg = STATUS_CONFIG[submission.status]
  const StatusIcon = statusCfg.icon

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/link-building/directories">
            <IconArrowLeft className="size-3.5" />
            Back to directories
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${submission.domain}&sz=32`}
              alt=""
              className="size-7 shrink-0 rounded"
            />
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {directoryName}
            </h1>
            <SubmissionCostBadge isFree={submission.directory?.is_free} size="md" />
            <a
              href={`https://${submission.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 shrink-0 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              title={`Open ${submission.domain}`}
              onClick={() =>
                captureEvent("directory_external_link_clicked", {
                  submission_id: submission.id,
                  domain: submission.domain,
                })
              }
            >
              <IconExternalLink className="size-4" />
            </a>
          </div>
          <p className="pl-10 text-sm text-muted-foreground">{submission.domain}</p>
        </div>

        {/* Status display */}
        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              statusCfg.color
            )}
          >
            <StatusIcon className="size-4" />
            {statusCfg.label}
          </span>
          <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground sm:text-right">
            {statusCfg.description}
          </p>
        </div>
      </div>

      <StatusCallout
        status={submission.status}
        listingUrl={submission.listing_url}
        daysSinceSubmit={daysSinceSubmit}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DirectoryInfoCard directory={submission.directory} />
        <TimelineCard
          discoveredAt={submission.discovered_at}
          submittedAt={submission.submitted_at}
          lastIndexedAt={submission.last_indexed_at}
          lastCheckedAt={submission.last_checked_at}
          listingUrl={submission.listing_url}
        />
      </div>

      {updateError && <p className="text-sm text-destructive">{updateError}</p>}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <ReportDialog directoryDomain={submission.domain} />

        <div className="flex flex-wrap items-center gap-2">
          <CheckListingButton
            directoryDomain={submission.domain}
            productName={product.productName}
            websiteUrl={product.websiteUrl}
            onClick={() =>
              captureEvent("directory_check_listing_clicked", {
                submission_id: submission.id,
                domain: submission.domain,
              })
            }
          />

          {!isSubmitted && !isIndexed && !isDismissed && (
            <SubmitAssistSheet
              open={assistOpen}
              onOpenChange={(v) => {
                setAssistOpen(v)
                if (v) {
                  captureEvent("directory_submit_assist_opened", {
                    submission_id: submission.id,
                    domain: submission.domain,
                  })
                }
              }}
              directoryName={directoryName}
              submitUrl={submission.submit_url ?? submission.directory?.submit_url}
              productName={product.productName}
              websiteUrl={product.websiteUrl}
              productDescription={product.productDescription}
              isUpdating={isUpdating}
              onMarkSubmitted={() => void handleAssistSubmit()}
              trigger={
                <Button size="sm" disabled={isUpdating}>
                  Submit to directory
                </Button>
              }
            />
          )}

          {(isSubmitted || isNotIndexed) && (
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => {
                captureEvent("directory_undo_submission", {
                  submission_id: submission.id,
                  domain: submission.domain,
                })
                void updateStatus("not_submitted")
              }}
            >
              {isUpdating && <IconLoader2 className="size-4 animate-spin" />}
              Undo submission
            </Button>
          )}

          {!isDismissed && !isIndexed && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              disabled={isUpdating}
              onClick={() => {
                captureEvent("directory_dismissed", {
                  submission_id: submission.id,
                  domain: submission.domain,
                })
                void updateStatus("dismissed")
              }}
            >
              Dismiss
            </Button>
          )}

          {isDismissed && (
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => {
                captureEvent("directory_restored", {
                  submission_id: submission.id,
                  domain: submission.domain,
                })
                void updateStatus("not_submitted")
              }}
            >
              Restore
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
