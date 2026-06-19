"use client"

import { EditableList } from "@/components/onboarding/editable-list"
import {
  normalizeUrl,
  type OnboardingData,
  type OnboardingField,
  type OnboardingFieldErrors,
  type ResourceMode,
} from "@/consts/onboarding"
import { IconFiles, IconSitemap } from "@tabler/icons-react"
import { Input } from "@workspace/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

export function StepResources({
  data,
  errors,
  updateField,
}: {
  data: OnboardingData
  errors: OnboardingFieldErrors
  updateField: <Key extends OnboardingField>(
    field: Key,
    value: OnboardingData[Key]
  ) => void
}) {
  function switchMode(next: ResourceMode) {
    if (next === data.resourceMode) return
    updateField("resourceMode", next)
    updateField("resourceUrls", [])
  }

  let suggestedSitemap = ""
  try {
    suggestedSitemap = `${new URL(normalizeUrl(data.websiteUrl)).origin}/sitemap.xml`
  } catch {
    // ignore
  }

  return (
    <Tabs
      value={data.resourceMode}
      onValueChange={(v) => switchMode(v as ResourceMode)}
      className="gap-4"
    >
      <TabsList>
        <TabsTrigger value="sitemap">
          <IconSitemap className="size-4" />
          <span>Sitemap</span>
        </TabsTrigger>
        <TabsTrigger value="pages">
          <IconFiles className="size-4" />
          <span>Individual pages</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sitemap">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-[0.7rem] font-bold text-muted-foreground uppercase">
              Sitemap URL
            </label>
            <Input
              placeholder={suggestedSitemap || "https://yoursite.com/sitemap.xml"}
              value={data.resourceUrls[0] ?? ""}
              onChange={(e) => {
                const val = e.target.value
                updateField("resourceUrls", val ? [val] : [])
              }}
              className={cn(
                "h-12",
                errors.resourceUrls ? "border-destructive" : "border-border"
              )}
            />
            {errors.resourceUrls && (
              <p className="text-xs text-destructive">{errors.resourceUrls}</p>
            )}
          </div>
          {suggestedSitemap && !data.resourceUrls[0] && (
            <button
              type="button"
              onClick={() => updateField("resourceUrls", [suggestedSitemap])}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Use {suggestedSitemap}
            </button>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            We crawl your sitemap to discover all the pages where we should find backlink opportunities.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="pages">
        <div className="space-y-3">
          <EditableList
            label={`Page URLs (${data.resourceUrls.length}/20, min 5)`}
            items={data.resourceUrls}
            placeholder="https://yoursite.com/blog/your-post"
            error={errors.resourceUrls}
            maxItems={20}
            badgeIcon={<IconFiles className="h-3.5 w-3.5" />}
            normalizeItem={(value) => normalizeUrl(value.trim())}
            onChange={(items) => updateField("resourceUrls", items)}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Add at least 5 pages — blog posts, guides, or landing pages — that you want to earn backlinks to.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  )
}
