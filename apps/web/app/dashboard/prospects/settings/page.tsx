"use client"

import { IconChartBar, IconLayoutGrid, IconMail, IconUsers } from "@tabler/icons-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useEffect, useMemo, useState } from "react"

import { BacklinkTypesSection } from "@/components/link-building/sources/backlink-types-section"
import { CompetitorsSection } from "@/components/link-building/sources/competitors-section"
import {
  DrMaxWarningDialog,
  hasDrMaxWarningSeen,
  markDrMaxWarningSeen,
} from "@/components/link-building/sources/dr-max-warning-dialog"
import { OutreachSettingsSection } from "@/components/link-building/sources/outreach-settings-section"
import { SeoMetricsSection } from "@/components/link-building/sources/seo-metrics-section"
import { SettingsSaveFooter } from "@/components/link-building/sources/settings-save-footer"
import { UnsavedChangesDialog } from "@/components/link-building/sources/unsaved-changes-dialog"
import type { OpportunityType } from "@/lib/opportunity-types"
import { TYPE_CONFIG } from "@/lib/opportunity-types"
import { captureEvent } from "@/lib/analytics"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import type { OutreachSettings } from "@/stores/outreach-settings-store"
import { useOutreachSettingsStore } from "@/stores/outreach-settings-store"
import { useProductStore } from "@/stores/product-store"

const OPPORTUNITY_TYPES = Object.keys(TYPE_CONFIG) as OpportunityType[]

const DEFAULT_DISCOVERY_SETTINGS: DiscoverySettings = {
  opportunityTypes: OPPORTUNITY_TYPES,
  drMin: 0,
  drMax: null,
}

const DEFAULT_OUTREACH_SETTINGS: OutreachSettings = {
  voiceTone: `Write in a casual, direct founder-to-founder tone. Keep it short — 3 to 4 sentences max. No corporate language, no buzzwords. Imagine tapping a fellow builder on the shoulder, not sending a formal pitch to a procurement team. Be genuine, not salesy.`,
  offering: `To make it worth their time, mention we're open to one of the following:\n- A genuine Trustpilot or G2 review of their product\n- A written testimonial they can use on their website or landing page\n- A content collaboration or guest post swap\n- A shoutout on our social channels or newsletter`,
}

