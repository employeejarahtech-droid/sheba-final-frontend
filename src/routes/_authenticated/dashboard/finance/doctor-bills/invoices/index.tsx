import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateField } from '@/components/date-field'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  type: z.string().catch('all'),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/finance/doctor-bills/invoices/',
)({
  validateSearch: (search) => searchSchema.parse(search),
  component: DoctorPaymentInvoicesPage,
})

type Invoice = {
  id: number
  invoice_no: string
  provider_type: 'Surgeon' | 'Anesthetist' | 'Assistant' | 'Consultant'
  provider_id: number
  provider_name: string | null
  total_amount: string
  payment_date: string
  payment_method: string | null
  created_at: string
}

type ApiResponse = {
  status: boolean
  data: {
    items: Invoice[]
    meta: { total: number; page: number; limit: number; totalPages: number }
  }
}

const PROVIDER_TYPES = ['Surgeon', 'Anesthetist', 'Assistant', 'Consultant'] as const

const TYPE_BADGE: Record<string, string> = {
  Surgeon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Anesthetist: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Assistant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Consultant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Local YYYY-MM-DD — avoid toISOString() UTC off-by-one (same convention as the other pages).
function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function DoctorPaymentInvoicesPage() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')

  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 10
  const search = searchParams.search || ''
  const type = searchParams.type || 'all'
  const from = searchParams.from || ''
  const to = searchParams.to || ''

  const setParam = (key: string, value: string | number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, [key]: value, page: 1 }) })

  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ['doctor-payment-invoices', page, limit, search, type, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (type !== 'all') params.set('provider_type', type)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${API_URL}/api/bill-distribution/final/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch payment invoices')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev: any) => prev ?? { status: true, data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const records: Invoice[] = data?.data?.items ?? []
  const meta = data?.data?.meta

  // ── Date filter presets (Filter By) ──────────────────────────────────────────
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  const datePresets = {
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) } })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d })()), to: toYMD(today()) },
    thisMonth: { label: 'This Month', from: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toYMD(today()) },
  }
  const activePreset = from && to
    ? (Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)?.[0] ?? 'custom')
    : 'custom'
  const [presetOpen, setPresetOpen] = useState(false)
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key]
    if (p) {
      navigate({ to: '.', search: (prev: any) => ({ ...prev, from: p.from, to: p.to, page: 1 }) })
    }
    setPresetOpen(false)
  }

  const filterSlot = (
    <div className="flex flex-wrap items-end gap-2">
      <Select value={type} onValueChange={(v: string) => setParam('type', v)}>
        <SelectTrigger className="w-[150px] h-9 text-sm">
          <SelectValue placeholder="Provider type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {PROVIDER_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}s</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Filter by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7">Last 7 days</SelectItem>
          <SelectItem value="last15">Last 15 days</SelectItem>
          <SelectItem value="last30">Last 30 days</SelectItem>
          <SelectItem value="last90">Last 90 days</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      <DateField value={from} onChange={(v: string) => setParam('from', v)} placeholder="From" />
      <span className="text-xs text-muted-foreground">to</span>
      <DateField value={to} onChange={(v: string) => setParam('to', v)} placeholder="To" />
      {(from || to || type !== 'all' || search) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground"
          onClick={() =>
            navigate({ to: '.', search: (prev: any) => ({ ...prev, from: '', to: '', type: 'all', page: 1 }) })
          }
        >
          Clear
        </Button>
      )}
    </div>
  )

  const columns = useMemo(() => [
    {
      data: 'id',
      title: '#',
      orderable: true,
      responsivePriority: 3,
      render: (_: any, __: string, _row: Invoice, m: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${m.row + 1 + (page - 1) * limit}</span>`,
      defaultContent: '',
    },
    {
      data: 'invoice_no',
      title: 'Invoice No',
      orderable: false,
      responsivePriority: 1,
      render: (d: any) =>
        `<span class="font-mono text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 px-2 py-1 rounded">${d}</span>`,
      defaultContent: '',
    },
    {
      data: 'provider_name',
      title: 'Doctor',
      orderable: false,
      responsivePriority: 1,
      render: (d: any, __: string, row: Invoice) => {
        const badge = TYPE_BADGE[row.provider_type] || 'bg-slate-100 text-slate-600'
        return `
          <div class="flex flex-col">
            <span class="font-medium">${d || `#${row.provider_id}`}</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium w-fit ${badge}">${row.provider_type}</span>
          </div>
        `
      },
      defaultContent: '',
    },
    {
      data: 'total_amount',
      title: `Amount (${currencySymbol})`,
      orderable: true,
      responsivePriority: 1,
      render: (d: any) =>
        `<span class="font-bold text-violet-600 dark:text-violet-400">${Number(d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`,
      defaultContent: '0.00',
    },
    {
      data: 'payment_date',
      title: 'Payment Date',
      orderable: true,
      responsivePriority: 2,
      render: (d: any) => `<span class="text-sm">${fmtDate(d)}</span>`,
      defaultContent: '—',
    },
    {
      data: 'payment_method',
      title: 'Method',
      orderable: false,
      responsivePriority: 3,
      render: (d: any) => d
        ? `<span class="px-2 py-0.5 rounded-full text-xs bg-muted capitalize">${d.replace(/_/g, ' ')}</span>`
        : '<span class="text-muted-foreground italic text-xs">—</span>',
      defaultContent: '—',
    },
    {
      data: 'created_at',
      title: 'Created',
      orderable: true,
      responsivePriority: 3,
      render: (d: any) => `<span class="text-xs text-muted-foreground">${fmtDate(d)}</span>`,
      defaultContent: '—',
    },
    {
      data: null,
      title: 'Action',
      orderable: false,
      responsivePriority: 1,
      className: 'text-center',
      render: (_: any, __: string, row: Invoice) =>
        `<a href="/dashboard/finance/doctor-bills/invoices/${row.id}/print" target="_blank" rel="noopener" class="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground" title="View / print invoice">Print</a>`,
      defaultContent: '',
    },
  ], [currencySymbol, page, limit])

  return (
    <>
      <AppHeader fixed />

      <main className="">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-violet-500" />
            Doctor Payment Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            Payment vouchers created from the doctor bill pages
          </p>
        </div>

        <DataTable
          columns={columns}
          data={records}
          meta={meta}
          onPageChange={(p: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: p }) })}
          onLimitChange={(l: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: l, page: 1 }) })}
          search={search}
          isLoading={isFetching}
          onSearchChange={(s: string) => setParam('search', s)}
          tableTitle="Payment Invoices"
          filterSlot={filterSlot}
          searchPlaceholder="Search invoice no / doctor…"
        />
      </main>
    </>
  )
}
