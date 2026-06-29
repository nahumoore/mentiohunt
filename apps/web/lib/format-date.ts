import { formatDistanceToNow, isFuture, isPast } from "date-fns"

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isFuture(d)) {
    return `In ${formatDistanceToNow(d)}`
  }
  if (isPast(d)) {
    return `${formatDistanceToNow(d)} ago`
  }
  return "Now"
}