export default function DiscoverySetupPage() {
  const product = useProductStore((state) => state.product)
  const settings = useDiscoverySettingsStore((state) => state.settings)
  const setSettings = useDiscoverySettingsStore((state) => state.setSettings)
  const updateSettings = useDiscoverySettingsStore(
    (state) => state.updateSettings
  )
  const outreachSettings = useOutreachSettingsStore((state) => state.settings)
  const setOutreachSettings = useOutreachSettingsStore(
    (state) => state.setSettings
  )
  const updateOutreachSettings = useOutreachSettingsStore(
    (state) => state.updateSettings
  )

  const [isSavingDiscoverySettings, setIsSavingDiscoverySettings] =
    useState(false)
  const [discoverySettingsMessage, setDiscoverySettingsMessage] = useState<
    string | null
  >(null)
  const [isSavingOutreachSettings, setIsSavingOutreachSettings] =
    useState(false)
  const [outreachSettingsMessage, setOutreachSettingsMessage] = useState<
    string | null
  >(null)

  const [lastSaved, setLastSaved] = useState<DiscoverySettings | null>(settings)
  const [lastSavedOutreach, setLastSavedOutreach] =
    useState<OutreachSettings | null>(outreachSettings)
  const [pendingNavFn, setPendingNavFn] = useState<(() => void) | null>(null)
  const [pendingDrMax, setPendingDrMax] = useState<number | null | undefined>(
    undefined
  )
  const drMaxWarningOpen = pendingDrMax !== undefined

  const discoverySettings = settings ?? DEFAULT_DISCOVERY_SETTINGS
  const activeOutreach = outreachSettings ?? DEFAULT_OUTREACH_SETTINGS
  const activeTypes = new Set(discoverySettings.opportunityTypes)
  const competitors = product?.competitors ?? []

  const hasUnsavedDiscoveryChanges = useMemo(() => {
    const baseline = lastSaved ?? DEFAULT_DISCOVERY_SETTINGS
    return JSON.stringify(discoverySettings) !== JSON.stringify(baseline)
  }, [discoverySettings, lastSaved])

  const hasUnsavedOutreachChanges = useMemo(() => {
    const baseline = lastSavedOutreach ?? DEFAULT_OUTREACH_SETTINGS
    return JSON.stringify(activeOutreach) !== JSON.stringify(baseline)
  }, [activeOutreach, lastSavedOutreach])

  const hasUnsavedChanges = hasUnsavedDiscoveryChanges || hasUnsavedOutreachChanges

  // Block browser close / refresh
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  // Block client-side navigation (Link/router.push + browser back/forward)
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const originalPushState = history.pushState.bind(history)
    const currentHref = window.location.href

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      setTimeout(() => {
        setPendingNavFn(() => () => {
          history.pushState = originalPushState
          originalPushState(...args)
        })
      }, 0)
    }

    const handlePopState = () => {
      // URL already changed — restore current page URL, then prompt
      history.pushState(null, "", currentHref)
      setTimeout(() => {
        setPendingNavFn(() => () => {
          window.removeEventListener("popstate", handlePopState)
          history.go(-1)
        })
      }, 0)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      history.pushState = originalPushState
      window.removeEventListener("popstate", handlePopState)
    }
  }, [hasUnsavedChanges])

  function updateDiscoverySettings(settingsPatch: Partial<DiscoverySettings>) {
    setDiscoverySettingsMessage(null)

    if (settings) {
      updateSettings(settingsPatch)
      return
    }

    setSettings({ ...DEFAULT_DISCOVERY_SETTINGS, ...settingsPatch })
  }

  function handleOutreachUpdate(patch: Partial<OutreachSettings>) {
    setOutreachSettingsMessage(null)

    if (outreachSettings) {
      updateOutreachSettings(patch)
      return
    }

    setOutreachSettings({ ...DEFAULT_OUTREACH_SETTINGS, ...patch })
  }

  async function saveOutreachSettings() {
    if (isSavingOutreachSettings) return

    setIsSavingOutreachSettings(true)
    setOutreachSettingsMessage(null)

    try {
      const response = await fetch("/api/link-building/outreach-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceTone: activeOutreach.voiceTone,
          offering: activeOutreach.offering,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        settings?: OutreachSettings
      } | null

      if (!response.ok || !payload?.settings) {
        setOutreachSettingsMessage(
          payload?.error ?? "Could not save outreach settings."
        )
        return
      }

      setOutreachSettings(payload.settings)
      setLastSavedOutreach(payload.settings)
      setOutreachSettingsMessage("Outreach settings saved.")
    } catch (error) {
      setOutreachSettingsMessage(
        error instanceof Error
          ? error.message
          : "Could not save outreach settings."
      )
    } finally {
      setIsSavingOutreachSettings(false)
    }
  }

  function toggleType(type: OpportunityType) {
    const nextTypes = activeTypes.has(type)
      ? OPPORTUNITY_TYPES.filter(
          (opportunityType) =>
            opportunityType !== type && activeTypes.has(opportunityType)
        )
      : OPPORTUNITY_TYPES.filter(
          (opportunityType) =>
            opportunityType === type || activeTypes.has(opportunityType)
        )

    if (nextTypes.length === 0) {
      setDiscoverySettingsMessage("Keep at least one backlink type active.")
      return
    }

    updateDiscoverySettings({ opportunityTypes: nextTypes })
  }

  function updateDrMin(drMin: number) {
    const { drMax } = discoverySettings
    const nextDrMax = drMax !== null && drMax < drMin ? drMin : drMax

    updateDiscoverySettings({ drMin, drMax: nextDrMax })
  }

  function applyDrMax(drMax: number | null) {
    const nextDrMin =
      drMax !== null && discoverySettings.drMin > drMax
        ? drMax
        : discoverySettings.drMin

    updateDiscoverySettings({ drMin: nextDrMin, drMax })
  }

  function updateDrMax(drMax: number | null) {
    const isHighDr = drMax === null || drMax >= 50
    if (isHighDr && !hasDrMaxWarningSeen()) {
      setPendingDrMax(drMax)
      return
    }
    applyDrMax(drMax)
  }

  async function saveDiscoverySettings() {
    if (isSavingDiscoverySettings) return

    setIsSavingDiscoverySettings(true)
    setDiscoverySettingsMessage(null)

    try {
      const response = await fetch("/api/link-building/discovery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discoverySettings),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        settings?: DiscoverySettings
      } | null

      if (!response.ok || !payload?.settings) {
        setDiscoverySettingsMessage(
          payload?.error ?? "Could not save discovery settings."
        )
        return
      }

      setSettings(payload.settings)
      setLastSaved(payload.settings)
      captureEvent("discovery_settings_saved", {
        dr_min: payload.settings.drMin,
        dr_max: payload.settings.drMax ?? -1,
        opportunity_types_count: payload.settings.opportunityTypes.length,
      })
      setDiscoverySettingsMessage("Discovery settings saved.")
    } catch (error) {
      setDiscoverySettingsMessage(
        error instanceof Error
          ? error.message
          : "Could not save discovery settings."
      )
    } finally {
      setIsSavingDiscoverySettings(false)
    }
  }

  const settingsFooter = (helper: string) => (
    <SettingsSaveFooter
      message={discoverySettingsMessage}
      helper={helper}
      isSaving={isSavingDiscoverySettings}
      hasUnsavedChanges={hasUnsavedDiscoveryChanges}
      onSave={saveDiscoverySettings}
    />
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="backlink-types" className="gap-4">
          <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="backlink-types">
              <IconLayoutGrid className="size-4" />
              <span>Backlink Types</span>
            </TabsTrigger>
            <TabsTrigger value="competitors">
              <IconUsers className="size-4" />
              <span>Competitors</span>
            </TabsTrigger>
            <TabsTrigger value="seo-metrics">
              <IconChartBar className="size-4" />
              <span>SEO Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="outreach">
              <IconMail className="size-4" />
              <span>Outreach</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="backlink-types">
            <BacklinkTypesSection
              opportunityTypes={OPPORTUNITY_TYPES}
              activeTypes={activeTypes}
              onToggle={toggleType}
              footer={settingsFooter(
                "These backlink types apply to future discovery runs."
              )}
            />
          </TabsContent>

          <TabsContent value="competitors">
            <CompetitorsSection competitors={competitors} />
          </TabsContent>

          <TabsContent value="seo-metrics">
            <SeoMetricsSection
              drMin={discoverySettings.drMin}
              drMax={discoverySettings.drMax}
              onDrMinChange={updateDrMin}
              onDrMaxChange={updateDrMax}
              footer={settingsFooter(
                "These filters apply to future directory discovery runs."
              )}
            />
          </TabsContent>

          <TabsContent value="outreach">
            <OutreachSettingsSection
              settings={activeOutreach}
              onUpdate={handleOutreachUpdate}
              footer={
                <SettingsSaveFooter
                  message={outreachSettingsMessage}
                  helper="These settings apply to future email drafts."
                  isSaving={isSavingOutreachSettings}
                  hasUnsavedChanges={hasUnsavedOutreachChanges}
                  onSave={saveOutreachSettings}
                />
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <DrMaxWarningDialog
        open={drMaxWarningOpen}
        onConfirm={() => {
          markDrMaxWarningSeen()
          if (pendingDrMax !== undefined) applyDrMax(pendingDrMax)
          setPendingDrMax(undefined)
        }}
        onCancel={() => setPendingDrMax(undefined)}
      />

      <UnsavedChangesDialog
        open={pendingNavFn !== null}
        onStay={() => setPendingNavFn(null)}
        onLeave={() => {
          pendingNavFn?.()
          setPendingNavFn(null)
        }}
      />
    </>
  )
}
