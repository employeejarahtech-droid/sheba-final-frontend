import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UserPlus, LogOut, BedDouble, AlertTriangle, Wallet, Activity,
  LayoutDashboard, Building2, ClipboardList,
} from 'lucide-react'
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

// Local YYYY-MM-DD (avoid toISOString() UTC off-by-one — same convention as the other pages).
function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Kpis = {
  admissions: number
  discharges: number
  current_admitted: number
  critical: number
  collections_total: number
  collections_count: number
  beds_total: number
  beds_occupied: number
  beds_available: number
  beds_maintenance: number
}

type WardRow = {
  ward: string
  total_beds: number
  occupied_beds: number
  available_beds: number
  maintenance_beds: number
  active_patients: number
}

type RecentAdmission = {
  id: number
  admission_no: string
  patient_name: string
  doctor_name: string
  admission_date: string | null
  bed: string
  status: string
}

type Props = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  discharged: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function IndoorDashboard({ from, to, onRangeChange }: Props) {
  const todayStr = useMemo(() => toYMD(new Date()), [])
  const token = getCookie('accessToken')
  const { currencySymbol } = useCurrency()

  // Default to Today on first load — the range is always reflected in the URL.
  useEffect(() => {
    if (!from || !to) onRangeChange(todayStr, todayStr, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effFrom = from || todayStr
  const effTo = to || todayStr

  const datePresets = useMemo(() => {
    const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
    const shift = (n: number) => { const d = today(); d.setDate(d.getDate() - n); return d }
    return ({
      today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
      yesterday: { label: 'Yesterday', from: toYMD(shift(1)), to: toYMD(shift(1)) },
      last7: { label: 'Last 7 days', from: toYMD(shift(6)), to: toYMD(today()) },
      last15: { label: 'Last 15 days', from: toYMD(shift(14)), to: toYMD(today()) },
      last30: { label: 'Last 30 days', from: toYMD(shift(29)), to: toYMD(today()) },
      last60: { label: 'Last 60 days', from: toYMD(shift(59)), to: toYMD(today()) },
      last90: { label: 'Last 90 days', from: toYMD(shift(89)), to: toYMD(today()) },
      last180: { label: 'Last 180 days', from: toYMD(shift(179)), to: toYMD(today()) },
      last365: { label: 'Last 365 days', from: toYMD(shift(364)), to: toYMD(today()) },
      thisMonth: { label: 'This Month', from: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toYMD(today()) },
    } as const)
  }, [])

  const activePreset = useMemo(() => {
    const match = Object.entries(datePresets).find(([, v]) => v.from === effFrom && v.to === effTo)
    return match ? match[0] : 'custom'
  }, [effFrom, effTo, datePresets])

  // Selecting "Custom" reveals the date pickers even while the current
  // from/to still matches a preset.
  const [customSelected, setCustomSelected] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const showCustomFields = customSelected || activePreset === 'custom'

  const applyPreset = (key: string) => {
    if (key === 'custom') {
      setCustomSelected(true)
    } else {
      setCustomSelected(false)
      const p = (datePresets as any)[key]
      if (p) onRangeChange(p.from, p.to)
    }
    setPresetOpen(false)
  }

  const presetLabel = activePreset !== 'custom'
    ? datePresets[activePreset as keyof typeof datePresets].label
    : ''
  const isToday = activePreset === 'today'

  const { data, isFetching } = useQuery({
    queryKey: ['indoor-dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/admission/dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch indoor dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: {
        kpis: {
          admissions: 0, discharges: 0, current_admitted: 0, critical: 0,
          collections_total: 0, collections_count: 0,
          beds_total: 0, beds_occupied: 0, beds_available: 0, beds_maintenance: 0,
        },
        trend: [],
        wards: [],
        recent: [],
      },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? {
    admissions: 0, discharges: 0, current_admitted: 0, critical: 0,
    collections_total: 0, collections_count: 0,
    beds_total: 0, beds_occupied: 0, beds_available: 0, beds_maintenance: 0,
  }
  const trend = d?.trend || []
  const wards: WardRow[] = d?.wards || []
  const recent: RecentAdmission[] = d?.recent || []
  const num = (n: number) => Number(n || 0).toLocaleString()
  const money = (n: number) => `${currencySymbol} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const cards = [
    { label: 'Admissions', value: num(kpis.admissions), icon: UserPlus, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Discharges', value: num(kpis.discharges), icon: LogOut, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Currently Admitted', value: num(kpis.current_admitted), icon: Activity, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: `Available Beds (of ${num(kpis.beds_total)})`, value: num(kpis.beds_available), icon: BedDouble, gradientClass: 'from-cyan-500 to-sky-500 shadow-cyan-500/20' },
    { label: 'Critical', value: num(kpis.critical), icon: AlertTriangle, gradientClass: 'from-orange-500 to-amber-500 shadow-orange-500/20' },
    { label: `Collections (${num(kpis.collections_count)} payments)`, value: money(kpis.collections_total), icon: Wallet, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
  ]

  return (
    <>
      <AppHeader fixed />
      <Main>
        {/* Title (left) + date range filter (right) */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
              <LayoutDashboard className='w-5 h-5 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Indoor Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                {isToday
                  ? 'Admission activity for today'
                  : `Admission activity — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Date range filter (right) — presets + custom range, kept in the URL */}
          <div className='flex items-center gap-1.5'>
            <Select
              value={showCustomFields ? 'custom' : activePreset}
              onValueChange={applyPreset}
              open={presetOpen}
              onOpenChange={setPresetOpen}
            >
              <SelectTrigger className='w-[160px] h-9'>
                <SelectValue placeholder='Filter by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='today'>Today</SelectItem>
                <SelectItem value='yesterday'>Yesterday</SelectItem>
                <SelectItem value='last7'>Last 7 days</SelectItem>
                <SelectItem value='last15'>Last 15 days</SelectItem>
                <SelectItem value='last30'>Last 30 days</SelectItem>
                <SelectItem value='last60'>Last 60 days</SelectItem>
                <SelectItem value='last90'>Last 90 days</SelectItem>
                <SelectItem value='last180'>Last 180 days</SelectItem>
                <SelectItem value='last365'>Last 365 days</SelectItem>
                <SelectItem value='thisMonth'>This Month</SelectItem>
                <SelectItem value='custom'>Custom range</SelectItem>
              </SelectContent>
            </Select>
            {showCustomFields && (
              <>
                <DateField
                  value={effFrom}
                  onChange={(v: string) => onRangeChange(v, effTo)}
                  placeholder='From'
                />
                <span className='text-xs text-muted-foreground'>to</span>
                <DateField
                  value={effTo}
                  onChange={(v: string) => onRangeChange(effFrom, v)}
                  placeholder='To'
                />
              </>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8'>
          {cards.map((c) => (
            <SummaryCard
              key={c.label}
              title={c.label}
              value={c.value}
              icon={c.icon}
              gradientClass={c.gradientClass}
            />
          ))}
        </div>

        {/* Trend chart */}
        <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 mb-6'>
          <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                <Activity className='w-4 h-4 text-white' />
              </div>
              <div>
                <CardTitle className='text-lg font-bold'>Admissions vs Discharges per Day</CardTitle>
                <p className='text-xs text-gray-600 dark:text-gray-400'>
                  {isToday ? 'today' : activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}
                  {isFetching ? ' · refreshing…' : ''}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-4'>
            <div className='h-[300px] w-full min-w-0'>
              <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                <BarChart data={trend}>
                  <XAxis dataKey='date' tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval='preserveStartEnd' />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='admissions' fill='#6366f1' name='Admissions' radius={[4, 4, 0, 0]} />
                  <Bar dataKey='discharges' fill='#f59e0b' name='Discharges' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ward occupancy + recent admissions */}
        <div className='grid gap-6 md:grid-cols-2'>
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg shadow-lg'>
                  <Building2 className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Ward-wise Occupancy</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Beds and active patients right now</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {wards.length === 0 ? (
                <p className='py-10 text-center text-sm text-muted-foreground'>No beds configured yet.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b bg-muted/40'>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Ward</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Patients</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Occupied</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Available</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Total Beds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wards.map((w) => (
                        <tr key={w.ward} className='border-b last:border-0 hover:bg-muted/30'>
                          <td className='px-4 py-2.5 font-medium'>{w.ward}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums'>{num(w.active_patients)}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums'>{num(w.occupied_beds)}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400'>{num(w.available_beds)}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums text-muted-foreground'>{num(w.total_beds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                  <ClipboardList className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Recent Admissions</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Latest 10 in the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {recent.length === 0 ? (
                <p className='py-10 text-center text-sm text-muted-foreground'>No admissions in this period.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b bg-muted/40'>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Admission No</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Patient</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Doctor</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Bed</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Date</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r) => (
                        <tr key={r.id} className='border-b last:border-0 hover:bg-muted/30'>
                          <td className='px-4 py-2.5 font-medium whitespace-nowrap'>{r.admission_no}</td>
                          <td className='px-4 py-2.5'>{r.patient_name}</td>
                          <td className='px-4 py-2.5 text-muted-foreground'>{r.doctor_name}</td>
                          <td className='px-4 py-2.5 text-muted-foreground whitespace-nowrap'>{r.bed}</td>
                          <td className='px-4 py-2.5 whitespace-nowrap tabular-nums'>{r.admission_date || '—'}</td>
                          <td className='px-4 py-2.5'>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] || STATUS_BADGE.discharged}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

// ===== Summary Card Component =====
function SummaryCard({
  title,
  value,
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string
  icon: React.ElementType
  gradientClass: string
}) {
  return (
    <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
        <div className='flex items-center gap-2.5'>
          <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}>
            <Icon className='h-4 w-4 text-white' />
          </div>
          <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-2xl font-bold'>{value}</div>
      </CardContent>
    </Card>
  )
}
