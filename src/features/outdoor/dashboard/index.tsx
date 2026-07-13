import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Users, Banknote, Wallet, Percent, AlertCircle, Activity,
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

export function OutdoorDashboardPage() {
  const { currencySymbol } = useCurrency()
  const todayStr = useMemo(() => toYMD(new Date()), [])
  const [from, setFrom] = useState(todayStr)
  const [to, setTo] = useState(todayStr)
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
      thisMonth: { label: 'This Month', from: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toYMD(today()) },
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
    queryKey: ['outdoor-dashboard-stats', from, to],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/dashboard-stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
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
    { label: 'Total Invoices', value: num(kpis.total_invoices), icon: FileText, grad: 'from-blue-600 to-blue-400 shadow-blue-500/30' },
    { label: 'Patients', value: num(kpis.patients), icon: Users, grad: 'from-violet-600 to-violet-400 shadow-violet-500/30' },
    { label: 'Total Bill', value: money(kpis.total_bill), icon: Banknote, grad: 'from-indigo-600 to-indigo-400 shadow-indigo-500/30' },
    { label: 'Collected', value: money(kpis.total_collected), icon: Wallet, grad: 'from-emerald-600 to-emerald-400 shadow-emerald-500/30' },
    { label: 'Discount', value: money(kpis.total_discount), icon: Percent, grad: 'from-amber-600 to-amber-400 shadow-amber-500/30' },
    { label: 'Due', value: money(kpis.total_due), icon: AlertCircle, grad: 'from-rose-600 to-rose-400 shadow-rose-500/30' },
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
        {/* Title + date range */}
        <div className='mb-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Outdoor Dashboard</h1>
              <p className='text-sm text-muted-foreground'>Reception overview for the selected period</p>
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
                <SelectItem value='custom'>Custom range</SelectItem>
              </SelectContent>
            </Select>
            <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder='From' />
            <span className='text-xs text-muted-foreground'>to</span>
            <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder='To' />
            <Button variant='ghost' size='sm' onClick={() => { setFrom(todayStr); setTo(todayStr) }}>Reset</Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
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

        {/* Charts row */}
        <div className='grid gap-6 md:grid-cols-2 mb-8'>
          {/* Billed vs Collected trend (last 30 days, fixed) */}
          <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0'>
            <CardHeader className='bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b py-3 gap-0'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30'>
                  <Activity className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle>Billed vs Collected</CardTitle>
                  <p className='text-xs text-muted-foreground'>Daily totals · last 30 days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
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
          <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-amber-200 hover:shadow-lg py-0'>
            <CardHeader className='bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 border-b py-3 gap-0'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30'>
                  <AlertCircle className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle>Paid vs Unpaid</CardTitle>
                  <p className='text-xs text-muted-foreground'>Invoices in the selected period</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
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
        <Card className='overflow-hidden border-2 transition-all duration-300 hover:border-violet-200 hover:shadow-lg py-0'>
          <CardHeader className='bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-violet-950/30 border-b py-3 gap-0'>
            <div className='flex items-center gap-3'>
              <div className='p-2.5 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl shadow-lg shadow-violet-500/30'>
                <Users className='h-5 w-5 text-white' />
              </div>
              <div>
                <CardTitle>Top Referring Doctors</CardTitle>
                <p className='text-xs text-muted-foreground'>By patient count in the selected period</p>
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
