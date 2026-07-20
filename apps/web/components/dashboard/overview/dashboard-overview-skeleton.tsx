import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 bg-card px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="size-7 shrink-0 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-12 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-start justify-between space-y-0">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-0.5 size-9 shrink-0 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3.5 w-44 rounded" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 shrink-0 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex items-center gap-3 space-y-0">
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <Skeleton className="h-4 w-36 rounded" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-3.5 w-12 rounded" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-3 space-y-0">
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <Skeleton className="h-4 w-12 rounded" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center py-2">
              <Skeleton className="size-[148px] rounded-full" />
            </div>
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-2.5 shrink-0 rounded-[3px]" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
