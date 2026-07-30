import { z } from "zod"

import type { Tables } from "@workspace/supabase/database-types"

export type SupportConversationRow = Tables<"support_conversations">
export type SupportMessageRow = Tables<"support_messages">

export const identifySchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(200).optional(),
})

export const utmSchema = z.object({
  source: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  campaign: z.string().max(200).optional(),
  term: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
})

export const contextSchema = z.object({
  path: z.string().max(2048),
  title: z.string().max(300).optional(),
  entryUrl: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  utm: utmSchema.optional(),
  locale: z.string().max(50).optional(),
  timezone: z.string().max(100).optional(),
  viewport: z.string().max(30).optional(),
})

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  context: contextSchema.optional(),
})

export const adminReplySchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export const adminPatchSchema = z.union([
  z.object({ status: z.enum(["open", "closed"]) }),
  z.object({ markRead: z.literal(true) }),
])

export type VisitorContextInput = z.infer<typeof contextSchema>

export type ConversationAccountSnapshot = {
  user_id: string
  email: string
  name: string | null
  tier: string
  active_trial: boolean
  onboarding_completed: boolean
  product_domain: string | null
}

export type ConversationMetadata = {
  entry_url?: string
  referrer?: string
  utm?: z.infer<typeof utmSchema>
  pages?: { path: string; title?: string; at: string }[]
  locale?: string
  timezone?: string
  viewport?: string
  user_agent?: string
  account?: ConversationAccountSnapshot | null
}
