import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Users, DollarSign, Banknote, Printer, FileText, Calendar } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface DoctorItem {
  doctor_name?: string
  name?: string
  patient_count: number
  total_bill: number
  total_collected: number
  total_discount: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const doctorWiseCollectionSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/outdoor/doctor-wise-collection/')({
  validateSearch: (search) => doctorWiseCollectionSearchSchema.parse(search),
  component: DoctorWiseCollectionReport,
})

function DoctorWiseCollectionReport() {
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
    queryKey: ['outdoor-doctor-wise-collection', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/doctor-wise-collection?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch doctor-wise collection')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: DoctorItem[] = data?.data?.items || data?.data || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Calculate statistics
  // Calculate statistics
  const stats = useMemo(() => {
    const totalPatients = items.reduce((s, i) => s + Number(i.patient_count || 0), 0)
    const totalCollected = items.reduce((s, i) => s + Number(i.total_collected || 0), 0)
    const totalBill = items.reduce((s, i) => s + Number(i.total_bill || 0), 0)
    const totalDiscount = items.reduce((s, i) => s + Number(i.total_discount || 0), 0)
    const metaTotal = meta.total || items.length

    return [
      { label: 'Total Doctors', value: metaTotal, icon: Stethoscope, grad: 'from-green-500 to-green-600' },
      { label: 'Total Patients', value: totalPatients, icon: Users, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Collected', value: `${currencySymbol} ${totalCollected.toLocaleString()}`, icon: DollarSign, grad: 'from-orange-500 to-orange-600' },
      { label: 'Total Bill', value: `${currencySymbol} ${totalBill.toLocaleString()}`, icon: Banknote, grad: 'from-teal-500 to-teal-600' },
      { label: 'Total Discount', value: `${currencySymbol} ${totalDiscount.toLocaleString()}`, icon: Calendar, grad: 'from-pink-500 to-pink-600' },
      { label: 'This Page', value: items.length, icon: FileText, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [items, meta, currencySymbol])

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
      data: null,
      title: '#',
      orderable: false,
      render: (_: any, __: string, ___: any, meta: any) => meta.row + 1 + (page - 1) * limit,
      defaultContent: '',
    },
    {
      data: null,
      title: 'Doctor Name',
      orderable: false,
      render: (_: any, __: string, row: DoctorItem) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <span class="font-medium">${row.doctor_name || row.name || '-'}</span>
        </div>`
      },
      defaultContent: '-',
    },
    {
      data: 'patient_count',
      title: 'Patient Count',
      orderable: true,
      render: (d: any) => `<span class="font-semibold">${Number(d || 0)}</span>`,
      defaultContent: '0',
    },
    {
      data: 'total_bill',
      title: `Total Bill (${currencySymbol})`,
      orderable: true,
      className: "text-right",
      render: (d: any) => `<span class="font-medium">${Number(d || 0).toLocaleString()}</span>`,
      defaultContent: '0',
    },
    {
      data: 'total_collected',
      title: `Total Collected (${currencySymbol})`,
      orderable: true,
      className: "text-right",
      render: (d: any) => `<span class="text-emerald-600 font-bold">${Number(d || 0).toLocaleString()}</span>`,
      defaultContent: '0',
    },
    {
      data: 'total_discount',
      title: `Total Discount (${currencySymbol})`,
      orderable: false,
      className: "text-right",
      render: (d: any) => `<span class="text-orange-600 font-medium">${Number(d || 0).toLocaleString()}</span>`,
      defaultContent: '0',
    },
    {
      data: null,
      title: 'Collection Rate (%)',
      orderable: false,
      render: (_: any, __: string, row: DoctorItem) => {
        const bill = Number(row.total_bill || 0)
        const collected = Number(row.total_collected || 0)
        if (bill === 0) return '<span class="text-gray-400">-</span>'
        const rate = ((collected / bill) * 100).toFixed(1)
        const color = Number(rate) >= 80 ? 'text-emerald-600' : Number(rate) >= 50 ? 'text-orange-500' : 'text-red-500'
        return `<span class="font-semibold ${color}">${rate}%</span>`
      },
      defaultContent: '-',
    },
  ]

  return (
    <>
      <AppHeader
        title="Doctor-wise Collection Report"
        description="Collection summary grouped by referring doctor with filtering and search"
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
          tableTitle="Doctor-wise Collection List"
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
                to="/dashboard/reports/outdoor/doctor-wise-collection/print"
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
              <p className="text-gray-500 font-medium">No doctor collection records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
