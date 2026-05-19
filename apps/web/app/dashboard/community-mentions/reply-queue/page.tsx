import { IconMessage2Share } from "@tabler/icons-react"

import { MentionFeed } from "@/components/community-mentions/mention-feed"

export default function ReplyQueuePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="max-w-2xl">
          <h1 className="flex items-center font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            <IconMessage2Share className="mr-2 size-8" />
            Reply queue
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Community mentions matched to your product. Review the fit, refine the reply, and post it yourself from the original thread.
          </p>
        </div>
      </div>
      <MentionFeed />
    </div>
  )
}
