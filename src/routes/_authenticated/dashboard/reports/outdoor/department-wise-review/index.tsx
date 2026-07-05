import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, TrendingUp, DollarSign, BarChart3, Printer, FileText } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { z } from 'zod'

interface OutdoorInvoiceItem {
  id: number
  total_amount?: number
  net_amount?: number
  total_paid?: number
  discount?: number
  created_at: string
  selected_tests?: any[]
  [key: string]: any
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface GroupedData {
  department: string
  count: number
  bill: number
  collected: number
  discount: number
  due: number
}

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/outdoor/department-wise-review/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: DepartmentWiseReviewPage,
})

function DepartmentWiseReviewPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { currencySymbol } = useCurrency()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ''
  const from = searchParams?.from || ''
  const to = searchParams?.to || ''

  const setPage = (p: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: p }) })
  const setLimit = (l: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: l, page: 1 }) })
  const setSearch = (s: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: s, page: 1 }) })
  const setFrom = (f: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: f, page: 1 }) })
  const setTo = (t: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, to: t, page: 1 }) })

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['department-wise-review', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch department-wise review')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  // Fetch departments to resolve department_id → name
  const { data: deptData } = useQuery({
    queryKey: ['departments-list-dwr'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/department?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch departments')
      return res.json()
    },
    enabled: !!token,
  })
  const deptMap = useMemo(() => {
    const list: any[] = deptData?.data?.items || deptData?.data || []
    const m: Record<string, string> = {}
    for (const d of list) m[String(d.id)] = d.name
    return m
  }, [deptData])

  const allItems: OutdoorInvoiceItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Group by department (first test's category name)
  const grouped = useMemo(() => {
    const map: Record<string, GroupedData> = {}
    for (const item of allItems) {
      const deptId = item.selected_tests?.[0]?.test?.category?.department_id
      const dept = (deptId != null && deptMap[String(deptId)]) || 'Unassigned'
      if (!map[dept]) map[dept] = { department: dept, count: 0, bill: 0, collected: 0, discount: 0, due: 0 }
      map[dept].count += 1
      map[dept].bill += Number(item.total_amount || 0)
      map[dept].collected += Number(item.total_paid || 0)
      map[dept].discount += Number(item.discount || 0)
      map[dept].due += Number(item.total_amount || 0) - Number(item.total_paid || 0)
    }
    return Object.values(map)
  }, [allItems, deptMap])

  // Statistics
  const stats = useMemo(() => {
    const totalDepts = grouped.length
    const totalBill = grouped.reduce((s, d) => s + d.bill, 0)
    const totalCollected = grouped.reduce((s, d) => s + d.collected, 0)
    const totalDue = grouped.reduce((s, d) => s + d.due, 0)
    return [
      { label: 'Total Departments', value: totalDepts, icon: Building2 },
      { label: 'Total Revenue', value: `${currencySymbol} ${totalBill.toLocaleString()}`, icon: TrendingUp },
      { label: 'Total Collected', value: `${currencySymbol} ${totalCollected.toLocaleString()}`, icon: DollarSign },
      { label: 'Total Due', value: `${currencySymbol} ${totalDue.toLocaleString()}`, icon: BarChart3 },
    ]
  }, [grouped, currencySymbol])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { from: toYMD(d), to: toYMD(d) } })(),
    last7: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d })()), to: toYMD(today()) },
    last15: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d })()), to: toYMD(today()) },
    last30: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d })()), to: toYMD(today()) },
    last45: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d })()), to: toYMD(today()) },
    last60: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d })()), to: toYMD(today()) },
    last90: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d })()), to: toYMD(today()) },
    last180: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d })()), to: toYMD(today()) },
    last365: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d })()), to: toYMD(today()) },
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

  const columns = [
    {
      data: 'department',
      title: 'Department',
      render: (data: string) => `<div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <span class="font-medium">${data || '-'}</span>
      </div>`,
    },
    {
      data: 'count',
      title: 'Invoices',
      className: 'text-right',
      render: (data: number) => `<span class="font-semibold text-blue-600">${Number(data || 0)}</span>`,
    },
    {
      data: 'bill',
      title: `Total Bill (${currencySymbol})`,
      className: 'text-right',
      render: (data: number) => `<span class="font-semibold text-gray-700">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: 'collected',
      title: `Collected (${currencySymbol})`,
      className: 'text-right',
      render: (data: number) => `<span class="font-semibold text-green-600">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: 'discount',
      title: `Discount (${currencySymbol})`,
      className: 'text-right',
      render: (data: number) => `<span class="font-semibold text-orange-600">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: 'due',
      title: `Due (${currencySymbol})`,
      className: 'text-right',
      render: (data: number) => {
        const due = Number(data || 0)
        const cls = due > 0 ? 'text-red-600' : 'text-emerald-600'
        return `<span class="font-semibold ${cls}">${due.toLocaleString()}</span>`
      },
    },
    {
      data: null,
      title: 'Collection Rate (%)',
      className: 'text-right',
      render: (_d: any, _t: string, row: GroupedData) => {
        const rate = row.bill > 0 ? ((row.collected / row.bill) * 100).toFixed(1) : '0.0'
        const color = parseFloat(rate) >= 80 ? 'text-green-600' : parseFloat(rate) >= 50 ? 'text-orange-500' : 'text-red-500'
        return `<span class="font-semibold ${color}">${rate}%</span>`
      },
    },
  ]

  const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

  return (
    <>
      <AppHeader
        title="Department Wise Review"
        description="Outdoor invoice review grouped by department with revenue, collection, and due breakdown"
        fixed
      />

      <main className="">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: COLORS[index % 4] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: COLORS[index % 4] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Department Wise Review"
          columns={columns}
          data={grouped}
          meta={{ total: grouped.length, page, limit, totalPages: 1 }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
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
              <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
              {(from || to) && (
                <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>Clear</Button>
              )}
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No department records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
