import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

const SKELETON_ROWS = 8
const SKELETON_COL_WIDTHS = ["w-32", "w-8", "w-14", "w-12", "w-20"]

export function DirectoriesPageSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="border-b border-border/60 bg-gradient-to-r from-orange/8 via-card to-card px-4 py-3 sm:px-6">
        <div className="mb-3">
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Skeleton className="h-9 w-full max-w-sm rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="w-12 px-4 py-3">
                <Skeleton className="size-4 rounded" />
              </th>
              {["w-40", "w-10", "w-16", "w-14", "w-24", "w-8"].map((w, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className={`h-3.5 ${w} rounded`} />
                </th>
              ))}
              <th className="w-8 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3.5">
                  <Skeleton className="size-4 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-32 rounded" />
                </td>
                {SKELETON_COL_WIDTHS.map((w, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <Skeleton className={`h-4 ${w} rounded`} />
                  </td>
                ))}
                <td className="px-4 py-3.5">
                  <Skeleton className="size-4 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
