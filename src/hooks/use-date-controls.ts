import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

export type DateControlKey =
  | 'outdoor_invoice_date_changeable'
  | 'outdoor_due_collection_date_changeable'
  | 'indoor_admission_date_changeable'
  | 'indoor_advance_payment_date_changeable'
  | 'indoor_payment_date_changeable'

type DateControls = Record<DateControlKey, boolean>

// Defaults mirror the settings page: every date field is locked unless the
// admin explicitly turns its toggle on.
const DEFAULTS: DateControls = {
  outdoor_invoice_date_changeable: false,
  outdoor_due_collection_date_changeable: false,
  indoor_admission_date_changeable: false,
  indoor_advance_payment_date_changeable: false,
  indoor_payment_date_changeable: false,
}

/**
 * Reads the date-control flags saved on the Settings → Date Controls page.
 * Shares the ['app-settings'] react-query cache so it doesn't add a request
 * when settings are already loaded elsewhere on the page.
 *
 * `isChangeable(key)` returns true only when the admin enabled that toggle.
 */
export function useDateControls() {
  const token = getCookie('accessToken')

  const { data } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch app settings')
      return res.json()
    },
    enabled: !!token,
  })

  const controls = useMemo<DateControls>(() => {
    const raw = data?.data?.date_controls
    if (!raw) return DEFAULTS
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return { ...DEFAULTS, ...(parsed || {}) }
    } catch {
      return DEFAULTS
    }
  }, [data])

  const isChangeable = (key: DateControlKey) => controls[key] === true

  return { controls, isChangeable }
}
