import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, CheckCircle2, Wrench, TrendingDown, Printer, Box, DollarSign } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'

interface StockItem {
  id: number
  asset_code: string
  name: string
  category: string
  location: string
  condition: string
  purchase_cost: number
  status: string
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/stock-report/')({
  component: StockReportPage,
})

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6']
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_repair: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  retired: 'bg-gray-100 text-gray-600 border-gray-200',
  disposed: 'bg-red-100 text-red-700 border-red-200',
}

function StockReportPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { formatDate } = useDateFormat()
  const { currencySymbol } = useCurrency()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ''
  const from = searchParams?.from || ''
  const to = searchParams?.to || ''

  const setPage = (v: number) => navigate({ to: '.', search: (p: any) => ({ ...p, page: v }) })
  const setLimit = (v: number) => navigate({ to: '.', search: (p: any) => ({ ...p, limit: v, page: 1 }) })
  const setSearch = (v: string) => navigate({ to: '.', search: (p: any) => ({ ...p, search: v, page: 1 }) })
  const setFrom = (v: string) => navigate({ to: '.', search: (p: any) => ({ ...p, from: v, page: 1 }) })
  const setTo = (v: string) => navigate({ to: '.', search: (p: any) => ({ ...p, to: v, page: 1 }) })

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['report-stock', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), limit: String(limit), search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch assets')
      const json = await res.json()
      const rows = json?.data?.rows || []
      const items: StockItem[] = rows.map((r: any) => ({
        id: r.id, asset_code: r.asset_code, name: r.name,
        category: r.category?.name || '-', location: r.location?.name || '-',
        condition: r.condition, purchase_cost: Number(r.purchase_cost || 0), status: r.status,
      }))
      return { items, total: json?.data?.total || 0 }
    },
    enabled: !!token,
    placeholderData: (prev) => prev ?? { items: [], total: 0 },
  })

  const items: StockItem[] = data?.items || []
  const total = data?.total || 0
  const meta = { total, page, limit }

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === 'active').length
    const inRepair = items.filter((i) => i.status === 'in_repair').length
    const retired = items.filter((i) => i.status === 'retired' || i.status === 'disposed').length
    const totalValue = items.reduce((s, i) => s + Number(i.purchase_cost || 0), 0)
    return [
      { label: 'Total Assets', value: total, icon: Package },
      { label: 'Active', value: active, icon: CheckCircle2 },
      { label: 'In Repair', value: inRepair, icon: Wrench },
      { label: 'Retired / Disposed', value: retired, icon: TrendingDown },
      { label: 'This Page', value: items.length, icon: Box },
      { label: `Value (${currencySymbol})`, value: totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: DollarSign },
    ]
  }, [items, total, currencySymbol])

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const datePresets = useMemo(() => ({
    today: { from: toYMD(today()), to: toYMD(today()) },
    last30: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d })()), to: toYMD(today()) },
    last90: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d })()), to: toYMD(today()) },
    last365: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d })()), to: toYMD(today()) },
  } as Record<string, { from: string; to: string }>), [])
  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom'
    const m = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
    return m ? m[0] : 'custom'
  }, [from, to, datePresets])
  const [presetOpen, setPresetOpen] = useState(false)
  const applyPreset = (key: string) => { const p = datePresets[key]; if (p) { setFrom(p.from); setTo(p.to) } setPresetOpen(false) }

  const columns = [
    { data: null, title: '#', orderable: false, render: (_: any, __: string, ___: any, m: any) => m.row + 1 + (page - 1) * limit, defaultContent: '' },
    { data: 'asset_code', title: 'Asset Code', render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>` },
    { data: 'name', title: 'Asset Name', render: (d: any) => `<span class="font-medium text-gray-800">${d || '-'}</span>` },
    { data: 'category', title: 'Category', render: (d: any) => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">${d || '-'}</span>` },
    { data: 'location', title: 'Location', render: (d: any) => d || '-' },
    { data: 'condition', title: 'Condition', render: (d: any) => `<span class="capitalize">${d || '-'}</span>` },
    { data: 'purchase_cost', title: `Cost (${currencySymbol})`, render: (d: any) => `<span class="font-bold text-green-600">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
    { data: 'status', title: 'Status', render: (d: any) => `<span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-600 border-gray-200'}">${String(d || '-').replace('_', ' ')}</span>` },
  ]

  return (
    <>
      <AppHeader title="Stock Report" description="Asset register stock levels, valuation and status (from Asset Management)" fixed />
      <main className="">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: COLORS[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg"><Icon className="w-4 h-4" style={{ color: COLORS[index % 6] }} /></div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4"><p className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p></CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Asset Stock List"
          columns={columns}
          data={items}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
            <div className="flex items-center gap-1.5">
              <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Filter by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last365">Last 365 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
              {(from || to) && <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>Clear</Button>}
              <Link to="/dashboard/reports/inventory/stock-report/print" search={{ search: search || undefined, start_date: from || undefined, end_date: to || undefined }}>
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><Printer className="w-4 h-4 mr-2" />Print Report</Button>
              </Link>
            </div>
          }
        />
      </main>
    </>
  )
}
