"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "mh_playbook_modal"
const SESSION_KEY = "mh_playbook_modal_shown"
const SHOW_DELAY_MS = 3_000
const DISMISS_SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000

type StoredState = {
  status: "converted" | "dismissed"
  at: number
}

function readStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredState) : null
  } catch {
    return null
  }
}

function writeStoredState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — worst case the modal shows again next visit
  }
}

function alreadyShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "true"
  } catch {
    return false
  }
}

function markShownThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "true")
  } catch {
    // ignore
  }
}

function isSuppressed(): boolean {
  const stored = readStoredState()
  if (!stored) return false
  if (stored.status === "converted") return true
  return Date.now() - stored.at < DISMISS_SUPPRESS_MS
}

/**
 * Shows the playbook modal 3s after page load, once per session.
 * Suppressed entirely once converted, and for 30 days after a dismiss.
 */
export function usePlaybookModalTimer(enabled: boolean) {
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    if (!enabled) return
    if (isSuppressed() || alreadyShownThisSession()) return

    const timer = setTimeout(() => {
      setTriggered(true)
      markShownThisSession()
    }, SHOW_DELAY_MS)

    return () => clearTimeout(timer)
  }, [enabled])

  function dismiss() {
    writeStoredState({ status: "dismissed", at: Date.now() })
    setTriggered(false)
  }

  function markConverted() {
    writeStoredState({ status: "converted", at: Date.now() })
    setTriggered(false)
  }

  return { triggered, dismiss, markConverted }
}
