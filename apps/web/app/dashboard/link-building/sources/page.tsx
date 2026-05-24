"use client"

import { IconChartBar, IconLayoutGrid, IconUsers } from "@tabler/icons-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useEffect, useMemo, useState } from "react"

import { BacklinkTypesSection } from "@/components/link-building/sources/backlink-types-section"
import { CompetitorsSection } from "@/components/link-building/sources/competitors-section"
import { SeoMetricsSection } from "@/components/link-building/sources/seo-metrics-section"
import { SettingsSaveFooter } from "@/components/link-building/sources/settings-save-footer"
import { UnsavedChangesDialog } from "@/components/link-building/sources/unsaved-changes-dialog"
import type { OpportunityType } from "@/lib/opportunity-types"
import { TYPE_CONFIG } from "@/lib/opportunity-types"
import { captureEvent } from "@/lib/analytics"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import { useProductStore } from "@/stores/product-store"

const OPPORTUNITY_TYPES = Object.keys(TYPE_CONFIG) as OpportunityType[]

const DEFAULT_DISCOVERY_SETTINGS: DiscoverySettings = {
  opportunityTypes: OPPORTUNITY_TYPES,
  drMin: 0,
  drMax: null,
}

export default function DiscoverySetupPage() {
  const product = useProductStore((state) => state.product)
  const settings = useDiscoverySettingsStore((state) => state.settings)
  const setSettings = useDiscoverySettingsStore((state) => state.setSettings)
  const updateSettings = useDiscoverySettingsStore(
    (state) => state.updateSettings
  )
  const [isSavingDiscoverySettings, setIsSavingDiscoverySettings] =
    useState(false)
  const [discoverySettingsMessage, setDiscoverySettingsMessage] = useState<
    string | null
  >(null)

  const [lastSaved, setLastSaved] = useState<DiscoverySettings | null>(settings)
  const [pendingNavFn, setPendingNavFn] = useState<(() => void) | null>(null)

  const discoverySettings = settings ?? DEFAULT_DISCOVERY_SETTINGS
  const activeTypes = new Set(discoverySettings.opportunityTypes)
  const competitors = product?.competitors ?? []

  const hasUnsavedChanges = useMemo(() => {
    const baseline = lastSaved ?? DEFAULT_DISCOVERY_SETTINGS
    return JSON.stringify(discoverySettings) !== JSON.stringify(baseline)
  }, [discoverySettings, lastSaved])

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

  function updateDrMax(drMax: number | null) {
    const nextDrMin =
      drMax !== null && discoverySettings.drMin > drMax
        ? drMax
        : discoverySettings.drMin

    updateDiscoverySettings({ drMin: nextDrMin, drMax })
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
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={saveDiscoverySettings}
    />
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="backlink-types" className="gap-4">
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
          </TabsList>

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
        </Tabs>
      </div>

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
