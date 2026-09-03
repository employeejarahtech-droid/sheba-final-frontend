import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { FileText, Users, Bone, Monitor, HeartPulse, Activity, LayoutDashboard } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Kpis = { total_reports: number; invoices: number; patients: number; xray: number; ultrasonogram: number; ecg: number }

type Props = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

const ALL_TIME_FROM = '2000-01-01'

export function DiagnosticsDashboardPage({ from, to, onRangeChange }: Props) {
  const todayStr = useMemo(() => toYMD(new Date()), [])

  // Default to "All Time" so the By Test table shows every test with its
  // complete/incomplete status — same convention as the Pathology Dashboard.
  useEffect(() => {
    if (!from || !to) onRangeChange(ALL_TIME_FROM, todayStr, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effFrom = from || ALL_TIME_FROM
  const effTo = to || todayStr

  // Selecting "Custom" reveals the date pickers even while the current
  // from/to still matches a preset.
  const [customSelected, setCustomSelected] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [testPage, setTestPage] = useState(1)
  const [testLimit, setTestLimit] = useState(10)

  // Reset to the first page whenever the date range changes.
  useEffect(() => { setTestPage(1) }, [effFrom, effTo])

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
      allTime: { label: 'All Time', from: ALL_TIME_FROM, to: toYMD(today()) },
    } as const)
  }, [])

  const activePreset = useMemo(() => {
    const match = Object.entries(datePresets).find(([, v]) => v.from === effFrom && v.to === effTo)
    return match ? match[0] : 'custom'
  }, [effFrom, effTo, datePresets])

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

  const { data, isFetching } = useQuery({
    queryKey: ['diagnostics-dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/diagnostics-dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch diagnostics dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: { kpis: { total_reports: 0, invoices: 0, patients: 0, xray: 0, ultrasonogram: 0, ecg: 0 }, byModule: [], trend: [] },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? { total_reports: 0, invoices: 0, patients: 0, xray: 0, ultrasonogram: 0, ecg: 0 }
  const num = (n: number) => Number(n || 0).toLocaleString()

  const byModule = (d?.byModule || []).map((r: any) => ({
    name: r.module,
    total: Number(r.total) || 0,
    invoices: Number(r.invoices) || 0,
  }))
  const trend = d?.trend || []

  // "By Test" paginated table — mirrors the Pathology Dashboard's, but grouped
  // by module (X-Ray / Ultrasonogram / ECG) instead of test category, since
  // these three modules don't share a department breakdown.
  const { data: byTestData, isFetching: byTestFetching } = useQuery({
    queryKey: ['diagnostics-by-test', effFrom, effTo, testPage, testLimit],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/diagnostics-by-test?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}&page=${testPage}&limit=${testLimit}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch diagnostics by-test')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? { data: { items: [], meta: { total: 0, page: testPage, limit: testLimit } } },
  })
  const byTestItems = byTestData?.data?.items || []
  const byTestMeta = byTestData?.data?.meta || { total: 0, page: testPage, limit: testLimit }
  const byTestTotalPages = Math.max(1, Math.ceil((byTestMeta.total || 0) / (byTestMeta.limit || testLimit)))

  const cards = [
    { label: 'Total Reports', value: num(kpis.total_reports), icon: Activity, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Invoices', value: num(kpis.invoices), icon: FileText, gradientClass: 'from-indigo-500 to-blue-500 shadow-indigo-500/20' },
    { label: 'Patients', value: num(kpis.patients), icon: Users, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'X-Ray', value: num(kpis.xray), icon: Bone, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Ultrasonogram', value: num(kpis.ultrasonogram), icon: Monitor, gradientClass: 'from-teal-500 to-emerald-500 shadow-teal-500/20' },
    { label: 'ECG', value: num(kpis.ecg), icon: HeartPulse, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
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
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Diagnostics Dashboard</h1>
              <p className='text-sm text-muted-foreground'>X-Ray, Ultrasonogram & ECG volume for the selected period</p>
            </div>
          </div>

          <div className='flex items-center gap-1.5'>
            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
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
                <SelectItem value='allTime'>All Time</SelectItem>
                <SelectItem value='custom'>Custom range</SelectItem>
              </SelectContent>
            </Select>
            {showCustomFields && (
              <>
                <DateField value={effFrom} onChange={(v: string) => onRangeChange(v, effTo)} placeholder='From' />
                <span className='text-xs text-muted-foreground'>to</span>
                <DateField value={effTo} onChange={(v: string) => onRangeChange(effFrom, v)} placeholder='To' />
              </>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4'>
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

        {/* Charts row: trend + by-module breakdown */}
        <div className='grid gap-6 md:grid-cols-2 mb-4'>
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                  <Activity className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Reports Per Day</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>X-Ray + Ultrasonogram + ECG · last 30 days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              <div className='h-[340px] w-full min-w-0'>
                <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                  <BarChart data={trend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey='date' tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval='preserveStartEnd' />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey='reports' fill='#6366f1' name='Reports' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                  <Monitor className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Reports by Module</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>X-Ray vs Ultrasonogram vs ECG</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              <div className='h-[340px] w-full min-w-0'>
                {byModule.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No reports in this period.</p>
                ) : (
                  <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                    <BarChart data={byModule} layout='vertical' margin={{ left: 8, right: 24 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type='number' fontSize={11} allowDecimals={false} />
                      <YAxis type='category' dataKey='name' fontSize={11} width={110} />
                      <Tooltip />
                      <Bar dataKey='total' fill='#8b5cf6' name='Reports' radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Test */}
        <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
          <CardHeader className='bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg'>
                <FileText className='w-4 h-4 text-white' />
              </div>
              <div>
                <CardTitle className='text-lg font-bold'>By Test</CardTitle>
                <p className='text-xs text-gray-600 dark:text-gray-400'>Test orders with completion status</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {byTestFetching && byTestItems.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>Loading…</p>
            ) : byTestItems.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>No diagnostics tests in this period.</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>SL</th>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Test</th>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Module</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Total Count</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Incompleted</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byTestItems.map((tst: any, idx: number) => (
                      <tr key={`${tst.name}-${idx}`} className='border-b last:border-0 hover:bg-muted/30'>
                        <td className='px-4 py-2.5 text-muted-foreground'>{(testPage - 1) * testLimit + idx + 1}</td>
                        <td className='px-4 py-2.5 font-medium'>{tst.name}</td>
                        <td className='px-4 py-2.5 text-muted-foreground'>{tst.module || '—'}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums'>{num(tst.total)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400'>{num(tst.incompleted)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400'>{num(tst.completed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>Rows per page</span>
                    <Select value={String(testLimit)} onValueChange={(v) => { setTestLimit(Number(v)); setTestPage(1) }}>
                      <SelectTrigger className='h-8 w-[70px]'><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='25'>25</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className='text-muted-foreground'>· {byTestMeta.total} tests</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' disabled={testPage <= 1 || byTestFetching} onClick={() => setTestPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <span className='text-muted-foreground'>Page {testPage} of {byTestTotalPages}</span>
                    <Button variant='outline' size='sm' disabled={testPage >= byTestTotalPages || byTestFetching} onClick={() => setTestPage((p) => Math.min(byTestTotalPages, p + 1))}>Next</Button>
                  </div>
                </div>
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
