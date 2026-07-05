import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, TrendingUp, DollarSign, BarChart3, Printer, FileText } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface OutdoorInvoiceItem {
  id: number
  invoice_prefix?: string | null
  patient_name: string
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
  revenue: number
  collected: number
  discount: number
  due: number
}

const categoryWiseRevenueSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/outdoor/category-wise-revenue/')({
  validateSearch: (search) => categoryWiseRevenueSearchSchema.parse(search),
  component: CategoryWiseRevenuePage,
})

function CategoryWiseRevenuePage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();
  const { currencySymbol } = useCurrency();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['category-wise-revenue', page, limit, search, from, to],
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
      if (!res.ok) throw new Error('Failed to fetch outdoor invoice data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: OutdoorInvoiceItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Group data by department
  const grouped = useMemo(() => {
    const map: Record<string, GroupedData> = {}
    for (const item of items) {
      const dept = item.selected_tests?.[0]?.test?.category?.name || 'Unknown'
      if (!map[dept]) map[dept] = { department: dept, count: 0, revenue: 0, collected: 0, discount: 0, due: 0 }
      map[dept].count += 1
      map[dept].revenue += Number(item.total_amount || 0)
      map[dept].collected += Number(item.total_paid || 0)
      map[dept].discount += Number(item.discount || 0)
      map[dept].due += Number(item.total_amount || 0) - Number(item.total_paid || 0)
    }
    return Object.values(map)
  }, [items])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCategories = grouped.length
    const totalRevenue = grouped.reduce((s, d) => s + d.revenue, 0)
    const totalCollected = grouped.reduce((s, d) => s + d.collected, 0)
    const totalDiscount = grouped.reduce((s, d) => s + d.discount, 0)
    const avg = totalCategories > 0 ? Math.round(totalRevenue / totalCategories) : 0

    return [
      { label: 'Total Categories', value: totalCategories, icon: PieChart, grad: 'from-green-500 to-green-600' },
      { label: 'Total Revenue', value: `${currencySymbol} ${totalRevenue.toLocaleString()}`, icon: TrendingUp, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Collected', value: `${currencySymbol} ${totalCollected.toLocaleString()}`, icon: DollarSign, grad: 'from-orange-500 to-orange-600' },
      { label: 'Total Discount', value: `${currencySymbol} ${totalDiscount.toLocaleString()}`, icon: BarChart3, grad: 'from-pink-500 to-pink-600' },
      { label: 'Avg per Category', value: `${currencySymbol} ${avg.toLocaleString()}`, icon: DollarSign, grad: 'from-teal-500 to-teal-600' },
      { label: 'Records in Page', value: grouped.length, icon: BarChart3, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [grouped, currencySymbol])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
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
  }), []);

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to, datePresets]);

  const [presetOpen, setPresetOpen] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  const columns = [
    {
      data: "department",
      title: "Category / Department",
      orderable: true,
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "count",
      title: "Total Invoices",
      render: (data: number) => `<span class="font-semibold text-blue-600">${data.toLocaleString()}</span>`,
    },
    {
      data: "revenue",
      title: `Total Revenue (${currencySymbol})`,
      className: "text-right",
      render: (data: number) => `<span class="font-semibold text-green-600">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: "collected",
      title: `Total Collected (${currencySymbol})`,
      className: "text-right",
      render: (data: number) => `<span class="font-semibold text-blue-600">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: "discount",
      title: `Total Discount (${currencySymbol})`,
      className: "text-right",
      render: (data: number) => `<span class="font-semibold text-red-600">${Number(data || 0).toLocaleString()}</span>`,
    },
    {
      data: "due",
      title: `Total Due (${currencySymbol})`,
      className: "text-right",
      render: (data: number) => {
        const due = Number(data || 0)
        const colorClass = due > 0 ? 'text-red-600' : 'text-emerald-600'
        return `<span class="font-semibold ${colorClass}">${due.toLocaleString()}</span>`
      },
    },
    {
      data: null,
      title: "Collection Rate %",
      render: (_data: any, _type: string, row: GroupedData) => {
        const rate = row.revenue > 0 ? ((row.collected / row.revenue) * 100).toFixed(1) : '0.0'
        const color = parseFloat(rate) >= 80 ? 'text-green-600' : parseFloat(rate) >= 50 ? 'text-yellow-600' : 'text-red-600'
        return `<span class="font-semibold ${color}">${rate}%</span>`
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: GroupedData) => {
        return `<div class="flex gap-2">
          <a href="/dashboard/reports/outdoor/category-wise-revenue/print"
             class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Category-wise Revenue Report"
        description="Outdoor revenue breakdown grouped by department/category with filtering and statistics"
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

        <DataTable
          tableTitle="Category-wise Revenue List"
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
                  onClick={() => { setFrom(""); setTo(""); }}
                >
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/outdoor/category-wise-revenue/print"
                search={{
                  search: search || undefined,
                  start_date: from || undefined,
                  end_date: to || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No outdoor invoice records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
