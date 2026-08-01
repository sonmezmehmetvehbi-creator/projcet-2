import type { CSSProperties } from 'react'

// Standalone Forge Quiz UI primitives shared by the create client and the
// LaunchChooser. Kept dependency-free so LaunchChooser can use them without
// importing back into ForgeQuizCreateClient (which would create a cycle).

export const DURATIONS = [
  { value: '1h', label: '1 hour' }, { value: '6h', label: '6 hours' }, { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' }, { value: '3d', label: '3 days' }, { value: '7d', label: '7 days' },
]

// Total hours for a custom "N hours/days" duration.
export function customHours(value: number, unit: 'hours' | 'days'): number {
  return Math.max(1, Math.round(value * (unit === 'days' ? 24 : 1)))
}

export const input: CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }
export const sel: CSSProperties = { ...input, colorScheme: 'dark', cursor: 'pointer' }
export const pill = (active: boolean): CSSProperties => ({ padding: '0.5rem 0.9rem', borderRadius: '9999px', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.12)'}`, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: active ? 'rgb(196,181,253)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' })
