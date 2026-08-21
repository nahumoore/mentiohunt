// Canonical URLs for the statistics page. Kept in a plain module (no
// "use client") so server components and client components can both read
// them. Every edition gets its own URL (the year lives in the path), so
// these all take the year rather than being fixed constants.

export const SITE_URL = "https://mentiohunt.com"

export function pathFor(year: number) {
  return `/link-building-outreach-statistics-${year}`
}

export function pageUrlFor(year: number) {
  return `${SITE_URL}${pathFor(year)}`
}

export function displayUrlFor(year: number) {
  return `mentiohunt.com${pathFor(year)}`
}

export function embedPathFor(year: number, chartId: string) {
  return `/embed/link-building-outreach-statistics-${year}/${chartId}`
}
