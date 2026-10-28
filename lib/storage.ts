'use client'

const STORAGE_KEY = 'matriculafija-session-v1'

type PersistedState = Record<string, unknown>

export function readSession<T extends PersistedState>(): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeSession(value: PersistedState) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* memory-only fallback */ }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* memory-only fallback */ }
}
