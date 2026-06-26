import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  Check,
  ChevronDown,
} from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DateField } from '@/components/date-field'
import { cn } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

// ─── Types ────────────────────────────────────────────────────────────────────

type FinalDistribution = {
  id: number
  distribution_id: number | null
  admission_id: number
  final_bill_id: number
  type: string
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
  created_by: number | null
  created_at: string
  doctor?: { id: number; doctor_name: string; speciality: string } | null
}

type Meta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse = {
  status: boolean
  data: {
    items: FinalDistribution[]
    meta: Meta
  }
  summary: {
    totalPayable: number
    totalDue: number
    totalFinalBill: number
    paidCount: number
    unpaidCount: number
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssistantBillPageProps {
  page: number
  limit: number
  search: string
  from: string
  to: string
  status: string
  doctor: number
  setPage: (p: number) => void
  setLimit: (l: number) => void
  setSearch: (s: string) => void
  setFrom: (f: string) => void
  setTo: (t: string) => void
  setStatus: (s: string) => void
  setDoctor: (d: number) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmt(val: string | number | null | undefined, sym: string) {
  return `${sym}${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AssistantBillPage({
  page,
  limit,
  search,
  from,
  to,
  status,
  doctor,
  setPage,
  setLimit,
  setSearch,
  setFrom,
  setTo,
  setStatus,
  setDoctor,
}: AssistantBillPageProps) {
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')
  const queryClient = useQueryClient()

  // Mark-as-paid dialog
  const [selectedRecord, setSelectedRecord] = useState<FinalDistribution | null>(null)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10))
  const [paidStatus, setPaidStatus] = useState<'paid' | 'partial'>('paid')

  // Doctor combobox open state
  const [doctorOpen, setDoctorOpen] = useState(false)

  // ── Fetch doctors list (for Assistant filter) ────────────────────────────────
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/doctor?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch doctors')
      return res.json()
    },
    enabled: !!token,
  })
  const doctors: any[] = doctorsData?.data?.rows || doctorsData?.data?.items || []
  const selectedDoctor = doctors.find(d => d.id === doctor)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ['assistant-bills', page, limit, search, from, to, status, doctor],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (status !== 'all') params.set('payment_status', status)
      if (doctor) params.set('doctor_id', String(doctor))
      const res = await fetch(
        `${API_URL}/api/bill-distribution/final/assistant?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch assistant bills')
      return res.json()
    },
    enabled: !!token,
  })

  const records: FinalDistribution[] = data?.data?.items ?? []
  const meta: Meta | undefined = data?.data?.meta
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: 'Total Records',
      value: meta?.total ?? 0,
      icon: Users,
      grad: 'from-blue-500 to-indigo-500',
    },
    {
      label: 'Total Payable',
      value: fmtAmt(summary.totalPayable, currencySymbol),
      icon: DollarSign,
      grad: 'from-violet-500 to-indigo-500',
    },
    {
      label: 'Paid',
      value: summary.paidCount,
      icon: CheckCircle2,
      grad: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Pending Payment',
      value: summary.unpaidCount,
      icon: Clock,
      grad: 'from-amber-500 to-orange-500',
    },
  ], [meta, summary, currencySymbol])

  // ── Mark paid mutation ───────────────────────────────────────────────────────
  const markPaidMutation = useMutation({
    mutationFn: async ({ id, paid_now, payment_status }: { id: number; paid_now: string; payment_status: string }) => {
      const res = await fetch(`${API_URL}/api/bill-distribution/final/${id}/paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paid_now, payment_status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment date saved successfully')
      queryClient.invalidateQueries({ queryKey: ['assistant-bills'] })
      setSelectedRecord(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openPaidDialog = (rec: FinalDistribution) => {
    setSelectedRecord(rec)
    setPaidDate(new Date().toISOString().slice(0, 10))
    setPaidStatus('paid')
  }

  // ── DataTable columns ────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      data: 'id',
      title: '#',
      orderable: true,
      responsivePriority: 3,
      render: (_: any, __: string, _row: FinalDistribution, meta: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${meta.row + 1 + (page - 1) * limit}</span>`,
      defaultContent: '',
    },
    {
      data: null,
      title: 'Assistant',
      orderable: true,
      responsivePriority: 1,
      render: (_: any, __: string, row: FinalDistribution) => {
        const name = row.doctor?.doctor_name || row.service_name || '—'
        const spec = row.doctor?.speciality || ''
        return `
          <div class="flex flex-col">
            <span class="font-medium">${name}</span>
            ${spec ? `<span class="text-xs text-muted-foreground">${spec}</span>` : ''}
          </div>
        `
      },
      defaultContent: '',
    },
    {
      data: 'admission_id',
      title: 'Admission #',
      orderable: true,
      responsivePriority: 2,
      render: (d: any) => `<span class="font-mono text-xs bg-muted px-2 py-0.5 rounded">#${d}</span>`,
      defaultContent: '',
    },
    {
      data: 'service_name',
      title: 'Service',
      orderable: true,
      responsivePriority: 4,
      render: (_: any, __: string, row: FinalDistribution) => {
        const note = row.notes ? `<div class="text-xs text-muted-foreground truncate max-w-[160px]">${row.notes}</div>` : ''
        return `<div class="flex flex-col"><span>${row.service_name || '—'}</span>${note}</div>`
      },
      defaultContent: '',
    },
    {
      data: 'final_bill',
      title: `Final Bill (${currencySymbol})`,
      orderable: true,
      responsivePriority: 2,
      render: (d: any) => `<span class="font-medium text-blue-600 dark:text-blue-400">${fmtAmt(d, currencySymbol)}</span>`,
      defaultContent: '0.00',
    },
    {
      data: 'payable_now',
      title: `Payable Now (${currencySymbol})`,
      orderable: true,
      responsivePriority: 1,
      render: (d: any) => `<span class="font-bold text-violet-600 dark:text-violet-400">${fmtAmt(d, currencySymbol)}</span>`,
      defaultContent: '0.00',
    },
    {
      data: 'due_amount',
      title: `Due (${currencySymbol})`,
      orderable: true,
      responsivePriority: 3,
      render: (d: any) => {
        const n = Number(d || 0)
        const cls = n > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600'
        return `<span class="font-medium ${cls}">${fmtAmt(d, currencySymbol)}</span>`
      },
      defaultContent: '0.00',
    },
    {
      data: 'payable_created_date',
      title: 'Created Date',
      orderable: true,
      responsivePriority: 4,
      render: (d: any) => `<span class="text-muted-foreground text-xs">${fmtDate(d)}</span>`,
      defaultContent: '—',
    },
    {
      data: 'paid_now',
      title: 'Paid Date',
      orderable: true,
      responsivePriority: 3,
      render: (d: any) => d
        ? `<span class="text-emerald-600 font-medium text-xs">✓ ${fmtDate(d)}</span>`
        : `<span class="text-muted-foreground italic text-xs">Not paid</span>`,
      defaultContent: '—',
    },
    {
      data: 'payment_status',
      title: 'Status',
      orderable: true,
      responsivePriority: 2,
      render: (d: any) => {
        if (!d) return `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">⏱ Pending</span>`
        if (d === 'paid') return `<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">✓ Paid</span>`
        if (d === 'partial') return `<span class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">≈ Partial</span>`
        return `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">${d}</span>`
      },
      defaultContent: '',
    },
    {
      data: null,
      title: 'Action',
      orderable: false,
      responsivePriority: 1,
      render: (_: any, __: string, row: FinalDistribution) => {
        const label = row.paid_now ? 'Update' : 'Mark Paid'
        const cls = row.paid_now
          ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          : 'bg-violet-600 text-white hover:bg-violet-700'
        return `
          <button
            class="mark-paid-btn inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 px-3 ${cls}"
            data-id="${row.id}"
          >
            ${label}
          </button>
        `
      },
      defaultContent: '',
    },
  ], [currencySymbol, page, limit])

  // ── Event delegation for Mark Paid buttons ───────────────────────────────────
  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest('.mark-paid-btn') as HTMLButtonElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const rec = records.find(r => r.id === id)
    if (rec) openPaidDialog(rec)
  }

  // ── Date filter presets (Filter By) ──────────────────────────────────────────
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
  // Format as LOCAL YYYY-MM-DD. Do NOT use toISOString() — it converts to UTC and
  // shifts the date back one day in timezones east of UTC (e.g. UTC+6 → off-by-one).
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) } })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d })()), to: toYMD(today()) },
    last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d })()), to: toYMD(today()) },
    last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d })()), to: toYMD(today()) },
    last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d })()), to: toYMD(today()) },
    last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d })()), to: toYMD(today()) },
  }), [])
  // Detect which preset (if any) currently matches the from/to in the URL
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

  // ── Filter slot ──────────────────────────────────────────────────────────────
  const filterSlot = (
    <div className="flex flex-wrap items-end gap-2">
      <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn('h-9 text-sm w-56 justify-between font-normal', !doctor && 'text-muted-foreground')}
          >
            <span className="truncate">
              {selectedDoctor
                ? `Dr. ${selectedDoctor.doctor_name}`
                : 'Assistant'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search assistant..." />
            <CommandList>
              <CommandEmpty>No doctor found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => { setDoctor(0); setDoctorOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', !doctor ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-sm text-muted-foreground">All Assistants</span>
                </CommandItem>
                {doctors.map((d: any) => (
                  <CommandItem
                    key={d.id}
                    value={`${d.doctor_name} ${d.qualification || ''} ${d.speciality || ''} ${d.id}`.toLowerCase()}
                    onSelect={() => { setDoctor(d.id); setDoctorOpen(false) }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', doctor === d.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Dr. {d.doctor_name}</span>
                      {[d.qualification, d.speciality].filter(Boolean).join(' - ') && (
                        <span className="text-[11px] text-muted-foreground">
                          {[d.qualification, d.speciality].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
        onChange={(v: string) => { setFrom(v); setPresetOpen(false) }}
        placeholder="From"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <DateField
        value={to}
        onChange={(v: string) => { setTo(v); setPresetOpen(false) }}
        placeholder="To"
      />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger id="status-filter" className="h-9 text-sm w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="null">Not Set</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>
      {(from || to || status !== 'all' || doctor) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground"
          onClick={() => { setFrom(''); setTo(''); setStatus('all'); setDoctor(0) }}
        >
          Clear
        </Button>
      )}
    </div>
  )

  return (
    <>
      <AppHeader fixed />

      <main className="">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-500" />
            Assistant Bill Management
          </h1>
        </div>

        {/* Gradient Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 bg-gradient-to-br ${item.grad} rounded-lg shadow-lg`}>
                      <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{item.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="text-2xl font-bold">{item.value}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* DataTable with server-side pagination */}
        <div onClick={handleTableClick}>
          <DataTable
            columns={columns}
            data={records}
            meta={meta}
            onPageChange={setPage}
            onLimitChange={setLimit}
            search={search}
            isLoading={isFetching}
            onSearchChange={setSearch}
            tableTitle="Assistant Bills"
            filterSlot={filterSlot}
          />
        </div>
      </main>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={v => !v && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-emerald-500" />
              Mark Payment Date
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2">
              {/* Summary card */}
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assistant</span>
                  <span className="font-medium">
                    {selectedRecord.doctor?.doctor_name || selectedRecord.service_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission</span>
                  <span className="font-mono">#{selectedRecord.admission_id}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Payable Amount</span>
                  <span className="font-bold text-violet-600 text-base">
                    {fmtAmt(selectedRecord.payable_now, currencySymbol)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="paid-date-input" className="text-xs mb-1.5 block">
                  Paid Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="paid-date-input"
                  type="date"
                  value={paidDate}
                  onChange={e => setPaidDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <Label htmlFor="paid-status-select" className="text-xs mb-1.5 block">
                  Payment Status
                </Label>
                <Select value={paidStatus} onValueChange={v => setPaidStatus(v as 'paid' | 'partial')}>
                  <SelectTrigger id="paid-status-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">
                      <span className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-emerald-500" /> Fully Paid
                      </span>
                    </SelectItem>
                    <SelectItem value="partial">
                      <span className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-amber-500" /> Partial Payment
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>Cancel</Button>
            <Button
              id="confirm-mark-paid"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!paidDate || markPaidMutation.isPending}
              onClick={() => {
                if (!selectedRecord) return
                markPaidMutation.mutate({
                  id: selectedRecord.id,
                  paid_now: paidDate,
                  payment_status: paidStatus,
                })
              }}
            >
              {markPaidMutation.isPending ? 'Saving…' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
