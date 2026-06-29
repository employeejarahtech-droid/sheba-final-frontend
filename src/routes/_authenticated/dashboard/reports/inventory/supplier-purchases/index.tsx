import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Truck, DollarSign, Users, Package, Hash, Printer, ShoppingCart } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { useCan } from '@/hooks/use-can'

interface GrnRow {
  id: number
  grn_no: string
  supplier_name: string
  request_no: string
  invoice_no: string
  received_date: string
  total_amount: number
  status: string
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/supplier-purchases/')({
  component: SupplierPurchasesPage,
})

function SupplierPurchasesPage() {
    const can = useCan();
    const canEdit = can('reports.inventory.supplier-purchases.edit');
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
    queryKey: ['report-supplier-purchases', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), limit: String(limit), search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase/goods-receipt?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch goods receipts')
      const json = await res.json()
      const rows = json?.data?.rows || []
      const items: GrnRow[] = rows.map((r: any) => ({
        id: r.id,
        grn_no: r.grn_no,
        supplier_name: r.supplier?.name || '-',
        request_no: r.request?.request_no || '-',
        invoice_no: r.invoice_no || '-',
        received_date: r.received_date,
        total_amount: Number(r.total_amount || 0),
        status: r.status,
      }))
      return { items, total: json?.data?.total || 0 }
    },
    enabled: !!token,
    placeholderData: (prev) => prev ?? { items: [], total: 0 },
  })

  const items: GrnRow[] = data?.items || []
  const total = data?.total || 0
  const meta = { total, page, limit }

  const stats = useMemo(() => {
    const totalAmount = items.reduce((s, i) => s + Number(i.total_amount || 0), 0)
    const uniqueSuppliers = new Set(items.map((i) => i.supplier_name).filter((n) => n && n !== '-')).size
    const received = items.filter((i) => i.status === 'received').length
    const pending = items.filter((i) => i.status !== 'received').length
    const avg = items.length > 0 ? totalAmount / items.length : 0
    return [
      { label: 'Total GRNs', value: total, icon: ShoppingCart },
      { label: `Total Amount (${currencySymbol})`, value: totalAmount.toLocaleString(), icon: DollarSign },
      { label: 'Unique Suppliers', value: uniqueSuppliers, icon: Users },
      { label: 'Fully Received', value: received, icon: Package },
      { label: 'Partial / Pending', value: pending, icon: Truck },
      { label: `Avg. GRN (${currencySymbol})`, value: avg.toFixed(2), icon: Hash },
    ]
  }, [items, total, currencySymbol])

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const datePresets = useMemo(() => ({
    today: { from: toYMD(today()), to: toYMD(today()) },
    last7: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d })()), to: toYMD(today()) },
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

  const COLORS = ['#10B981', '#3B82F6', '#F97316', '#14B8A6', '#EC4899', '#F59E0B']
  const STATUS_BADGE: Record<string, string> = {
    received: 'bg-green-100 text-green-700 border-green-200',
    partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const columns = [
    { data: 'grn_no', title: 'GRN No', render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>` },
    { data: 'supplier_name', title: 'Supplier', render: (d: any) => `<span class="font-medium">${d || '-'}</span>` },
    { data: 'request_no', title: 'Against Request', render: (d: any) => d || '-' },
    { data: 'invoice_no', title: 'Invoice', render: (d: any) => d || '-' },
    { data: 'received_date', title: 'Received Date', render: (d: any) => (d ? formatDate(new Date(d)) : '-') },
    { data: 'total_amount', title: `Amount (${currencySymbol})`, render: (d: any) => `<span class="font-semibold text-emerald-700 font-mono text-sm">${Number(d || 0).toFixed(2)}</span>` },
    { data: 'status', title: 'Status', render: (d: any) => `<span class="px-3 py-1 rounded-full text-xs font-semibold capitalize border ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-700'}">${d || '-'}</span>` },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: GrnRow) =>
        `${canEdit ? `<a href="/dashboard/purchase/goods-receipt/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">View / Edit</a>` : ''}`,
    },
  ]

  return (
    <>
      <AppHeader title="Supplier Purchases Report" description="Goods received from suppliers (from Purchase Management)" fixed />
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
          tableTitle="Supplier Purchases List"
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
                  <SelectItem value="last7">Last 7 days</SelectItem>
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
              <Link to="/dashboard/reports/inventory/supplier-purchases/print" search={{ search: search || undefined, start_date: from || undefined, end_date: to || undefined }}>
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><Printer className="w-4 h-4 mr-2" />Print Report</Button>
              </Link>
            </div>
          }
        />
      </main>
    </>
  )
}
