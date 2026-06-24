import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Printer, FileText, Calendar, DollarSign, Activity } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface CashFlowItem {
  code: string
  name: string
  amount: number
}

interface CashFlowSection {
  items: CashFlowItem[]
  total: number
}

interface CashFlowData {
  operating: CashFlowSection
  investing: CashFlowSection
  financing: CashFlowSection
  opening_cash: number
  closing_cash: number
  net_cash_change: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/cash-flow/')({
  component: CashFlowPage,
})

function CashFlowPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { formatDate } = useDateFormat()

  const from = searchParams?.from || ''
  const to = searchParams?.to || ''

  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom }) })
  }
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo }) })
  }

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow', from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/accounting/cash-flow?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch cash flow data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : {
      data: {
        operating: { items: [], total: 0 },
        investing: { items: [], total: 0 },
        financing: { items: [], total: 0 },
        opening_cash: 0,
        closing_cash: 0,
        net_cash_change: 0
      }
    },
  })

  const cashFlowData: CashFlowData = data?.data || {
    operating: { items: [], total: 0 },
    investing: { items: [], total: 0 },
    financing: { items: [], total: 0 },
    opening_cash: 0,
    closing_cash: 0,
    net_cash_change: 0
  }

  const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Calculate statistics
  const stats = useMemo(() => {
    const operatingItems = cashFlowData.operating?.items?.length || 0
    const investingItems = cashFlowData.investing?.items?.length || 0
    const financingItems = cashFlowData.financing?.items?.length || 0
    const totalItems = operatingItems + investingItems + financingItems

    return [
      { label: 'Opening Cash', value: fmt(cashFlowData.opening_cash), icon: DollarSign, grad: 'from-blue-500 to-blue-600' },
      { label: 'Operating Net', value: fmt(cashFlowData.operating?.total || 0), icon: TrendingUp, grad: 'from-green-500 to-green-600' },
      { label: 'Investing Net', value: fmt(cashFlowData.investing?.total || 0), icon: Wallet, grad: 'from-orange-500 to-orange-600' },
      { label: 'Financing Net', value: fmt(cashFlowData.financing?.total || 0), icon: ArrowRightLeft, grad: 'from-purple-500 to-purple-600' },
      { label: 'Net Cash Change', value: fmt(cashFlowData.net_cash_change), icon: Activity, grad: 'from-teal-500 to-teal-600' },
      { label: 'Closing Cash', value: fmt(cashFlowData.closing_cash), icon: Calendar, grad: 'from-pink-500 to-pink-600' },
    ]
  }, [cashFlowData])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) }; })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
    last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
    last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
    last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
    last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
  }), [])

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom'
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
    return match ? match[0] : 'custom'
  }, [from, to, datePresets])

  const [presetOpen, setPresetOpen] = useState(false)
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key]
    if (p) { setFrom(p.from); setTo(p.to) }
    setPresetOpen(false)
  }

  return (
    <>
      <AppHeader
        title="Cash Flow Report"
        description="Cash inflows and outflows by Operating, Investing, and Financing activities"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-end gap-4 mb-6 bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-1.5">
            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
              <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last15">Last 15 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last45">Last 45 days</SelectItem>
                <SelectItem value="last60">Last 60 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="last180">Last 180 days</SelectItem>
                <SelectItem value="last365">Last 365 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <DateField
              value={from}
              onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <DateField
              value={to}
              onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
              placeholder="To"
            />
            {(from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFrom(''); setTo(''); }}
              >
                Clear
              </Button>
            )}
            <Link
              to="/dashboard/reports/accounting/cash-flow/print"
              search={{
                from: from || undefined,
                to: to || undefined
              }}
            >
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Report Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Operating Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : cashFlowData.operating?.items?.length > 0 ? (
                <>
                  <div className="divide-y">
                    {cashFlowData.operating.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between px-4 py-2 hover:bg-gray-50">
                        <span className="text-sm">{item.name}</span>
                        <span className={`text-sm font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                    <span>Net Cash from Operations</span>
                    <span className={cashFlowData.operating.total >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      {fmt(cashFlowData.operating.total)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">No operating activities found</div>
              )}
            </CardContent>
          </Card>

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Investing Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : cashFlowData.investing?.items?.length > 0 ? (
                <>
                  <div className="divide-y">
                    {cashFlowData.investing.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between px-4 py-2 hover:bg-gray-50">
                        <span className="text-sm">{item.name}</span>
                        <span className={`text-sm font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                    <span>Net Cash from Investing</span>
                    <span className={cashFlowData.investing.total >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      {fmt(cashFlowData.investing.total)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">No investing activities found</div>
              )}
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" /> Financing Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : cashFlowData.financing?.items?.length > 0 ? (
                <>
                  <div className="divide-y">
                    {cashFlowData.financing.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between px-4 py-2 hover:bg-gray-50">
                        <span className="text-sm">{item.name}</span>
                        <span className={`text-sm font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                    <span>Net Cash from Financing</span>
                    <span className={cashFlowData.financing.total >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      {fmt(cashFlowData.financing.total)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">No financing activities found</div>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Summary */}
          <Card className="bg-primary/5 border-primary/20 border-2">
            <CardContent className="py-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Cash Flow Summary</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Opening Cash Balance</span>
                  <span className="font-mono font-medium">{fmt(cashFlowData.opening_cash)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>(+) Operating Activities</span>
                  <span className={`font-mono font-medium ${cashFlowData.operating?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.operating?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>(+) Investing Activities</span>
                  <span className={`font-mono font-medium ${cashFlowData.investing?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.investing?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>(+) Financing Activities</span>
                  <span className={`font-mono font-medium ${cashFlowData.financing?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.financing?.total || 0)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
                  <span>Net Cash Change</span>
                  <span className={`font-mono ${cashFlowData.net_cash_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.net_cash_change)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                  <span>Closing Cash Balance</span>
                  <span className="font-mono text-primary">{fmt(cashFlowData.closing_cash)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
