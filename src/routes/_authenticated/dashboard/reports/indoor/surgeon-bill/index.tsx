import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, DollarSign, Wallet, TrendingDown, CheckCircle2, Clock, Printer, FileText, Calendar, Users, Receipt, AlertCircle } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface SurgeonBillItem {
  id: number
  admission_id: number
  service_name: string
  provider_id: number | null
  bill_amount: string
  less_amount: string
  final_bill: string
  payable_now: string
  paid_now: string | null
  payable_created_date: string | null
  due_amount: string
  payment_status: 'pending' | 'partial' | 'paid' | null
  notes: string | null
  doctor?: { id: number; doctor_name: string; speciality: string } | null
  admission?: {
    admission_prefix?: string
    patient?: { first_name: string; last_name: string }
  } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const surgeonBillSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/indoor/surgeon-bill/')({
  validateSearch: (search) => surgeonBillSearchSchema.parse(search),
  component: SurgeonBillPage,
})

function SurgeonBillPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { formatDate } = useDateFormat()
  const { currencySymbol } = useCurrency()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ''
  const from = searchParams?.from || ''
  const to = searchParams?.to || ''

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })
  const setFrom = (newFrom: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) })
  const setTo = (newTo: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) })

  const token = getCookie('accessToken')
  const API_URL = import.meta.env.VITE_API_URL || ''

  const { data, isLoading } = useQuery<{
    status: boolean
    data: { items: SurgeonBillItem[]; meta: Meta }
    summary: {
      totalPayable: number
      totalDue: number
      totalFinalBill: number
      paidCount: number
      unpaidCount: number
    }
  }>({
    queryKey: ['surgeon-bill-report', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(
        `${API_URL}/api/bill-distribution/final/surgeon?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch surgeon bill data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev,
  })

  const records = data?.data?.items ?? []
  const meta = data?.data?.meta
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  // Helper functions
  const num = (v: string | number | null | undefined) => Number(v || 0)
  const paidAmount = (r: SurgeonBillItem) => Math.max(num(r.payable_now) - num(r.due_amount), 0)
  const providerName = (r: SurgeonBillItem) => r.doctor?.doctor_name || r.service_name || 'Unspecified'

  // Calculate statistics
  const stats = useMemo(() => {
    return [
      { label: 'Total Records', value: meta?.total ?? 0, icon: FileText },
      { label: 'Total Final Bill', value: `${currencySymbol}${num(summary.totalFinalBill).toLocaleString()}`, icon: DollarSign },
      { label: 'Total Payable', value: `${currencySymbol}${num(summary.totalPayable).toLocaleString()}`, icon: Wallet },
      { label: 'Total Due', value: `${currencySymbol}${num(summary.totalDue).toLocaleString()}`, icon: TrendingDown },
      { label: 'Paid', value: summary.paidCount, icon: CheckCircle2 },
      { label: 'Pending', value: summary.unpaidCount, icon: Clock },
    ]
  }, [meta, summary, currencySymbol])

  // Provider-wise analysis (current page)
  const providerRows = useMemo(() => {
    const map = new Map<
      string,
      { provider: string; speciality: string; count: number; finalBill: number; payable: number; paid: number; due: number }
    >()
    for (const r of records) {
      const key = providerName(r)
      const cur =
        map.get(key) ||
        { provider: key, speciality: r.doctor?.speciality || '', count: 0, finalBill: 0, payable: 0, paid: 0, due: 0 }
      cur.count += 1
      cur.finalBill += num(r.final_bill)
      cur.payable += num(r.payable_now)
      cur.paid += paidAmount(r)
      cur.due += num(r.due_amount)
      map.set(key, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.payable - a.payable)
  }, [records])

  // DataTable columns
  const columns = [
    {
      data: null,
      title: 'Surgeon',
      orderable: false,
      render: (_: any, __: string, row: any) => {
        const r = row as { provider: string; speciality: string }
        return `<div class="flex flex-col"><span class="font-medium">${r.provider}</span>${r.speciality ? `<span class="text-xs text-muted-foreground">${r.speciality}</span>` : ''}</div>`
      },
    },
    {
      data: 'count',
      title: 'Bills',
      render: (d: any) => `<span class="font-mono text-xs bg-muted px-2 py-0.5 rounded">${d}</span>`,
    },
    {
      data: 'finalBill',
      title: `Final Bill (${currencySymbol})`,
      render: (d: any) => `<span class="font-medium text-blue-600 dark:text-blue-400">${num(d).toLocaleString()}</span>`,
    },
    {
      data: 'payable',
      title: `Payable (${currencySymbol})`,
      render: (d: any) => `<span class="font-bold text-violet-600 dark:text-violet-400">${num(d).toLocaleString()}</span>`,
    },
    {
      data: 'paid',
      title: `Paid (${currencySymbol})`,
      render: (d: any) => `<span class="font-medium text-emerald-600">${num(d).toLocaleString()}</span>`,
    },
    {
      data: 'due',
      title: `Due (${currencySymbol})`,
      render: (d: any) => {
        const cls = num(d) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600'
        return `<span class="font-medium ${cls}">${num(d).toLocaleString()}</span>`
      },
    },
  ]

  // Date presets
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
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
        title="Surgeon Bill Report"
        description="Surgeon-wise analysis of indoor surgeon bill distributions"
        fixed
      />

      <main className="">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: COLORS[index % COLORS.length] }} />
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
          tableTitle="Surgeon-wise Breakdown"
          columns={columns}
          data={providerRows}
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
              <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
              {(from || to) && (
                <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/indoor/surgeon-bill/print"
                search={{
                  search: search || undefined,
                  from: from || undefined,
                  to: to || undefined,
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
              <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No surgeon bill records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or date range</p>
            </div>
          }
        />
      </main>
    </>
  )
}
