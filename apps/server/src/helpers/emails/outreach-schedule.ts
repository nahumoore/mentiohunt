const UTC_SEND_START_HOUR = 9
const UTC_SEND_END_HOUR = 17
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isWeekendUtc(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

function nextBusinessDayUtc(date: Date): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, UTC_SEND_START_HOUR))
  while (isWeekendUtc(next)) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

export function isWithinUtcSendWindow(date = new Date()): boolean {
  return !isWeekendUtc(date) && date.getUTCHours() >= UTC_SEND_START_HOUR && date.getUTCHours() < UTC_SEND_END_HOUR
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

export function buildProspectSequenceSchedule(now = new Date()): { step1: Date; step2: Date; step3: Date } {
  const step1 = randomUtcBusinessSlotAfter(new Date(now.getTime() + randomInt(45, 180) * MINUTE_MS))
  const step2 = randomUtcBusinessSlotAfter(new Date(step1.getTime() + 3 * DAY_MS + randomInt(-120, 180) * MINUTE_MS))
  const step3 = randomUtcBusinessSlotAfter(new Date(step2.getTime() + 4 * DAY_MS + randomInt(-180, 240) * MINUTE_MS))
  return { step1, step2, step3 }
}

export function buildRetrySchedule(attemptCount: number, now = new Date()): Date {
  const delayMinutes = Math.min(24 * 60, Math.max(15, 30 * 2 ** Math.max(0, attemptCount - 1)))
  return randomUtcBusinessSlotAfter(new Date(now.getTime() + delayMinutes * MINUTE_MS))
}

export function buildCapacityReschedule(now = new Date()): Date {
  return randomUtcBusinessSlotAfter(new Date(now.getTime() + randomInt(60, 240) * MINUTE_MS))
}
