// Mirrors the business-hours window used by the sender cron's own
// throttling reschedule (apps/server/src/helpers/emails/outreach-schedule.ts
// buildCapacityReschedule) so resumed sequences land in the same kind of
// slot a normal send would, not duplicated here as a shared import since
// apps/web and apps/server don't share runtime code.
const UTC_SEND_START_HOUR = 9
const UTC_SEND_END_HOUR = 17
const MINUTE_MS = 60 * 1000

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isWeekendUtc(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

function nextBusinessDayUtc(date: Date): Date {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, UTC_SEND_START_HOUR)
  )
  while (isWeekendUtc(next)) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

export function randomUtcBusinessSlotAfter(date: Date): Date {
  let base = new Date(date)
  while (isWeekendUtc(base)) {
    base = nextBusinessDayUtc(base)
  }

  const dayStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), UTC_SEND_START_HOUR))
  const dayEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), UTC_SEND_END_HOUR))

  if (base < dayStart) {
    return new Date(dayStart.getTime() + randomInt(0, (UTC_SEND_END_HOUR - UTC_SEND_START_HOUR) * 60 - 1) * MINUTE_MS)
  }

  if (base >= dayEnd) {
    return randomUtcBusinessSlotAfter(nextBusinessDayUtc(base))
  }

  const remainingMinutes = Math.max(1, Math.floor((dayEnd.getTime() - base.getTime()) / MINUTE_MS))
  return new Date(base.getTime() + randomInt(0, remainingMinutes - 1) * MINUTE_MS)
}

/** Staggers a batch of resumed sequences: each call lands 60-240 minutes
 * after the previous one's result, in the next business-hour slot, so a
 * large paused batch doesn't all become due at once. */
export function nextStaggeredSlotAfter(previous: Date): Date {
  return randomUtcBusinessSlotAfter(new Date(previous.getTime() + randomInt(60, 240) * MINUTE_MS))
}
