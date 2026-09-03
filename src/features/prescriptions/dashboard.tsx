import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Users, UserCog, UserPlus, XCircle, Activity, Pill, LayoutDashboard,
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

const API_URL = import.meta.env.VITE_API_URL

// Local YYYY-MM-DD (avoid toISOString() UTC off-by-one — same convention as the other pages).
function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Kpis = {
  total_prescriptions: number
  cancelled: number
  unique_patients: number
  unique_doctors: number
  new_patients: number
}

type TopDoctor = { doctor_id: number; doctor_name: string; prescription_count: number; last_prescribed_at: string }
type TopMedicine = { medicine_name: string; times_prescribed: number }

type Props = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

export function PrescriptionDashboard({ from, to, onRangeChange }: Props) {
  const todayStr = useMemo(() => toYMD(new Date()), [])
  const token = getCookie('accessToken')

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
      last45: { label: 'Last 45 days', from: toYMD(shift(44)), to: toYMD(today()) },
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
    queryKey: ['prescription-dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/prescriptions/dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch prescription dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: {
        kpis: { total_prescriptions: 0, cancelled: 0, unique_patients: 0, unique_doctors: 0, new_patients: 0 },
        trend: [],
        topDoctors: [],
        topMedicines: [],
      },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? { total_prescriptions: 0, cancelled: 0, unique_patients: 0, unique_doctors: 0, new_patients: 0 }
  const trend = d?.trend || []
  const topDoctors: TopDoctor[] = d?.topDoctors || []
  const topMedicines: TopMedicine[] = d?.topMedicines || []
  const num = (n: number) => Number(n || 0).toLocaleString()

  const cards = [
    { label: 'Prescriptions', value: num(kpis.total_prescriptions), icon: FileText, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Patients', value: num(kpis.unique_patients), icon: Users, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Doctors', value: num(kpis.unique_doctors), icon: UserCog, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'New Patients', value: num(kpis.new_patients), icon: UserPlus, gradientClass: 'from-orange-500 to-amber-500 shadow-orange-500/20' },
    { label: 'Cancelled', value: num(kpis.cancelled), icon: XCircle, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
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
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Prescription Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                {isToday
                  ? 'Prescribing activity for today'
                  : `Prescribing activity — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
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
                <SelectItem value='last45'>Last 45 days</SelectItem>
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
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8'>
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
                <CardTitle className='text-lg font-bold'>Prescriptions per Day</CardTitle>
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
                  <Bar dataKey='count' fill='#6366f1' name='Prescriptions' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top doctors + top medicines */}
        <div className='grid gap-6 md:grid-cols-2'>
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                  <UserCog className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Top Prescribing Doctors</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>By prescription count in the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {topDoctors.length === 0 ? (
                <p className='py-10 text-center text-sm text-muted-foreground'>No prescriptions in this period.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b bg-muted/40'>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>#</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Doctor</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Prescriptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDoctors.map((doc, idx) => (
                        <tr key={doc.doctor_id} className='border-b last:border-0 hover:bg-muted/30'>
                          <td className='px-4 py-2.5 text-muted-foreground'>{idx + 1}</td>
                          <td className='px-4 py-2.5 font-medium'>{doc.doctor_name}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums'>{num(doc.prescription_count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg'>
                  <Pill className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Top Medicines</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Times prescribed in the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {topMedicines.length === 0 ? (
                <p className='py-10 text-center text-sm text-muted-foreground'>No medicines prescribed in this period.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b bg-muted/40'>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>#</th>
                        <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Medicine</th>
                        <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Times</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMedicines.map((med, idx) => (
                        <tr key={med.medicine_name} className='border-b last:border-0 hover:bg-muted/30'>
                          <td className='px-4 py-2.5 text-muted-foreground'>{idx + 1}</td>
                          <td className='px-4 py-2.5 font-medium'>{med.medicine_name}</td>
                          <td className='px-4 py-2.5 text-right tabular-nums'>{num(med.times_prescribed)}</td>
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
