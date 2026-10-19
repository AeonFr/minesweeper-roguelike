import { useSyncExternalStore } from 'react'

const KEY = 'mine-rogue.settings.v1'
export interface Settings {
  music: boolean
  sfx: boolean
}

let settings: Settings = { music: false, sfx: false }
try {
  settings = { ...settings, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
} catch {
  /* defaults */
}

const listeners = new Set<() => void>()
export const getSettings = () => settings
export const useSettings = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    getSettings,
  )

export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}
