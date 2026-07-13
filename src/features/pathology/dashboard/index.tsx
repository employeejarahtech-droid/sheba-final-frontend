import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { FlaskConical, FileText, Users, Layers, Activity, Beaker } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Turn a raw tests.match_table_name (e.g. "biochemical_all", "urine_re", "cbc")
// into a readable "Test Report Template" label.
const ACRONYMS = new Set(['CBC', 'PBF', 'RE', 'USG', 'ECG', 'TSH', 'BTCT', 'TCDC', 'HCG', 'MT', 'OBT'])
function prettyTemplate(t?: string | null) {
  if (!t) return '—'
  return t
    .split('_')
    .map((w) => {
      const up = w.toUpperCase()
      if (ACRONYMS.has(up)) return up
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

type Kpis = { total_tests: number; invoices: number; patients: number; templates: number }

export function PathologyDashboardPage() {
  const todayStr = useMemo(() => toYMD(new Date()), [])
  // Default to "All Time" so the By Test table shows every test with its
  // complete/incomplete status (matching the individual lab pages), not just today's.
  const [from, setFrom] = useState('2000-01-01')
  const [to, setTo] = useState(todayStr)
  const [presetOpen, setPresetOpen] = useState(false)
  const [testPage, setTestPage] = useState(1)
  const [testLimit, setTestLimit] = useState(10)

  // Reset to the first page whenever the date range changes.
  useEffect(() => { setTestPage(1) }, [from, to])

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
      thisMonth: { label: 'This Month', from: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toYMD(today()) },
      allTime: { label: 'All Time', from: '2000-01-01', to: toYMD(today()) },
    } as const)
  }, [])

  const activePreset = useMemo(() => {
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
    return match ? match[0] : 'custom'
  }, [from, to, datePresets])

  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key]
    if (p) { setFrom(p.from); setTo(p.to) }
    setPresetOpen(false)
  }

  const { data, isFetching } = useQuery({
    queryKey: ['pathology-dashboard-stats', from, to],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/pathology-dashboard-stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch pathology dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: { kpis: { total_tests: 0, invoices: 0, patients: 0, templates: 0 }, byTemplate: [], trend: [] },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? { total_tests: 0, invoices: 0, patients: 0, templates: 0 }
  const num = (n: number) => Number(n || 0).toLocaleString()
  const avgPerInvoice = kpis.invoices > 0 ? (kpis.total_tests / kpis.invoices).toFixed(1) : '0'

  const byTemplate = (d?.byTemplate || []).map((r: any) => ({
    name: prettyTemplate(r.template),
    invoices: Number(r.invoices) || 0,
    items: Number(r.items) || 0,
  }))
  const trend = d?.trend || []

  // "By Test" paginated table — separate endpoint so it can paginate and carry
  // completion status (completed / incompleted) read from the lab tables.
  const { data: byTestData, isFetching: byTestFetching } = useQuery({
    queryKey: ['pathology-by-test', from, to, testPage, testLimit],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/pathology-by-test?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page=${testPage}&limit=${testLimit}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch pathology by-test')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? { data: { items: [], meta: { total: 0, page: testPage, limit: testLimit } } },
  })
  const byTestItems = byTestData?.data?.items || []
  const byTestMeta = byTestData?.data?.meta || { total: 0, page: testPage, limit: testLimit }
  const byTestTotalPages = Math.max(1, Math.ceil((byTestMeta.total || 0) / (byTestMeta.limit || testLimit)))

  const cards = [
    { label: 'Total Tests', value: num(kpis.total_tests), icon: FlaskConical, grad: 'from-blue-600 to-blue-400 shadow-blue-500/30' },
    { label: 'Invoices', value: num(kpis.invoices), icon: FileText, grad: 'from-indigo-600 to-indigo-400 shadow-indigo-500/30' },
    { label: 'Patients', value: num(kpis.patients), icon: Users, grad: 'from-violet-600 to-violet-400 shadow-violet-500/30' },
    { label: 'Report Templates', value: num(kpis.templates), icon: Layers, grad: 'from-teal-600 to-teal-400 shadow-teal-500/30' },
    { label: 'Top Template', value: byTemplate[0]?.name || '—', icon: Beaker, grad: 'from-amber-600 to-amber-400 shadow-amber-500/30' },
    { label: 'Avg / Invoice', value: avgPerInvoice, icon: Activity, grad: 'from-rose-600 to-rose-400 shadow-rose-500/30' },
  ]

  return (
    <>
      <AppHeader fixed />
      <Main>
        {/* Title + date range */}
        <div className='mb-4 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Pathology Dashboard</h1>
              <p className='text-sm text-muted-foreground'>Lab test volume by report template & test for the selected period</p>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
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
                <SelectItem value='thisMonth'>This Month</SelectItem>
                <SelectItem value='allTime'>All Time</SelectItem>
                <SelectItem value='custom'>Custom range</SelectItem>
              </SelectContent>
            </Select>
            <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder='From' />
            <span className='text-xs text-muted-foreground'>to</span>
            <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder='To' />
            <Button variant='ghost' size='sm' onClick={() => { setFrom('2000-01-01'); setTo(todayStr) }}>Reset</Button>
          </div>
        </div>

        {/* KPI cards (counts only) */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4'>
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5`}>
                <div className='absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-2xl' />
                <div className='absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-black/10 blur-2xl' />
                <div className='relative'>
                  <div className='rounded-xl bg-white/20 p-2 inline-block backdrop-blur-sm'>
                    <Icon className='h-5 w-5 text-white' />
                  </div>
                  <p className='mt-3 text-[11px] font-medium text-white/80 uppercase tracking-wider'>{c.label}</p>
                  <h3 className='text-lg font-bold text-white truncate' title={c.value}>{c.value}</h3>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts row: trend + invoices by template */}
        <div className='grid gap-6 md:grid-cols-2 mb-4'>
          {/* Tests per day (30-day trend) */}
          <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0'>
            <CardHeader className='bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b py-3 gap-0'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30'>
                  <Activity className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle>Tests Per Day</CardTitle>
                  <p className='text-xs text-muted-foreground'>Pathology tests ordered · last 30 days</p>
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
                    <Bar dataKey='tests' fill='#6366f1' name='Tests' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Invoices by Test Report Template */}
          <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-violet-200 hover:shadow-lg py-0'>
            <CardHeader className='bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-violet-950/30 border-b py-3 gap-0'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl shadow-lg shadow-violet-500/30'>
                  <Layers className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle>Invoices by Test Report Template</CardTitle>
                  <p className='text-xs text-muted-foreground'>Distinct invoices per report template</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              <div className='h-[340px] w-full min-w-0'>
                {byTemplate.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No templates in this period.</p>
                ) : (
                  <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                    <BarChart data={byTemplate} layout='vertical' margin={{ left: 8, right: 24 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type='number' fontSize={11} allowDecimals={false} />
                      <YAxis type='category' dataKey='name' fontSize={11} width={130} />
                      <Tooltip />
                      <Bar dataKey='invoices' fill='#8b5cf6' name='Invoices' radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Test */}
        <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg py-0'>
          <CardHeader className='bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-950/30 border-b py-3 gap-0'>
            <div className='flex items-center gap-3'>
              <div className='p-2.5 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30'>
                <FlaskConical className='h-5 w-5 text-white' />
              </div>
              <div>
                <CardTitle>By Test</CardTitle>
                <p className='text-xs text-muted-foreground'>Test orders with completion status</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {byTestFetching && byTestItems.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>Loading…</p>
            ) : byTestItems.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>No pathology tests in this period.</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>SL</th>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Test</th>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Category</th>
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
                        <td className='px-4 py-2.5 text-muted-foreground'>{tst.category || '—'}</td>
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
