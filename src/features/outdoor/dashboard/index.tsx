import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Users, Banknote, Wallet, Percent, AlertCircle, Activity, LayoutDashboard,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell,
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#f59e0b']

// Local YYYY-MM-DD (avoid toISOString() UTC off-by-one — same convention as the other pages).
function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Kpis = {
  total_invoices: number; patients: number; total_bill: number;
  total_collected: number; total_discount: number; total_due: number; tests: number;
}

type OutdoorDashboardProps = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

export function OutdoorDashboardPage({ from, to, onRangeChange }: OutdoorDashboardProps) {
  const { currencySymbol } = useCurrency()
  const todayStr = useMemo(() => toYMD(new Date()), [])

  // Default to Today on first load — the range is always reflected in the URL.
  useEffect(() => {
    if (!from || !to) onRangeChange(todayStr, todayStr, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effFrom = from || todayStr
  const effTo = to || todayStr

  // Selecting "Custom" reveals the date pickers even while the current
  // from/to still matches a preset.
  const [customSelected, setCustomSelected] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)

  const token = getCookie('accessToken')

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

  const showCustomFields = customSelected || activePreset === 'custom'
  const presetLabel = activePreset !== 'custom'
    ? datePresets[activePreset as keyof typeof datePresets].label
    : ''
  const isToday = activePreset === 'today'

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

  const { data, isFetching } = useQuery({
    queryKey: ['outdoor-dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch outdoor dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: {
        kpis: { total_invoices: 0, patients: 0, total_bill: 0, total_collected: 0, total_discount: 0, total_due: 0, tests: 0 },
        statusBreakdown: { paid: 0, unpaid: 0 },
        topDoctors: [],
        trend: [],
      },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? { total_invoices: 0, patients: 0, total_bill: 0, total_collected: 0, total_discount: 0, total_due: 0, tests: 0 }
  const money = (n: number) => `${currencySymbol} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const num = (n: number) => Number(n || 0).toLocaleString()

  const cards = [
    { label: 'Total Invoices', value: num(kpis.total_invoices), icon: FileText, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Patients', value: num(kpis.patients), icon: Users, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Total Bill', value: money(kpis.total_bill), icon: Banknote, gradientClass: 'from-indigo-500 to-blue-500 shadow-indigo-500/20' },
    { label: 'Collected', value: money(kpis.total_collected), icon: Wallet, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Discount', value: money(kpis.total_discount), icon: Percent, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Due', value: money(kpis.total_due), icon: AlertCircle, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
  ]

  const pieData = [
    { name: 'Paid', value: Number(d?.statusBreakdown?.paid || 0) },
    { name: 'Unpaid', value: Number(d?.statusBreakdown?.unpaid || 0) },
  ]
  const trend = d?.trend || []
  const topDoctors = d?.topDoctors || []

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
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Outdoor Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                {isToday
                  ? 'Reception overview for today'
                  : `Reception overview — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
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
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
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

        {/* Charts row */}
        <div className='grid gap-6 md:grid-cols-2 mb-8'>
          {/* Billed vs Collected trend — follows the selected date range */}
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                  <Activity className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Billed vs Collected</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Daily totals for the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='h-[300px] w-full min-w-0'>
                <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                  <BarChart data={trend}>
                    <XAxis dataKey='date' tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval='preserveStartEnd' />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='bill' fill='#6366f1' name='Billed' radius={[4, 4, 0, 0]} />
                    <Bar dataKey='collected' fill='#22c55e' name='Collected' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Paid vs Unpaid */}
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg'>
                  <AlertCircle className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Paid vs Unpaid</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Invoices in the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='h-[300px] w-full min-w-0 flex items-center justify-center'>
                <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx='50%' cy='50%'
                      innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey='value'
                      label={(props: any) => `${props.name}: ${props.value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Referring Doctors */}
        <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
          <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                <Users className='w-4 h-4 text-white' />
              </div>
              <div>
                <CardTitle className='text-lg font-bold'>Top Referring Doctors</CardTitle>
                <p className='text-xs text-gray-600 dark:text-gray-400'>By patient count in the selected period</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {isFetching && topDoctors.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>Loading…</p>
            ) : topDoctors.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>No referring doctors in this period.</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>#</th>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Doctor</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Patients</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDoctors.map((doc: any, idx: number) => (
                      <tr key={`${doc.doctor_name}-${idx}`} className='border-b last:border-0 hover:bg-muted/30'>
                        <td className='px-4 py-2.5 text-muted-foreground'>{idx + 1}</td>
                        <td className='px-4 py-2.5 font-medium'>
                          {doc.doctor_name}
                          {doc.qualification ? <span className='text-muted-foreground font-normal'> ({doc.qualification})</span> : null}
                        </td>
                        <td className='px-4 py-2.5 text-right tabular-nums'>{num(doc.patients)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums'>{money(doc.collected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

// ===== Summary Card Component =====
function SummaryCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  gradientClass,
}: {
  title: string
  value: string
  subtitle?: string
  change?: number
  icon: React.ElementType
  gradientClass: string
}) {
  const isPositive = change !== undefined && change >= 0
  return (
    <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border'>
      <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0'>
        <div className='flex items-center gap-2.5'>
          <div
            className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}
          >
            <Icon className='h-4 w-4 text-white' />
          </div>
          <div>
            <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center gap-1 mt-1'>
          {change !== undefined ? (
            <>
              {isPositive ? (
                <ArrowUpRight className='text-emerald-600 h-3 w-3' />
              ) : (
                <ArrowDownRight className='text-red-600 h-3 w-3' />
              )}
              <span
                className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {Math.abs(change)}%
              </span>
              <span className='text-muted-foreground text-xs'>vs yesterday</span>
            </>
          ) : subtitle ? (
            <span className='text-muted-foreground text-xs'>{subtitle}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
