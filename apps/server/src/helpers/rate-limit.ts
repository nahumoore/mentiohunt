const DAILY_LIMIT = 10

type Entry = { count: number; date: string }
const store = new Map<string, Entry>()

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export function checkRateLimit(
  tool: string,
  ip: string
): { allowed: boolean; remaining: number } {
  const today = todayUTC()
  const key = `${tool}:${ip}:${today}`
  const entry = store.get(key)

  if (!entry || entry.date !== today) {
    store.set(key, { count: 1, date: today })
    return { allowed: true, remaining: DAILY_LIMIT - 1 }
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: DAILY_LIMIT - entry.count }
}
