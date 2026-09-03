import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useQuery } from '@tanstack/react-query'
import { Receipt, Wallet, AlertCircle, CheckCircle2, XCircle, FileText, LayoutDashboard } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Kpis = {
  total_bills: number; total_final_bill: number; total_due: number
  paid_count: number; unpaid_count: number; invoices: number; invoices_total: number
}
type ByType = { type: string; total_bills: number; total_final_bill: number; total_due: number; paid_count: number; unpaid_count: number }

type Props = {
  /** Selected range from the URL (?from=&to=). Empty until the default is written back. */
  from: string
  to: string
  onRangeChange: (from: string, to: string, replace?: boolean) => void
}

export function DoctorBillsDashboardPage({ from, to, onRangeChange }: Props) {
  const { currencySymbol } = useCurrency()
  const todayStr = useMemo(() => toYMD(new Date()), [])

  // Default to Today on first load — the range is always reflected in the URL.
  useEffect(() => {
    if (!from || !to) onRangeChange(todayStr, todayStr, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effFrom = from || todayStr
  const effTo = to || todayStr

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
  const isToday = activePreset === 'today'
  const presetLabel = activePreset !== 'custom' ? datePresets[activePreset as keyof typeof datePresets].label : ''

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
    queryKey: ['doctor-bills-dashboard-stats', effFrom, effTo],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bill-distribution/final/dashboard-stats?from=${encodeURIComponent(effFrom)}&to=${encodeURIComponent(effTo)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch doctor bills dashboard stats')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? {
      data: {
        kpis: { total_bills: 0, total_final_bill: 0, total_due: 0, paid_count: 0, unpaid_count: 0, invoices: 0, invoices_total: 0 },
        byType: [],
        trend: [],
      },
    },
  })

  const d = data?.data
  const kpis: Kpis = d?.kpis ?? { total_bills: 0, total_final_bill: 0, total_due: 0, paid_count: 0, unpaid_count: 0, invoices: 0, invoices_total: 0 }
  const byType: ByType[] = d?.byType || []
  const trend = d?.trend || []

  const num = (n: number) => Number(n || 0).toLocaleString()
  const money = (n: number) => `${currencySymbol} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const cards = [
    { label: 'Total Bills', value: num(kpis.total_bills), icon: Receipt, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Final Bill Amount', value: money(kpis.total_final_bill), icon: Wallet, gradientClass: 'from-indigo-500 to-blue-500 shadow-indigo-500/20' },
    { label: 'Due Amount', value: money(kpis.total_due), icon: AlertCircle, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'Paid', value: num(kpis.paid_count), icon: CheckCircle2, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Unpaid', value: num(kpis.unpaid_count), icon: XCircle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Invoices Issued', value: num(kpis.invoices), icon: FileText, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]

  const byTypeChart = byType.map((t) => ({ name: t.type, amount: t.total_final_bill }))

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
              <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Doctor Bills Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                {isToday
                  ? 'Surgeon, Anesthetist, Assistant & Consultant bills for today'
                  : `Surgeon, Anesthetist, Assistant & Consultant bills — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
              </p>
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
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8'>
          {cards.map((c) => (
            <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />
          ))}
        </div>

        {/* Charts row */}
        <div className='grid gap-6 md:grid-cols-2 mb-8'>
          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                  <FileText className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Invoices Per Day</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Provider payment invoices issued · last 30 days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              <div className='h-[300px] w-full min-w-0'>
                <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                  <BarChart data={trend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey='date' tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval='preserveStartEnd' />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey='invoices' fill='#6366f1' name='Invoices' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
            <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg'>
                  <Wallet className='w-4 h-4 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-bold'>Final Bill Amount by Type</CardTitle>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>Surgeon vs Anesthetist vs Assistant vs Consultant</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-4 pb-6'>
              <div className='h-[300px] w-full min-w-0'>
                {byTypeChart.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No bills in this period.</p>
                ) : (
                  <ResponsiveContainer width='100%' height='100%' minWidth={0}>
                    <BarChart data={byTypeChart} layout='vertical' margin={{ left: 8, right: 24 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type='number' fontSize={11} allowDecimals={false} />
                      <YAxis type='category' dataKey='name' fontSize={11} width={100} />
                      <Tooltip formatter={(value: number) => [money(value)]} />
                      <Bar dataKey='amount' fill='#8b5cf6' name='Final Bill' radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Type */}
        <Card className='overflow-hidden transition-all duration-300 gap-0 shadow-none p-0'>
          <CardHeader className='bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg'>
                <Receipt className='w-4 h-4 text-white' />
              </div>
              <div>
                <CardTitle className='text-lg font-bold'>By Type</CardTitle>
                <p className='text-xs text-gray-600 dark:text-gray-400'>Bills, dues and payment status per provider type</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {isFetching && byType.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>Loading…</p>
            ) : byType.length === 0 ? (
              <p className='py-10 text-center text-sm text-muted-foreground'>No doctor bills in this period.</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>Type</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Total Bills</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Final Bill Amount</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Due Amount</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Paid</th>
                      <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>Unpaid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byType.map((t) => (
                      <tr key={t.type} className='border-b last:border-0 hover:bg-muted/30'>
                        <td className='px-4 py-2.5 font-medium'>{t.type}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums'>{num(t.total_bills)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums'>{money(t.total_final_bill)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400'>{money(t.total_due)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400'>{num(t.paid_count)}</td>
                        <td className='px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400'>{num(t.unpaid_count)}</td>
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
