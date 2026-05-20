"use client"

import { captureEvent } from "@/lib/analytics"
import {
  IconBell,
  IconCheck,
  IconHash,
  IconMessage2Share,
  IconMicrophone,
  IconPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useState } from "react"

import {
  PLATFORM_CONFIG,
  PLATFORM_KEYS,
  type MentionPlatform,
} from "@/consts/platform-config"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonitoringConfig {
  platforms: MentionPlatform[]
  communities: MonitoringCommunity[]
  keywords: string[]
  customVoiceEnabled: boolean
  customVoiceInstructions: string
  emailAlertsEnabled: boolean
}

interface MonitoringCommunity {
  platform: "reddit"
  community: string
}

const DEFAULT_CONFIG: MonitoringConfig = {
  platforms: ["reddit", "bluesky"],
  communities: [
    { platform: "reddit", community: "SaaS" },
    { platform: "reddit", community: "SEO" },
    { platform: "reddit", community: "Entrepreneur" },
  ],
  keywords: ["link building tool", "backlink prospecting", "mentiohunt"],
  customVoiceEnabled: false,
  customVoiceInstructions: "",
  emailAlertsEnabled: true,
}

function normalizeCommunityName(value: string) {
  return value.trim().replace(/^\/?r\//i, "").replace(/^\/+/, "").trim()
}

function communityKey(community: MonitoringCommunity) {
  return `${community.platform}:${community.community.toLowerCase()}`
}

function communityLabel(community: MonitoringCommunity) {
  return `r/${community.community}`
}

// ─── Save footer ──────────────────────────────────────────────────────────────

function SaveFooter({
  helper,
  message,
  isSaving,
  isDisabled = false,
  hasUnsavedChanges,
  onSave,
}: {
  helper: string
  message: string | null
  isSaving: boolean
  isDisabled?: boolean
  hasUnsavedChanges: boolean
  onSave: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p
        className={cn(
          "text-xs leading-5 text-muted-foreground",
          message?.toLowerCase().includes("saved") && "text-foreground"
        )}
      >
        {message ?? helper}
      </p>
      <Button
        type="button"
        onClick={onSave}
        disabled={isSaving || isDisabled}
        className={cn(
          "rounded-full px-5",
          hasUnsavedChanges
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-foreground/80 text-background hover:bg-foreground/90"
        )}
      >
        {hasUnsavedChanges && (
          <span className="size-1.5 rounded-full bg-orange" />
        )}
        {isSaving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  )
}

// ─── Platforms tab ────────────────────────────────────────────────────────────

function PlatformsTab({
  platforms,
  onToggle,
  footer,
}: {
  platforms: Set<MentionPlatform>
  onToggle: (p: MentionPlatform) => void
  footer: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Platforms</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose which platforms to scan for community mentions.
        </p>
      </div>
      {PLATFORM_KEYS.map((key) => {
        const cfg = PLATFORM_CONFIG[key]
        const Icon = cfg.icon
        const isActive = platforms.has(key)
        return (
          <div
            key={key}
            onClick={() => onToggle(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onToggle(key)
            }}
            role="switch"
            aria-checked={isActive}
            tabIndex={0}
            className={cn(
              "group flex cursor-pointer items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset hover:bg-muted/30",
              !isActive && "opacity-50 grayscale hover:opacity-80"
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                cfg.color
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-medium">{cfg.label}</p>
                {!isActive && (
                  <span className="text-xs text-muted-foreground">Paused</span>
                )}
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {cfg.description}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={() => onToggle(key)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0"
              tabIndex={-1}
            />
          </div>
        )
      })}
      {footer}
    </div>
  )
}

// ─── Communities tab ──────────────────────────────────────────────────────────

function CommunitiesTab({
  communities,
  redditActive,
  onAdd,
  onRemove,
  footer,
}: {
  communities: MonitoringCommunity[]
  redditActive: boolean
  onAdd: (c: MonitoringCommunity) => void
  onRemove: (c: MonitoringCommunity) => void
  footer: React.ReactNode
}) {
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const RedditIcon = PLATFORM_CONFIG.reddit.icon

  function handleAdd() {
    const raw = input.trim()
    if (!raw) return

    const normalized = normalizeCommunityName(raw)

    if (!normalized) return

    if (
      communities.some(
        (community) =>
          community.platform === "reddit" &&
          community.community.toLowerCase() === normalized.toLowerCase()
      )
    ) {
      setError("Already added.")
      return
    }

    onAdd({ platform: "reddit", community: normalized })
    setInput("")
    setError(null)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Subreddits</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add subreddits to scan alongside global Reddit search. Only applies
          when Reddit is active.
        </p>
      </div>

      {!redditActive && (
        <div className="border-b border-border/70 bg-muted/30 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Reddit is currently paused. Enable it in the Platforms tab to use
            community scoping.
          </p>
        </div>
      )}

      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              r/
            </span>
            <Input
              value={input.replace(/^r\//, "")}
              onChange={(e) => {
                setInput(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="SaaS"
              disabled={!redditActive}
              className="pl-7"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!redditActive || !input.trim()}
            variant="outline"
            className="shrink-0"
          >
            <IconPlus className="size-4" />
            Add
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {communities.length}/15 communities
        </p>
      </div>

      {communities.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm text-muted-foreground">
            No communities added yet. Search results will cover all of Reddit.
          </p>
        </div>
      ) : (
        communities.map((community) => (
          <div
            key={communityKey(community)}
            className="flex items-center gap-3 border-b border-border/70 px-5 py-3.5 last:border-b-0"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <RedditIcon className="size-3.5 text-orange-600" />
            </div>
            <p className="flex-1 text-sm font-medium">
              {communityLabel(community)}
            </p>
            <button
              type="button"
              onClick={() => onRemove(community)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${communityLabel(community)}`}
            >
              <IconX className="size-3.5" />
            </button>
          </div>
        ))
      )}

      {footer}
    </div>
  )
}

// ─── Keywords tab ─────────────────────────────────────────────────────────────

function KeywordsTab({
  keywords,
  onAdd,
  onRemove,
  footer,
}: {
  keywords: string[]
  onAdd: (k: string) => void
  onRemove: (k: string) => void
  footer: React.ReactNode
}) {
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    const kw = input.trim()
    if (!kw) return
    if (keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) {
      setError("Already added.")
      return
    }
    if (keywords.length >= 10) {
      setError("Maximum 10 keywords.")
      return
    }
    onAdd(kw)
    setInput("")
    setError(null)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Keywords</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Phrases used to search across all active platforms. Broader keywords
          find more posts; narrower ones find better-fit posts.
        </p>
      </div>

      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. link building tool"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!input.trim() || keywords.length >= 10}
            variant="outline"
            className="shrink-0"
          >
            <IconPlus className="size-4" />
            Add
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {keywords.length}/10 keywords
        </p>
      </div>

      {keywords.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm text-muted-foreground">
            No keywords added. Add at least one to start finding mentions.
          </p>
        </div>
      ) : (
        keywords.map((kw) => (
          <div
            key={kw}
            className="flex items-center gap-3 border-b border-border/70 px-5 py-3.5 last:border-b-0"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <IconHash className="size-3.5 text-primary" />
            </div>
            <p className="flex-1 text-sm">{kw}</p>
            <button
              type="button"
              onClick={() => onRemove(kw)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Remove keyword ${kw}`}
            >
              <IconX className="size-3.5" />
            </button>
          </div>
        ))
      )}

      {footer}
    </div>
  )
}

// ─── Voice tab ────────────────────────────────────────────────────────────────

function VoiceTab({
  enabled,
  instructions,
  onToggle,
  onInstructionsChange,
  footer,
}: {
  enabled: boolean
  instructions: string
  onToggle: () => void
  onInstructionsChange: (v: string) => void
  footer: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="flex items-center gap-4 border-b border-border/70 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
          <IconMicrophone className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Custom reply voice</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Add instructions so generated replies match your tone — casual,
            technical, concise, etc.
          </p>
        </div>
      </div>

      <div className="border-b border-border/70 px-5 py-5">
        <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Use custom voice instructions</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              When enabled, these notes are added to every generated reply draft
              so suggestions sound closer to your preferred tone and wording.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="mt-0.5 shrink-0"
          />
        </div>
      </div>

      {enabled && (
        <div className="border-b border-border/70 px-5 py-5">
          <label
            htmlFor="voice-instructions"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Voice instructions
          </label>
          <textarea
            id="voice-instructions"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            rows={5}
            placeholder={`e.g. Keep replies short and direct. Don't use filler phrases. Sound like a founder who uses the product daily.`}
            className="w-full resize-none rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            These instructions are appended to the system prompt used to
            generate each reply draft.
          </p>
        </div>
      )}

      {footer}
    </div>
  )
}

// ─── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTab({
  emailAlertsEnabled,
  onToggleEmail,
  footer,
}: {
  emailAlertsEnabled: boolean
  onToggleEmail: () => void
  footer: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Notifications</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Control how Mentiohunt alerts you when new matches are found.
        </p>
      </div>

      <div
        onClick={onToggleEmail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggleEmail()
        }}
        role="switch"
        aria-checked={emailAlertsEnabled}
        tabIndex={0}
        className="flex cursor-pointer items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <IconBell className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Email digest</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Get an email each time a run finds new community mentions worth
            replying to.
          </p>
        </div>
        <Switch
          checked={emailAlertsEnabled}
          onCheckedChange={onToggleEmail}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
          tabIndex={-1}
        />
      </div>

      <div className="flex items-start gap-3 px-5 py-4">
        <IconCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">
          Monitoring runs once every ~20 hours. You&apos;ll only receive an
          email when new matches are found — no empty digests.
        </p>
      </div>

      {footer}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityDiscoverySetupPage() {
  const [config, setConfig] = useState<MonitoringConfig>(DEFAULT_CONFIG)
  const [lastSaved, setLastSaved] = useState<MonitoringConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      try {
        const response = await fetch("/api/community-mentions/discovery-setup")
        const payload = (await response.json().catch(() => null)) as {
          config?: MonitoringConfig | null
          error?: string
        } | null

        if (cancelled) return

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load settings.")
        }

        const nextConfig = payload?.config ?? DEFAULT_CONFIG
        setConfig(nextConfig)
        setLastSaved(nextConfig)
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load community settings."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  const hasUnsavedChanges =
    JSON.stringify(config) !== JSON.stringify(lastSaved)

  const activePlatforms = new Set(config.platforms)

  function updateConfig(patch: Partial<MonitoringConfig>) {
    setMessage(null)
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  function togglePlatform(p: MentionPlatform) {
    const next = activePlatforms.has(p)
      ? config.platforms.filter((x) => x !== p)
      : [...config.platforms, p]

    if (next.length === 0) {
      setMessage("Keep at least one platform active.")
      return
    }
    updateConfig({ platforms: next })
  }

  function addCommunity(c: MonitoringCommunity) {
    if (config.communities.length >= 15) return
    updateConfig({ communities: [...config.communities, c] })
  }

  function removeCommunity(c: MonitoringCommunity) {
    updateConfig({
      communities: config.communities.filter(
        (community) => communityKey(community) !== communityKey(c)
      ),
    })
  }

  function addKeyword(k: string) {
    updateConfig({ keywords: [...config.keywords, k] })
  }

  function removeKeyword(k: string) {
    updateConfig({ keywords: config.keywords.filter((x) => x !== k) })
  }

  async function save() {
    if (isSaving) return
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/community-mentions/discovery-setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const payload = (await response.json().catch(() => null)) as {
        config?: MonitoringConfig
        error?: string
      } | null

      if (!response.ok || !payload?.config) {
        throw new Error(payload?.error ?? "Failed to save settings.")
      }

      setConfig(payload.config)
      setLastSaved(payload.config)
      captureEvent("community_watchlist_saved", {
        platforms_count: payload.config.platforms.length,
        keywords_count: payload.config.keywords.length,
        communities_count: payload.config.communities.length,
      })
      setMessage("Settings saved.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save settings."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const footer = (helper: string) => (
    <SaveFooter
      helper={helper}
      message={message}
      isSaving={isSaving}
      isDisabled={isLoading}
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={save}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Watchlist
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Configure which platforms and keywords feed your community reply
              queue. Start broad, then tighten keywords to improve match
              quality.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="platforms" className="gap-4">
        <TabsList>
          <TabsTrigger value="platforms">
            <IconMessage2Share className="size-4" />
            <span>Platforms</span>
          </TabsTrigger>
          <TabsTrigger value="communities">
            <IconUsers className="size-4" />
            <span>Communities</span>
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <IconHash className="size-4" />
            <span>Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="voice">
            <IconMicrophone className="size-4" />
            <span>Voice</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBell className="size-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms">
          <PlatformsTab
            platforms={activePlatforms}
            onToggle={togglePlatform}
            footer={footer("Changes apply to the next monitoring run.")}
          />
        </TabsContent>

        <TabsContent value="communities">
          <CommunitiesTab
            communities={config.communities}
            redditActive={activePlatforms.has("reddit")}
            onAdd={addCommunity}
            onRemove={removeCommunity}
            footer={footer(
              "Communities are scanned in addition to global Reddit search."
            )}
          />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordsTab
            keywords={config.keywords}
            onAdd={addKeyword}
            onRemove={removeKeyword}
            footer={footer("Keywords apply to all active platforms.")}
          />
        </TabsContent>

        <TabsContent value="voice">
          <VoiceTab
            enabled={config.customVoiceEnabled}
            instructions={config.customVoiceInstructions}
            onToggle={() =>
              updateConfig({ customVoiceEnabled: !config.customVoiceEnabled })
            }
            onInstructionsChange={(v) =>
              updateConfig({ customVoiceInstructions: v })
            }
            footer={footer("Voice instructions apply to all future reply drafts.")}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            emailAlertsEnabled={config.emailAlertsEnabled}
            onToggleEmail={() =>
              updateConfig({ emailAlertsEnabled: !config.emailAlertsEnabled })
            }
            footer={footer("Notification preferences saved immediately.")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
