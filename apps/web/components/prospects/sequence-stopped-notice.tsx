import {
  IconBan,
  IconMailX,
  IconMessage2,
  IconUserOff,
  IconUserQuestion,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import { formatRelative } from "@/lib/format-date"

type StopTone = "positive" | "destructive" | "warning" | "muted"

const REASON_CONFIG: Record<
  string,
  { icon: typeof IconMessage2; tone: StopTone; title: string; copy: string }
> = {
  reply: {
    icon: IconMessage2,
    tone: "positive",
    title: "They replied",
    copy: "This contact responded, so the automated sequence paused here. Keep the conversation going from your connected mailbox.",
  },
  bounce: {
    icon: IconMailX,
    tone: "destructive",
    title: "Email bounced",
    copy: "The message couldn't be delivered — the address is likely invalid. Outreach stopped automatically to protect your sender reputation.",
  },
  unsubscribe: {
    icon: IconBan,
    tone: "muted",
    title: "Unsubscribed",
    copy: "This contact opted out. They've been added to your suppression list and won't be contacted again.",
  },
  stop_request: {
    icon: IconUserOff,
    tone: "warning",
    title: "Asked to stop",
    copy: "This contact declined or asked not to be contacted further. The sequence ended out of respect for their response.",
  },
  wrong_person: {
    icon: IconUserQuestion,
    tone: "warning",
    title: "Wrong contact",
    copy: "This contact said they're not the right person to reach. Consider finding another contact at this company.",
  },
  suppressed_recipient: {
    icon: IconBan,
    tone: "muted",
    title: "Recipient suppressed",
    copy: "This address is on your suppression list, so no message was sent.",
  },
}

const TONE_CLASSES: Record<StopTone, { border: string; bg: string; icon: string; title: string }> = {
  positive: {
    border: "border-primary/20",
    bg: "bg-primary/5",
    icon: "text-primary",
    title: "text-primary",
  },
  destructive: {
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    icon: "text-destructive",
    title: "text-destructive",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    icon: "text-amber-600",
    title: "text-amber-600",
  },
  muted: {
    border: "border-border",
    bg: "bg-muted/30",
    icon: "text-muted-foreground",
    title: "text-foreground",
  },
}

export function SequenceStoppedNotice({
  reason,
  stoppedAt,
  className,
}: {
  reason: string
  stoppedAt: string | null
  className?: string
}) {
  const config = REASON_CONFIG[reason]
  const tone = TONE_CLASSES[config?.tone ?? "muted"]
  const Icon = config?.icon ?? IconBan

  return (
    <div className={cn("rounded-xl border px-4 py-3", tone.border, tone.bg, className)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 size-4 shrink-0", tone.icon)} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-xs font-semibold", tone.title)}>
              {config?.title ?? `Sequence stopped: ${reason.replace(/_/g, " ")}`}
            </p>
            {stoppedAt && (
              <span className="text-[10px] text-muted-foreground/60">
                · {formatRelative(new Date(stoppedAt))}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {config?.copy ?? "Automated outreach for this prospect has stopped."}
          </p>
        </div>
      </div>
    </div>
  )
}
