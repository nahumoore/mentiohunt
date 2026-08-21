"use client"

import { IconFiles, IconSearch } from "@tabler/icons-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { KeywordsTab } from "@/components/targets/keywords-tab"
import { PagesTab } from "@/components/targets/pages-tab"
import { useQueryState } from "@/hooks/use-query-state"

type TargetsTab = "pages" | "keywords"

function isTargetsTab(value: string): value is TargetsTab {
  return value === "pages" || value === "keywords"
}

export function TargetsClient() {
  const [tab, setTab] = useQueryState<TargetsTab>("tab", "pages", isTargetsTab)

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TargetsTab)} className="gap-4">
      <TabsList>
        <TabsTrigger value="pages">
          <IconFiles className="size-4" />
          <span>Pages</span>
        </TabsTrigger>
        <TabsTrigger value="keywords">
          <IconSearch className="size-4" />
          <span>Keywords</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pages">
        <PagesTab onGoToKeywords={() => setTab("keywords")} />
      </TabsContent>

      <TabsContent value="keywords">
        <KeywordsTab />
      </TabsContent>
    </Tabs>
  )
}
