import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Banknote, DollarSign, AlertCircle, Printer, FileText, Calendar, Clock, Hash } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface AdmissionItem {
  id: number
  admission_prefix?: string | null
  patient_name: string
  admission_date: string
  discharge_date?: string
  total_bill_amount?: number
  status: string
  finalBill?: { total_bill_amount?: number; paid_amount?: number; due_amount?: number } | null
  advancePayments?: { total_amount?: number } | null
  [key: string]: any
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const outstandingBalanceSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/indoor/outstanding-balance/')({
  validateSearch: (search) => outstandingBalanceSearchSchema.parse(search),
  component: OutstandingBalanceReport,
})

function OutstandingBalanceReport() {
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
    queryKey: ['outstanding-balance', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status: 'active',
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch outstanding balance')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: AdmissionItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Billing fields are nested (finalBill/advancePayments) on the admission payload
  const billOf = (i: AdmissionItem) => Number(i.total_bill_amount || i.finalBill?.total_bill_amount || 0)
  const paidOf = (i: AdmissionItem) => Number(i.finalBill?.paid_amount ?? i.advancePayments?.total_amount ?? 0)
  const dueOf = (i: AdmissionItem) => i.finalBill?.due_amount != null ? Number(i.finalBill.due_amount) : Math.max(0, billOf(i) - paidOf(i))

  // Filter items to show only those with outstanding balance
  const filteredItems = items.filter(item => dueOf(item) > 0)

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBilled = filteredItems.reduce((sum, i) => sum + billOf(i), 0)
    const totalPaid = filteredItems.reduce((sum, i) => sum + paidOf(i), 0)
    const totalOutstanding = filteredItems.reduce((sum, i) => sum + dueOf(i), 0)

    return [
      { label: 'Total Patients', value: meta.total, icon: Users, grad: 'from-green-500 to-green-600' },
      { label: 'With Outstanding', value: filteredItems.length, icon: AlertCircle, grad: 'from-red-500 to-red-600' },
      { label: 'Total Billed', value: `${currencySymbol} ${totalBilled.toLocaleString()}`, icon: Banknote, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Paid', value: `${currencySymbol} ${totalPaid.toLocaleString()}`, icon: DollarSign, grad: 'from-emerald-500 to-emerald-600' },
      { label: 'Total Outstanding', value: `${currencySymbol} ${totalOutstanding.toLocaleString()}`, icon: AlertCircle, grad: 'from-orange-500 to-orange-600' },
      { label: 'This Page', value: filteredItems.length, icon: Hash, grad: 'from-purple-500 to-purple-600' },
    ]
  }, [filteredItems, meta, currencySymbol])

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

  // Calculate days admitted
  const calcDaysAdmitted = (admissionDate: string, dischargeDate?: string): number => {
    if (!admissionDate) return 0
    const start = new Date(admissionDate)
    const end = dischargeDate ? new Date(dischargeDate) : new Date()
    const diff = end.getTime() - start.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'discharged' || s === 'paid') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 capitalize">${status}</span>`
    }
    if (s === 'active') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 capitalize">${status}</span>`
    }
    return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 capitalize">${status}</span>`
  }

  const columns = [
    {
      data: "admission_prefix",
      title: "Admission No",
      orderable: true,
      render: (data: any) => {
        const value = data || '-'
        return `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${value}</span>`
      },
    },
    {
      data: "patient_name",
      title: "Patient Name",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "admission_date",
      title: "Admission Date",
      render: (data: string | null) => {
        if (!data) return '-'
        const date = new Date(data)
        return `<div class="text-sm">
          <div>${formatDate(date)}</div>
        </div>`
      },
    },
    {
      data: null,
      title: `Total Bill (${currencySymbol})`,
      className: "text-right",
      render: (_d: any, _t: string, row: AdmissionItem) => `<span class="font-medium">${billOf(row).toFixed(2)}</span>`,
    },
    {
      data: null,
      title: `Paid Amount (${currencySymbol})`,
      className: "text-right",
      render: (_d: any, _t: string, row: AdmissionItem) => `<span class="text-emerald-600 font-bold">${paidOf(row).toFixed(2)}</span>`,
    },
    {
      data: null,
      title: `Outstanding (${currencySymbol})`,
      className: "text-right",
      render: (_d: any, _t: string, row: AdmissionItem) => {
        const val = dueOf(row)
        return val > 0
          ? `<span class="text-red-500 font-bold">${val.toFixed(2)}</span>`
          : `<span class="text-emerald-500 font-semibold">0.00</span>`
      },
    },
    {
      data: null,
      title: "Days Admitted",
      orderable: false,
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const days = calcDaysAdmitted(row.admission_date, row.discharge_date)
        return `<div class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium">${days}</span>
        </div>`
      },
    },
    {
      data: "status",
      title: "Status",
      render: (data: string) => getStatusBadge(data),
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const id = row.id;
        return `<div class="flex gap-2">
          <a href="/dashboard/admission/patients/${id}/billing-print" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/admission/patients/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </a>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Indoor Outstanding Balance"
        description="Active inpatients with pending payment balances"
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
          tableTitle="Outstanding Balance List"
          columns={columns}
          data={filteredItems}
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
                to="/dashboard/reports/indoor/outstanding-balance/print"
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
              <p className="text-gray-500 font-medium">No outstanding balance records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
