import { EDITION_2026 } from "./2026"
import type { Edition } from "./types"

export const EDITIONS: Record<number, Edition> = {
  2026: EDITION_2026,
}

export const LATEST_YEAR = 2026

export function getEdition(year: number): Edition {
  const edition = EDITIONS[year]
  if (!edition) {
    throw new Error(`No link building statistics edition for ${year}`)
  }
  return edition
}

export type { ChartId, Edition } from "./types"
