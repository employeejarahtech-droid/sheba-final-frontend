import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Stethoscope,
  DollarSign,
  Wallet,
  TrendingDown,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
} from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/date-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

// ─── Shared config ──────────────────────────────────────────────────────────

export interface IndoorBillReportConfig {
  /** Backend `/api/bill-distribution/final/<endpoint>` segment */
  endpoint: string
  /** Page + report title, e.g. "Surgeon Bill" */
  title: string
  /** Label for the provider/grouping column, e.g. "Surgeon" */
  providerLabel: string
  /** Route path of the matching print page */
  printPath: string
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type FinalDistribution = {
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
}

type Meta = { total: number; page: number; limit: number; totalPages: number }

type ApiResponse = {
  status: boolean
  data: { items: FinalDistribution[]; meta: Meta }
  summary: {
    totalPayable: number
    totalDue: number
    totalFinalBill: number
    paidCount: number
    unpaidCount: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number | null | undefined) => Number(v || 0)

function fmtAmt(val: string | number | null | undefined, sym: string) {
  return `${sym}${num(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Paid = Payable - Due (clamped at 0). `paid_now` in the API is the paid DATE, not an amount.
const paidAmount = (r: FinalDistribution) => Math.max(num(r.payable_now) - num(r.due_amount), 0)

const providerName = (r: FinalDistribution) => r.doctor?.doctor_name || r.service_name || 'Unspecified'

// ─── Component ────────────────────────────────────────────────────────────────

export function IndoorBillReport({
  config,
  page,
  limit,
  search,
  from,
  to,
  status,
  setPage,
  setLimit,
  setSearch,
  setFrom,
  setTo,
  setStatus,
}: {
  config: IndoorBillReportConfig
  page: number
  limit: number
  search: string
  from: string
  to: string
  status: string
  setPage: (p: number) => void
  setLimit: (l: number) => void
  setSearch: (s: string) => void
  setFrom: (f: string) => void
  setTo: (t: string) => void
  setStatus: (s: string) => void
}) {
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')
  const API_URL = import.meta.env.VITE_API_URL || ''

  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ['indoor-bill-report', config.endpoint, page, limit, search, from, to, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (status !== 'all') params.set('payment_status', status)
      const res = await fetch(
        `${API_URL}/api/bill-distribution/final/${config.endpoint}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error(`Failed to fetch ${config.title} data`)
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev,
  })

  const records = data?.data?.items ?? []
  const meta = data?.data?.meta
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  // ── Summary stat cards ───────────────────────────────────────────────────────
  const stats = useMemo(
    () => [
      { label: 'Total Records', value: meta?.total ?? 0, icon: FileText },
      { label: 'Total Final Bill', value: fmtAmt(summary.totalFinalBill, currencySymbol), icon: DollarSign },
      { label: 'Total Payable', value: fmtAmt(summary.totalPayable, currencySymbol), icon: Wallet },
      { label: 'Total Due', value: fmtAmt(summary.totalDue, currencySymbol), icon: TrendingDown },
      { label: 'Paid', value: summary.paidCount, icon: CheckCircle2 },
      { label: 'Pending', value: summary.unpaidCount, icon: Clock },
    ],
    [meta, summary, currencySymbol],
  )

  // ── Provider-wise analysis (current page) ────────────────────────────────────
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

  // ── DataTable columns ────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        data: null,
        title: config.providerLabel,
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
        render: (d: any) => `<span class="font-medium text-blue-600 dark:text-blue-400">${fmtAmt(d, currencySymbol)}</span>`,
      },
      {
        data: 'payable',
        title: `Payable (${currencySymbol})`,
        render: (d: any) => `<span class="font-bold text-violet-600 dark:text-violet-400">${fmtAmt(d, currencySymbol)}</span>`,
      },
      {
        data: 'paid',
        title: `Paid (${currencySymbol})`,
        render: (d: any) => `<span class="font-medium text-emerald-600">${fmtAmt(d, currencySymbol)}</span>`,
      },
      {
        data: 'due',
        title: `Due (${currencySymbol})`,
        render: (d: any) => {
          const cls = num(d) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600'
          return `<span class="font-medium ${cls}">${fmtAmt(d, currencySymbol)}</span>`
        },
      },
    ],
    [currencySymbol, config.providerLabel],
  )

  // ── Date presets ─────────────────────────────────────────────────────────────
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const ago = (n: number) => { const d = today(); d.setDate(d.getDate() - n); return d }
  const datePresets = useMemo(
    () => ({
      today: { from: toYMD(today()), to: toYMD(today()) },
      yesterday: { from: toYMD(ago(1)), to: toYMD(ago(1)) },
      last7: { from: toYMD(ago(6)), to: toYMD(today()) },
      last15: { from: toYMD(ago(14)), to: toYMD(today()) },
      last30: { from: toYMD(ago(29)), to: toYMD(today()) },
      last90: { from: toYMD(ago(89)), to: toYMD(today()) },
      last365: { from: toYMD(ago(364)), to: toYMD(today()) },
    }),
    [],
  )
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

  const colors = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

  return (
    <>
      <AppHeader
        title={`${config.title} Report`}
        description={`Provider-wise analysis of indoor ${config.title.toLowerCase()} distributions`}
        fixed
      />

      <main className="">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % colors.length] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % colors.length] }} />
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
          tableTitle={`${config.providerLabel}-wise Breakdown`}
          columns={columns}
          data={providerRows}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
          filterSlot={
            <div className="flex flex-wrap items-center gap-1.5">
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
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last365">Last 365 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-sm w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              {(from || to || status !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setStatus('all') }}>
                  Clear
                </Button>
              )}
              <Link
                to={config.printPath}
                search={{
                  search: search || undefined,
                  from: from || undefined,
                  to: to || undefined,
                  status: status !== 'all' ? status : undefined,
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
              <p className="text-gray-500 font-medium">No {config.title.toLowerCase()} records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or date range</p>
            </div>
          }
        />
      </main>
    </>
  )
}
