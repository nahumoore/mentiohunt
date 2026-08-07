"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconChevronDown, IconCheck, IconMailForward, IconArrowUp, IconSparkles, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Input } from "@workspace/ui/components/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@workspace/ui/components/popover"

type OwnEmailAccount = { id: string; email: string; name: string }

export function ReplyComposer({
  prospectId,
  contactEmail,
  emailAccounts,
}: {
  prospectId: string
  contactEmail: string | null
  emailAccounts: OwnEmailAccount[]
}) {
  const router = useRouter()
  const [draft, setDraft] = useState("")
  const [emailAccountId, setEmailAccountId] = useState(emailAccounts[0]?.id ?? "")
  const [sendState, setSendState] = useState<"idle" | "sending" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const activeAccount = emailAccounts.find((a) => a.id === emailAccountId) ?? emailAccounts[0]

  async function handleSend() {
    if (!draft.trim() || !emailAccountId || sendState === "sending") return
    setSendState("sending")
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/link-building/opportunities/${prospectId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim(), emailAccountId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSendState("error")
        setErrorMessage(data?.error ?? "Failed to send reply.")
        return
      }
      setDraft("")
      setSendState("idle")
      router.refresh()
    } catch {
      setSendState("error")
      setErrorMessage("Failed to send reply.")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleGenerateDraft() {
    if (!instructions.trim() || drafting) return
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch(`/api/link-building/opportunities/${prospectId}/reply/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: instructions.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDraftError(data?.error ?? "Failed to generate draft.")
        return
      }
      setDraft(data.draft ?? "")
      setInstructions("")
      setAiOpen(false)
    } catch {
      setDraftError("Failed to generate draft.")
    } finally {
      setDrafting(false)
    }
  }

  function handleInstructionsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleGenerateDraft()
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header: recipient + sending account */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <IconMailForward className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="shrink-0">Reply to</span>
          <span className="truncate font-medium text-foreground">{contactEmail ?? "prospect"}</span>
        </div>

        {emailAccounts.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span className="max-w-36 truncate">{activeAccount?.email}</span>
                <IconChevronDown className="size-3 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {emailAccounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => setEmailAccountId(account.id)}
                  className="justify-between gap-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{account.email}</span>
                    {account.name && (
                      <span className="block truncate text-xs text-muted-foreground">{account.name}</span>
                    )}
                  </span>
                  {account.id === emailAccountId && <IconCheck className="size-3.5 shrink-0 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          activeAccount && (
            <span className="shrink-0 truncate text-[11px] text-muted-foreground/70">
              from {activeAccount.email}
            </span>
          )
        )}
      </div>

      {/* Compose area */}
      <div className="relative p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your reply…"
          rows={5}
          className="min-h-32 max-h-64 resize-none pb-11 text-sm leading-relaxed"
        />

        <div className="absolute bottom-6 left-6">
          <Popover open={aiOpen} onOpenChange={setAiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                aria-label="Draft reply with AI"
              >
                <IconSparkles className="size-3.5" />
                AI Help
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-medium text-foreground">What do you want to say?</p>
                <Input
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  onKeyDown={handleInstructionsKeyDown}
                  placeholder="e.g. tell them yes, ask when they can publish"
                  autoFocus
                  disabled={drafting}
                />
                {draftError && <p className="text-[11px] text-destructive">{draftError}</p>}
                <Button
                  type="button"
                  size="sm"
                  disabled={!instructions.trim() || drafting}
                  onClick={handleGenerateDraft}
                  className="gap-1.5 self-end"
                >
                  {drafting ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSparkles className="size-3.5" />}
                  {drafting ? "Drafting…" : "Generate"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="button"
          size="icon"
          className="absolute bottom-6 right-6 rounded-full"
          disabled={!draft.trim() || !emailAccountId || sendState === "sending"}
          onClick={handleSend}
          aria-label="Send reply"
        >
          <IconArrowUp />
        </Button>
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5">
        {errorMessage ? (
          <span className="text-[11px] text-destructive">{errorMessage}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground/50">⌘/Ctrl + Enter to send</span>
        )}
        {sendState === "sending" && (
          <span className="text-[11px] text-muted-foreground">Sending…</span>
        )}
      </div>
    </div>
  )
}
