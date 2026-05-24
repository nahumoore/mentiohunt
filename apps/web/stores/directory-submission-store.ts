"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type DirectorySubmission = Tables<"directory_submissions">
type Directory = Tables<"directories">

export type DirectorySubmissionStatus =
  Database["public"]["Enums"]["directory_submission_status"]

import type { Database } from "@workspace/supabase/database-types"

export type SubmissionDirectory = Pick<
  Directory,
  | "id"
  | "name"
  | "domain"
  | "submit_url"
  | "category"
  | "is_free"
  | "is_active"
  | "domain_rating"
  | "backlinks"
  | "referring_domains"
  | "dofollow_backlinks"
  | "dofollow_referring_domains"
  | "seo_metrics_updated_at"
  | "submit_url_ok"
  | "submit_url_verified_at"
>

export type SubmissionListDirectory = Pick<
  SubmissionDirectory,
  | "is_free"
  | "domain_rating"
  | "backlinks"
  | "referring_domains"
  | "dofollow_backlinks"
  | "dofollow_referring_domains"
  | "seo_metrics_updated_at"
>

export type DirectorySubmissionListItem = Pick<
  DirectorySubmission,
  | "id"
  | "product_id"
  | "domain"
  | "submit_url"
  | "listing_url"
  | "status"
  | "discovered_at"
  | "submitted_at"
  | "last_checked_at"
  | "last_indexed_at"
> & {
  directory: SubmissionListDirectory | null
}

export type DirectorySubmissionDetail = Omit<DirectorySubmissionListItem, "directory"> &
  Pick<DirectorySubmission, "directory_id" | "notes" | "created_at"> & {
    directory: SubmissionDirectory | null
  }

type DirectorySubmissionStore = {
  hydrated: boolean
  submissions: DirectorySubmissionListItem[]
  submissionDetailsById: Record<string, DirectorySubmissionDetail>
  setSubmissions: (submissions: DirectorySubmissionListItem[]) => void
  updateSubmissionStatuses: (
    ids: string[],
    status: DirectorySubmission["status"],
    extra?: Partial<Pick<DirectorySubmission, "submitted_at">>
  ) => void
  upsertSubmissionDetail: (submission: DirectorySubmissionDetail) => void
  clearSubmissions: () => void
}

function toListItem(submission: DirectorySubmissionDetail): DirectorySubmissionListItem {
  return {
    id: submission.id,
    product_id: submission.product_id,
    domain: submission.domain,
    submit_url: submission.submit_url,
    listing_url: submission.listing_url,
    status: submission.status,
    discovered_at: submission.discovered_at,
    submitted_at: submission.submitted_at,
    last_checked_at: submission.last_checked_at,
    last_indexed_at: submission.last_indexed_at,
        directory: submission.directory
      ? {
          is_free: submission.directory.is_free,
          domain_rating: submission.directory.domain_rating,
          backlinks: submission.directory.backlinks,
          referring_domains: submission.directory.referring_domains,
          dofollow_backlinks: submission.directory.dofollow_backlinks,
          dofollow_referring_domains: submission.directory.dofollow_referring_domains,
          seo_metrics_updated_at: submission.directory.seo_metrics_updated_at,
        }
      : null,
  }
}

export const useDirectorySubmissionStore = create<DirectorySubmissionStore>()((set) => ({
  hydrated: false,
  submissions: [],
  submissionDetailsById: {},
  setSubmissions: (submissions) => set({ hydrated: true, submissions }),
  updateSubmissionStatuses: (ids, status, extra = {}) =>
    set((state) => {
      const idSet = new Set(ids)
      const submissionDetailsById = { ...state.submissionDetailsById }

      ids.forEach((id) => {
        const submission = submissionDetailsById[id]
        if (submission) {
          submissionDetailsById[id] = { ...submission, status, ...extra }
        }
      })

      return {
        submissions: state.submissions.map((s) =>
          idSet.has(s.id) ? { ...s, status, ...extra } : s
        ),
        submissionDetailsById,
      }
    }),
  upsertSubmissionDetail: (submission) =>
    set((state) => {
      const listItem = toListItem(submission)
      const exists = state.submissions.some((s) => s.id === submission.id)

      return {
        submissions: exists
          ? state.submissions.map((s) => (s.id === submission.id ? listItem : s))
          : [listItem, ...state.submissions],
        submissionDetailsById: {
          ...state.submissionDetailsById,
          [submission.id]: submission,
        },
      }
    }),
  clearSubmissions: () => set({ hydrated: false, submissions: [], submissionDetailsById: {} }),
}))
