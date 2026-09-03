import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Syringe,
  DollarSign,
  CheckCircle2,
  Clock,
  Check,
  ChevronDown,
  History,
  FileText,
  Info,
  X,
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
  admission?: {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    sex: string
    phone: string
    diagnosis: string | null
    admission_date: string
    discharge_date: string | null
    status: string
  } | null
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

interface AnesthesiaBillPageProps {
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
  /** When true (Finance context), the table shows one flat row per payment
   *  allocation (Anesthesiologist / Admission / Payable Amount / Status /
   *  Paid Date) instead of the grouped Payment History card layout. */
  payableOnly?: boolean
  /** Paid tab: same flat Finance layout, but nothing is selectable — hides
   *  the checkbox column, the how-to banner and the bulk action bar. */
  selectable?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmt(val: string | number | null | undefined, sym: string) {
  return `${sym}${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
}

type PaymentLog = {
  id: number
  final_distribution_id: number
  previous_status: 'pending' | 'partial' | 'paid' | null
  new_status: 'pending' | 'partial' | 'paid' | null
  paid_now: string | null
  changed_by: number | null
  created_at: string
  changedBy?: { id: number; name: string } | null
}

// One row per (admission, distribution) — every progressive-payment row for
// the same distribution_id is grouped together. A patient can have more than
// one anesthesiologist on the same admission (each gets its own
// bill_distribute_set_payable row and therefore its own distribution_id), so
// grouping by admission_id alone would incorrectly merge two different
// anesthesiologists' numbers into one row (confirmed this actually happens
// for Assistant-type distributions — same code path applies here). Falls
// back to grouping by the record's own id when distribution_id is null (a
// one-off record with no progressive-payment chain).
type AdmissionGroup = {
  key: number
  admission_id: number
  admission?: FinalDistribution['admission']
  doctor?: FinalDistribution['doctor']
  items: FinalDistribution[]
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AnesthesiaBillPage({
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
  payableOnly = false,
  selectable = true,
}: AnesthesiaBillPageProps) {
  const { currencySymbol, format } = useCurrency()
  const token = getCookie('accessToken')
  const queryClient = useQueryClient()

  // Multi-select for bulk "Create Payment Invoice" (Finance flat view only) —
  // an invoice can only bundle items from a single provider, so picking an
  // item from a different doctor than what's already selected starts a new
  // selection instead of mixing providers into one voucher.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [invoicePaymentDate, setInvoicePaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('cash')

  // Doctor combobox open state
  const [doctorOpen, setDoctorOpen] = useState(false)

  // Payment history dialog
  const [historyId, setHistoryId] = useState<number | null>(null)
  const { data: historyData, isFetching: historyLoading } = useQuery({
    queryKey: ['final-distribution-history', historyId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/bill-distribution/final/${historyId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch payment history')
      return res.json()
    },
    enabled: !!token && historyId !== null,
  })
  const historyLogs: PaymentLog[] = historyData?.data ?? []

  // ── Fetch doctors list (for Anesthesiologist filter) — only doctors with actual records here ──
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list', 'anesthesiologist'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/bill-distribution/final/anesthesiologist/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch doctors')
      return res.json()
    },
    enabled: !!token,
  })
  const doctors: any[] = doctorsData?.data || []
  const selectedDoctor = doctors.find(d => d.id === doctor)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ['anesthesia-bills', page, limit, search, from, to, status, doctor],
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
        `${API_URL}/api/bill-distribution/final/anesthesiologist?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch anesthesia bills')
      return res.json()
    },
    enabled: !!token,
  })

  const records: FinalDistribution[] = data?.data?.items ?? []
  const meta: Meta | undefined = data?.data?.meta
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  // Group the current page's distribution rows by admission — one row per
  // patient, with every anesthesia charge for that admission listed together.
  const groupedRows: AdmissionGroup[] = useMemo(() => {
    const map = new Map<number, AdmissionGroup>()
    for (const r of records) {
      const key = r.distribution_id ?? r.id
      if (!map.has(key)) {
        map.set(key, { key, admission_id: r.admission_id, admission: r.admission, doctor: r.doctor, items: [] })
      }
      map.get(key)!.items.push(r)
    }
    return Array.from(map.values())
  }, [records])

  // Selection resets whenever the underlying query result changes (new page,
  // new filters, or a refetch after creating an invoice) — a selection tied
  // to rows that may no longer be on screen would be confusing to carry over.
  useEffect(() => {
    setSelectedIds(new Set())
  }, [data])

  const selectedRecords = records.filter(r => selectedIds.has(r.id))
  const selectedTotal = selectedRecords.reduce((sum, r) => sum + Number(r.payable_now || 0), 0)

  // "Mark All" toggles every unpaid row on the current page — the doctor filter
  // already scopes `records` to a single provider, so no cross-provider check is needed.
  const eligibleIds = useMemo(
    () => records.filter(r => r.payment_status !== 'paid').map(r => r.id),
    [records]
  )
  const allEligibleSelected = eligibleIds.length > 0 && eligibleIds.every(id => selectedIds.has(id))
  const toggleSelectAll = () => {
    setSelectedIds(allEligibleSelected ? new Set() : new Set(eligibleIds))
  }

  // ── Row-checkbox change handler (Finance flat view only) ──────────────────────
  useEffect(() => {
    const handleCheckboxChange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.classList?.contains('row-select-checkbox')) return
      const id = Number(target.dataset.id)
      if (!id) return
      const providerId = target.dataset.providerId ? Number(target.dataset.providerId) : null

      setSelectedIds(prev => {
        const next = new Set(prev)
        if (target.checked) {
          if (next.size > 0) {
            const firstSelected = records.find(r => r.id === Array.from(next)[0])
            if (firstSelected && (firstSelected.provider_id ?? null) !== providerId) {
              toast.warning("Selection cleared — an invoice can only include one doctor's bills at a time.")
              next.clear()
            }
          }
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
    }
    document.addEventListener('change', handleCheckboxChange)
    return () => document.removeEventListener('change', handleCheckboxChange)
  }, [records])

  // ── Create Payment Invoice ─────────────────────────────────────────────────────
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/bill-distribution/final/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          final_distribution_ids: Array.from(selectedIds),
          payment_date: invoicePaymentDate,
          payment_method: invoicePaymentMethod,
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.status) throw new Error(result.message || 'Failed to create invoice')
      return result.data
    },
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoice_no} created and marked paid`)
      setCreateInvoiceOpen(false)
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['anesthesia-bills'] })
      window.open(`/dashboard/finance/doctor-bills/invoices/${invoice.id}/print`, '_blank')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: 'Total Records',
      value: meta?.total ?? 0,
      icon: Syringe,
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

  // ── Expand-row click handler (patient info card) ─────────────────────────────
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
      const button = (e.target as HTMLElement).closest('.anesthesia-expand-btn')
      if (!button) return
      const btn = button as HTMLButtonElement
      const row = btn.closest('tr')
      if (!row) return

      const isExpanded = row.classList.contains('expanded')
      const nextRow = row.nextElementSibling

      // Toggle collapse
      if (nextRow && nextRow.classList.contains('anesthesia-child-row')) {
        nextRow.remove()
        row.classList.remove('expanded')
        btn.textContent = '+'
        btn.style.backgroundColor = 'black'
        return
      }
      if (isExpanded) return

      // Build patient info card from data-* attrs
      const patientName = btn.dataset.patientName || '—'
      const admissionPrefix = btn.dataset.admissionPrefix || ''
      const admissionId = btn.dataset.admissionId || ''
      const age = btn.dataset.age || '—'
      const sex = btn.dataset.sex || '—'
      const phone = btn.dataset.phone || '—'
      const diagnosis = btn.dataset.diagnosis || '—'
      const admissionDate = btn.dataset.admissionDate || ''
      const dischargeDate = btn.dataset.dischargeDate || ''
      const patientStatus = btn.dataset.patientStatus || ''
      const statusCls = patientStatus === 'active'
        ? 'bg-green-100 text-green-700'
        : patientStatus === 'discharged'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-red-100 text-red-700'

      const cardHtml = `
        <div class="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden my-3">
          <div class="bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3">
            <h2 class="text-base font-semibold text-white">Patient Information</h2>
            <p class="text-violet-100 text-xs">Admission #${admissionPrefix || admissionId}</p>
          </div>
          <div class="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Patient Name</span>
              <span class="font-semibold text-slate-800 dark:text-slate-100">${patientName}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Age / Sex</span>
              <span class="font-medium">${age} / ${sex}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Phone</span>
              <span class="font-medium">${phone}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Status</span>
              <span class="px-2 py-0.5 w-fit rounded-full text-xs font-semibold ${statusCls}">${patientStatus.charAt(0).toUpperCase() + patientStatus.slice(1)}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Admission Date</span>
              <span class="font-medium">${admissionDate}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Discharge Date</span>
              <span class="font-medium">${dischargeDate || '—'}</span>
            </div>
            <div class="col-span-2 md:col-span-3 flex flex-col gap-0.5">
              <span class="text-xs text-slate-400">Diagnosis</span>
              <span class="font-medium">${diagnosis}</span>
            </div>
          </div>
        </div>
      `

      const newRow = document.createElement('tr')
      newRow.className = 'anesthesia-child-row'
      const cell = document.createElement('td')
      cell.className = 'p-2 bg-muted/40'
      cell.colSpan = 20
      cell.innerHTML = cardHtml
      newRow.appendChild(cell)
      row.parentNode?.insertBefore(newRow, row.nextSibling)
      row.classList.add('expanded')
      btn.textContent = '−'
      btn.style.backgroundColor = '#7c3aed'
    }

    document.addEventListener('click', handleExpandClick)
    return () => document.removeEventListener('click', handleExpandClick)
  }, [])

  // ── History button click handler ──────────────────────────────────────────────
  useEffect(() => {
    const handleHistoryClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.history-btn') as HTMLButtonElement | null
      if (!btn) return
      const id = Number(btn.dataset.id)
      if (id) setHistoryId(id)
    }
    document.addEventListener('click', handleHistoryClick)
    return () => document.removeEventListener('click', handleHistoryClick)
  }, [])

  // ── DataTable columns ────────────────────────────────────────────────────────
  // Finance view (payableOnly): every payment/allocation is its own flat row
  // — a single admission naturally spans multiple rows when it has more than
  // one allocation or more than one anesthesiologist. Indoor Management view
  // keeps the grouped-by-distribution "Payment History" card layout.
  const flatColumns = useMemo(() => [
    // Selection checkbox only where selecting makes sense (unpaid tab) — the
    // Paid tab renders the same flat layout without it.
    ...(selectable ? [{
      data: null,
      title: '',
      orderable: false,
      responsivePriority: 1,
      className: 'text-center',
      render: (_: any, __: string, row: FinalDistribution) => {
        const alreadyPaid = row.payment_status === 'paid'
        const disabled = !doctor || alreadyPaid
        const title = alreadyPaid ? 'Already paid' : !doctor ? 'Filter by a specific anesthesiologist to select items' : ''
        const checked = selectedIds.has(row.id)
        return `<input type="checkbox" class="row-select-checkbox h-4 w-4 rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" data-id="${row.id}" data-provider-id="${row.provider_id ?? ''}" ${checked ? 'checked' : ''} ${disabled ? `disabled title="${title}"` : ''} />`
      },
      defaultContent: '',
    }] : []),
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
      title: 'Anesthesiologist',
      orderable: false,
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
      title: 'Admission',
      orderable: true,
      responsivePriority: 2,
      render: (d: any, __: string, row: FinalDistribution) => {
        const adm = row.admission
        const prefix = adm?.admission_prefix || `#${d}`
        const statusCls = adm?.status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : adm?.status === 'discharged'
            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        return `
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-xs bg-muted px-2 py-0.5 rounded w-fit">${prefix}</span>
              ${adm?.status ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusCls}">${adm.status}</span>` : ''}
            </div>
            <span class="font-medium text-sm">${adm?.patient_name || '—'}</span>
            <span class="text-xs text-muted-foreground">${adm ? `${adm.age}Y / ${adm.sex?.charAt(0)?.toUpperCase() ?? ''}` : ''}${adm?.phone ? ` · ${adm.phone}` : ''}</span>
          </div>
        `
      },
      defaultContent: '',
    },
    {
      data: 'payable_now',
      title: `Payable Amount (${currencySymbol})`,
      orderable: true,
      responsivePriority: 1,
      render: (d: any) => `<span class="font-bold text-violet-600 dark:text-violet-400">${Number(d || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`,
      defaultContent: '0.00',
    },
    {
      data: 'payment_status',
      title: 'Status',
      orderable: true,
      responsivePriority: 2,
      render: (d: any, __: string, row: FinalDistribution) => {
        const badge = !d
          ? `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">⏱ Pending</span>`
          : d === 'paid'
            ? `<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">✓ Paid</span>`
            : d === 'partial'
              ? `<span class="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">≈ Partial</span>`
              : `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">${d}</span>`
        return `
          <div class="flex items-center gap-1.5">
            ${badge}
            <button class="history-btn inline-flex items-center justify-center rounded h-5 w-5 border border-input bg-background hover:bg-accent hover:text-accent-foreground" data-id="${row.id}" type="button" title="Status change history">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"></path><path d="M3.05 11a9 9 0 1 1 .5 4"></path><path d="M3 4v5h5"></path></svg>
            </button>
          </div>
        `
      },
      defaultContent: '',
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
  ], [currencySymbol, page, limit, doctor, selectedIds, selectable])

  const groupedColumns = useMemo(() => [
    {
      data: 'admission_id',
      title: '#',
      orderable: true,
      responsivePriority: 3,
      render: (_: any, __: string, group: AdmissionGroup, meta: any) => {
        const adm = group.admission
        const admDate = adm?.admission_date ? fmtDate(adm.admission_date) : '—'
        const disDate = adm?.discharge_date ? fmtDate(adm.discharge_date) : ''
        return `
          <div class="flex items-center gap-2">
            <button
              class="anesthesia-expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
              type="button"
              data-patient-name="${(adm?.patient_name || '—').replace(/"/g, '&quot;')}"
              data-admission-prefix="${(adm?.admission_prefix || '').replace(/"/g, '&quot;')}"
              data-admission-id="${group.admission_id}"
              data-age="${adm?.age ?? '—'}"
              data-sex="${adm?.sex ?? '—'}"
              data-phone="${adm?.phone ?? '—'}"
              data-diagnosis="${(adm?.diagnosis || '—').replace(/"/g, '&quot;')}"
              data-admission-date="${admDate}"
              data-discharge-date="${disDate}"
              data-patient-status="${adm?.status ?? ''}"
            >+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${meta.row + 1 + (page - 1) * limit}</span>
          </div>
        `
      },
      defaultContent: '',
    },
    {
      data: null,
      title: 'Anesthesiologist',
      orderable: false,
      responsivePriority: 1,
      render: (_: any, __: string, group: AdmissionGroup) => {
        const first = group.items[0]
        const name = group.doctor?.doctor_name || first?.service_name || '—'
        const spec = group.doctor?.speciality || ''
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
      title: 'Patient / Admission',
      orderable: true,
      responsivePriority: 2,
      render: (d: any, __: string, group: AdmissionGroup) => {
        const adm = group.admission
        const prefix = adm?.admission_prefix || `#${d}`
        const name = adm?.patient_name || '—'
        const ageSex = adm ? `${adm.age}/${adm.sex?.charAt(0)?.toUpperCase() ?? ''}` : ''
        return `
          <div class="flex flex-col">
            <span class="font-mono text-xs bg-muted px-2 py-0.5 rounded w-fit">${prefix}</span>
            <span class="font-medium text-sm mt-0.5">${name}</span>
            ${ageSex ? `<span class="text-xs text-muted-foreground">${ageSex}</span>` : ''}
          </div>
        `
      },
      defaultContent: '',
    },
    {
      data: null,
      title: `Payable Distribution (${currencySymbol})`,
      orderable: false,
      responsivePriority: 1,
      render: (_: any, __: string, group: AdmissionGroup) => {
        const fmt = (n: any) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

        // Each allocation to this admission's anesthesia distribution is its
        // own final_distribution row with payable_now = the incremental
        // amount for that payment (not a running total) — see
        // bill-distribution.repository.js `update()`, which inserts a fresh
        // row with `payable_now: addAmount` every time pay_now increases.
        // Bill/Clinic Part/Final Bill are copied onto every such row, so the
        // breakdown is read from just the first one.
        const sortedItems = [...group.items].sort((a, b) => {
          const da = a.payable_created_date ? new Date(a.payable_created_date).getTime() : 0
          const db = b.payable_created_date ? new Date(b.payable_created_date).getTime() : 0
          return da - db
        })
        const first = sortedItems[0]
        const billAmount = Number(first?.bill_amount || 0)
        const lessAmount = Number(first?.less_amount || 0)
        const finalBill = Number(first?.final_bill || 0)
        const totalPayable = sortedItems.reduce((sum, it) => sum + Number(it.payable_now || 0), 0)
        const dueAmount = Math.max(0, finalBill - totalPayable)

        const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth']
        const statusBadge = (s: string | null) => {
          if (!s) return `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">⏱ Pending</span>`
          if (s === 'paid') return `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">✓ Paid</span>`
          if (s === 'partial') return `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">≈ Partial</span>`
          return `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">${s}</span>`
        }

        const historyRows = sortedItems.map((it, idx) => `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-muted-foreground">${ordinals[idx] || `#${idx + 1}`} — ${fmtDate(it.payable_created_date)}</span>
              ${statusBadge(it.payment_status)}
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="font-medium">${fmt(it.payable_now)}</span>
              <button class="history-btn inline-flex items-center justify-center rounded h-5 w-5 border border-input bg-background hover:bg-accent hover:text-accent-foreground" data-id="${it.id}" type="button" title="Status change history">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"></path><path d="M3.05 11a9 9 0 1 1 .5 4"></path><path d="M3 4v5h5"></path></svg>
              </button>
            </div>
          </div>
        `).join('')

        return `
          <div class="flex flex-col gap-2 min-w-[260px]">
            <div>
              <div class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Payment History</div>
              <div class="border-l-2 border-violet-200 dark:border-violet-900 pl-2 space-y-1 text-[11px] max-h-28 overflow-y-auto">
                ${historyRows}
                <div class="flex items-center justify-between gap-2 pt-1 border-t font-semibold">
                  <span>Total</span>
                  <span class="text-violet-600 dark:text-violet-400">${fmt(totalPayable)}</span>
                </div>
              </div>
            </div>
            <div class="border rounded-md p-2 bg-muted/30 space-y-1 text-[11px]">
              <div class="flex items-center justify-between"><span class="text-muted-foreground">Bill Amount</span><span class="font-medium">${fmt(billAmount)}</span></div>
              ${lessAmount > 0 ? `<div class="flex items-center justify-between"><span class="text-muted-foreground">Clinic Part (Profit)</span><span class="font-medium text-orange-600 dark:text-orange-400">-${fmt(lessAmount)}</span></div>` : ''}
              <div class="flex items-center justify-between"><span class="text-muted-foreground">Final Bill</span><span class="font-medium">${fmt(finalBill)}</span></div>
              <div class="flex items-center justify-between"><span class="text-muted-foreground">Payable</span><span class="font-bold text-violet-600 dark:text-violet-400">${fmt(totalPayable)}</span></div>
              <div class="flex items-center justify-between"><span class="text-muted-foreground">Due</span><span class="font-medium ${dueAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600'}">${fmt(dueAmount)}</span></div>
            </div>
          </div>
        `
      },
      defaultContent: '',
    },
  ], [currencySymbol, page, limit])

  const columns = payableOnly ? flatColumns : groupedColumns

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
                : 'Anesthesiologist'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search anesthesiologist..." />
            <CommandList>
              <CommandEmpty>No doctor found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => { setDoctor(0); setDoctorOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', !doctor ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-sm text-muted-foreground">All Anesthesiologists</span>
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
          <SelectItem value="unpaid">Unpaid</SelectItem>
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
            <Syringe className="h-6 w-6 text-violet-500" />
            Anesthesia Bill Management
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

        {/* How-to hint (Finance flat view) — shown while no anesthesiologist is
            chosen; once one is, it is replaced by the bulk-selection action bar
            below. Checkboxes stay disabled without a doctor selection because
            an invoice can only bundle a single provider's bills. */}
        {payableOnly && selectable && !doctor && (
          <div className="flex items-start gap-2.5 mb-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
              To generate a payment invoice, first select an anesthesiologist from the{' '}
              <strong>Anesthesiologist</strong> dropdown above the table — the row checkboxes
              stay disabled until a specific anesthesiologist is chosen, since one invoice can
              only contain a single anesthesiologist&rsquo;s bills. Once selected, check the boxes
              beside the bills you want to pay (or use <strong>Mark All</strong> to select every
              unpaid bill on the page — already-paid rows cannot be selected), verify the
              selected count and total, then click <strong>Create Payment Invoice</strong> to
              generate and print the voucher.
            </p>
          </div>
        )}

        {/* Bulk selection action bar (Finance flat view only) */}
        {payableOnly && selectable && doctor > 0 && eligibleIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 rounded-lg border bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900">
            <div className="flex items-center gap-3 text-sm">
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={toggleSelectAll}>
                {allEligibleSelected ? 'Unmark All' : 'Mark All'}
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <span>
                    <span className="font-semibold">{selectedIds.size}</span> selected · Total{' '}
                    <span className="font-bold text-violet-600 dark:text-violet-400">{format(selectedTotal)}</span>
                  </span>
                </>
              )}
            </div>
            {selectedIds.size > 0 && (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setCreateInvoiceOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Create Payment Invoice
              </Button>
            )}
          </div>
        )}

        {/* DataTable with server-side pagination */}
        <DataTable
          columns={columns}
          data={payableOnly ? records : groupedRows}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          isLoading={isFetching}
          onSearchChange={setSearch}
          tableTitle="Anesthesia Bills"
          filterSlot={filterSlot}
          hideExport
        />
      </main>

      {/* Payment History Dialog */}
      <Dialog open={historyId !== null} onOpenChange={v => !v && setHistoryId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-violet-500" />
              Payment History
            </DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : historyLogs.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No payment changes recorded yet.</div>
          ) : (
            <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
              {historyLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-medium capitalize">
                      {log.previous_status || 'none'} → {log.new_status || 'none'}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{fmtDateTime(log.created_at)}</span>
                  </div>
                  {log.paid_now && (
                    <p className="text-xs text-muted-foreground">Paid date: {fmtDate(log.paid_now)}</p>
                  )}
                  {log.changedBy?.name && (
                    <p className="text-xs text-muted-foreground">By: {log.changedBy.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Payment Invoice Dialog */}
      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-500" />
              Create Payment Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Anesthesiologist</span>
                <span className="font-medium">
                  {selectedRecords[0]?.doctor?.doctor_name || selectedRecords[0]?.service_name || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-mono">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold text-violet-600 text-base">{format(selectedTotal)}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-32 overflow-y-auto border rounded-md p-2 text-xs">
              {selectedRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    {r.admission?.admission_prefix || `#${r.admission_id}`} — {r.admission?.patient_name || 'Unknown patient'}
                  </span>
                  <span className="font-medium shrink-0">{format(Number(r.payable_now || 0))}</span>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="invoice-payment-date" className="text-xs mb-1.5 block">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invoice-payment-date"
                type="date"
                value={invoicePaymentDate}
                onChange={e => setInvoicePaymentDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="invoice-payment-method" className="text-xs mb-1.5 block">
                Payment Method
              </Label>
              <Select value={invoicePaymentMethod} onValueChange={setInvoicePaymentMethod}>
                <SelectTrigger id="invoice-payment-method" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateInvoiceOpen(false)}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!invoicePaymentDate || createInvoiceMutation.isPending}
              onClick={() => createInvoiceMutation.mutate()}
            >
              {createInvoiceMutation.isPending ? 'Creating…' : 'Create & Mark Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
