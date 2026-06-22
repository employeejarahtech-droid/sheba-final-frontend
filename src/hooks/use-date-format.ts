import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY'

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

type Part = { type: 'token' | 'literal'; value: string }

const TOKEN_RE = /^(YYYY|MMM|DD|MM|YY)/

/**
 * Split a format pattern into tokens (DD, MM, YYYY, YY, MMM) and literals,
 * preserving the separators between them.
 */
function tokenize(fmt: string): Part[] {
  const parts: Part[] = []
  let i = 0
  while (i < fmt.length) {
    const m = fmt.slice(i).match(TOKEN_RE)
    if (m) {
      parts.push({ type: 'token', value: m[0] })
      i += m[0].length
    } else {
      parts.push({ type: 'literal', value: fmt[i] })
      i += 1
    }
  }
  return parts
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Format a Date into the given pattern (e.g. DD/MM/YYYY → 14/06/2026). */
export function formatDateWith(date: Date, fmt: string = DEFAULT_DATE_FORMAT): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  const values: Record<string, string> = {
    DD: day,
    MM: month,
    YYYY: year,
    YY: year.slice(-2),
    MMM: MONTHS_SHORT[date.getMonth()],
  }
  return tokenize(fmt)
    .map((p) => (p.type === 'token' ? values[p.value] ?? '' : p.value))
    .join('')
}

/** Parse a date string written in the given pattern into a Date, or undefined. */
export function parseDateWith(input: string, fmt: string = DEFAULT_DATE_FORMAT): Date | undefined {
  if (!input) return undefined
  const parts = tokenize(fmt)
  const tokenOrder: string[] = []
  let regexStr = '^'
  for (const p of parts) {
    if (p.type === 'literal') {
      regexStr += escapeRegex(p.value)
    } else {
      if (p.value === 'MMM') {
        tokenOrder.push('MMM')
        regexStr += '([A-Za-z]{3})'
      } else if (p.value === 'YYYY') {
        tokenOrder.push('YYYY')
        regexStr += '(\\d{4})'
      } else {
        tokenOrder.push(p.value) // DD, MM, YY
        regexStr += '(\\d{1,2})'
      }
    }
  }
  regexStr += '$'
  const m = input.trim().match(new RegExp(regexStr))
  if (!m) return undefined

  const g: Record<string, string> = {}
  tokenOrder.forEach((tok, idx) => {
    g[tok] = m[idx + 1]
  })

  const yearStr = g.YYYY || `20${g.YY || '00'}`
  const year = Number(yearStr)
  const month = g.MMM
    ? MONTHS_SHORT.findIndex((mn) => mn.toLowerCase() === g.MMM.toLowerCase())
    : Number(g.MM || '1') - 1
  const day = Number(g.DD || '1')

  if (g.MMM && month === -1) return undefined
  const parsed = new Date(year, month, day)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** Convert a Date to a canonical ISO date string (YYYY-MM-DD) for storage/API. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type CompanySettingsResponse = {
  date_format?: string | null
}

/**
 * Hook exposing the tenant's chosen date format (from company settings) plus
 * format/parse helpers bound to it. Display dates using `formatDate`; submit
 * the canonical `toISODate(parseDate(value))` so the backend is format-agnostic.
 */
export function useDateFormat() {
  const { data } = useQuery<CompanySettingsResponse>({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await api.get('/company-settings')
      return res.data.data
    },
  })

  const dateFormat = data?.date_format || DEFAULT_DATE_FORMAT

  return {
    dateFormat,
    /** Lowercased pattern for UI hints, e.g. "dd/mm/yyyy" */
    formatHint: dateFormat.toLowerCase(),
    formatDate: (date: Date) => formatDateWith(date, dateFormat),
    /**
     * Settings date + 12h time for display, e.g. "14/06/2026 03:45 PM".
     * Accepts a Date, a date/ISO string, or null/empty (returns '-').
     */
    formatDateTime: (value: Date | string | null) => {
      if (!value) return '-';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${formatDateWith(date, dateFormat)} ${timeStr}`;
    },
    parseDate: (input: string) => parseDateWith(input, dateFormat),
    toISODate,
  }
}
