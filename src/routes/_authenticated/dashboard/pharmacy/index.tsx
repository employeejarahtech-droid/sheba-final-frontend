import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Pill, Boxes, AlertTriangle, Truck, Receipt, PackageCheck, Plus, TrendingUp,
  Clock, ClipboardEdit, Undo2, Users, Wallet, ClipboardList, Timer, LayoutDashboard, Activity,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { useCurrency } from '@/hooks/use-currency'
import { usePharmacyDashboardQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const searchSchema = z.object({
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PharmacyDashboard,
})

function PharmacyDashboard() {
  const { format, currencySymbol } = useCurrency()
  const searchParams: any = Route.useSearch()
  const navigate: any = Route.useNavigate()

  const from = searchParams?.from || ''
  const to = searchParams?.to || ''
  const onRangeChange = (nf: string, nt: string, replace = false) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: nf, to: nt }), replace })

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

  const { data } = usePharmacyDashboardQuery({ from: effFrom, to: effTo })
  const d = data || {
    total_medicines: 0, low_stock_count: 0, active_suppliers: 0, active_categories: 0,
    range_sales_total: 0, range_sales_count: 0, total_stock_in_value: 0, current_stock_value: 0,
    customer_due_total: 0, supplier_due_total: 0,
    expiring_soon_count: 0, recent_sales: [], trend: [],
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        {/* Title (left) + date range filter (right) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Pharmacy Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {isToday
                  ? 'Medicine stock and dispensing overview for today'
                  : `Medicine stock and dispensing overview — ${activePreset === 'custom' ? `${effFrom} to ${effTo}` : presetLabel.toLowerCase()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
              <SelectTrigger className="w-[160px] h-9">
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
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {showCustomFields && (
              <>
                <DateField value={effFrom} onChange={(v: string) => onRangeChange(v, effTo)} placeholder="From" />
                <span className="text-xs text-muted-foreground">to</span>
                <DateField value={effTo} onChange={(v: string) => onRangeChange(effFrom, v)} placeholder="To" />
              </>
            )}
            <Link to="/dashboard/pharmacy/sales/create">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus size={16} /> New Sale
              </button>
            </Link>
          </div>
        </div>

        {/* Sales KPIs — respect the selected date range */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard title="Sales" value={format(d.range_sales_total)} subtitle={isToday ? 'today' : presetLabel.toLowerCase() || 'selected period'} icon={Receipt} gradientClass="from-emerald-500 to-teal-500 shadow-emerald-500/20" />
          <SummaryCard title="Sales Count" value={d.range_sales_count} subtitle={isToday ? 'today' : presetLabel.toLowerCase() || 'selected period'} icon={TrendingUp} gradientClass="from-blue-500 to-indigo-500 shadow-blue-500/20" />
          <SummaryCard title="Total Medicines" value={d.total_medicines} icon={Pill} gradientClass="from-violet-500 to-purple-500 shadow-violet-500/20" />
          <SummaryCard title="Low Stock" value={d.low_stock_count} subtitle="at/under reorder level" icon={AlertTriangle} gradientClass="from-amber-500 to-orange-500 shadow-amber-500/20" />
          <SummaryCard title="Expiring Soon" value={d.expiring_soon_count} subtitle="next 90 days" icon={Clock} gradientClass="from-rose-500 to-red-500 shadow-rose-500/20" />
          <SummaryCard title="Active Suppliers" value={d.active_suppliers} icon={Truck} gradientClass="from-pink-500 to-rose-500 shadow-pink-500/20" />
        </div>

        {/* Stock/financial position — always "as of now", not affected by the date filter above */}
        <p className="mt-6 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Current position (as of today)</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Categories" value={d.active_categories} icon={Boxes} gradientClass="from-blue-500 to-indigo-500 shadow-blue-500/20" />
          <SummaryCard title="Current Stock Value" value={format(d.current_stock_value || 0)} subtitle="at batch cost" icon={TrendingUp} gradientClass="from-emerald-500 to-teal-500 shadow-emerald-500/20" />
          <SummaryCard title="Customer Due" value={format(d.customer_due_total || 0)} subtitle="credit outstanding" icon={Wallet} gradientClass="from-rose-500 to-red-500 shadow-rose-500/20" />
          <SummaryCard title="Supplier Payable" value={format(d.supplier_due_total || 0)} subtitle="owed to vendors" icon={Truck} gradientClass="from-amber-500 to-orange-500 shadow-amber-500/20" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/dashboard/pharmacy/medicines" icon={Pill} title="Medicines" desc="Manage catalog & pricing" />
          <QuickAction to="/dashboard/pharmacy/stock-in" icon={PackageCheck} title="Stock In" desc="Record supplier deliveries" />
          <QuickAction to="/dashboard/pharmacy/sales" icon={Receipt} title="Sales" desc="View & print past sales" />
          <QuickAction to="/dashboard/pharmacy/suppliers" icon={Truck} title="Suppliers" desc="Manage vendors" />
          <QuickAction to="/dashboard/pharmacy/customers" icon={Users} title="Customers" desc="Credit accounts & dues" />
          <QuickAction to="/dashboard/pharmacy/supplier-dues" icon={Wallet} title="Supplier Dues" desc="Payables & payments" />
          <QuickAction to="/dashboard/pharmacy/purchase-orders" icon={ClipboardList} title="Purchase Orders" desc="Order & receive stock" />
          <QuickAction to="/dashboard/pharmacy/shifts" icon={Timer} title="Shifts" desc="POS cash reconciliation" />
          <QuickAction to="/dashboard/pharmacy/expiry-report" icon={Clock} title="Expiry Report" desc="Batches nearing/past expiry" />
          <QuickAction to="/dashboard/pharmacy/stock-adjustments" icon={ClipboardEdit} title="Stock Adjustments" desc="Damage, loss, recount" />
          <QuickAction to="/dashboard/pharmacy/sales-returns" icon={Undo2} title="Sales Returns" desc="Customer returns" />
          <QuickAction to="/dashboard/pharmacy/purchase-returns" icon={Undo2} title="Purchase Returns" desc="Return stock to supplier" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Activity className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Sales Per Day</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">Completed sales · last 30 days</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={d.trend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={11} interval="preserveStartEnd" />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip formatter={(value: number, name: string) => [name === 'amount' ? `${currencySymbol} ${value.toLocaleString()}` : value, name === 'amount' ? 'Amount' : 'Sales']} />
                    <Bar dataKey="count" fill="#6366f1" name="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg"><TrendingUp className="h-4 w-4 text-white" /></div>
                <div><CardTitle className="text-lg font-bold">Recent Sales</CardTitle><CardDescription className="text-xs text-gray-600 dark:text-gray-400">{isToday ? 'Today' : presetLabel.toLowerCase() || `${effFrom} to ${effTo}`}</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {d.recent_sales.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No sales in this period.</p> : (
                <div className="space-y-3">
                  {d.recent_sales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{s.sale_no || `Sale #${s.id}`}</p>
                        <p className="text-sm text-muted-foreground">{s.patient_name || 'Walk-in'} · {format(s.total_amount)}</p>
                      </div>
                      <Badge variant={s.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="text-primary h-5 w-5" /></div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
