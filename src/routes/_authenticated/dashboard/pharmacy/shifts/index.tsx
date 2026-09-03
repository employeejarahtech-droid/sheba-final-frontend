import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Clock, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import {
  useCloseShiftMutation, useOpenShiftMutation, useShiftQuery, useShiftsQuery,
} from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { useLiveUser } from '@/hooks/use-live-user'
import type { PharmacyShift } from '@/types/pharmacy.types'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  status: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/shifts/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PharmacyShiftsPage,
})

function PharmacyShiftsPage() {
  const { format } = useCurrency()
  const { formatDateTime } = useDateFormat()
  const { user } = useLiveUser()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const status = searchParams.status

  const setStatus = (v: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, status: v === 'all' ? '' : v, page: 1 }) })
  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })

  const { data: shifts, isFetching } = useShiftsQuery(status ? { status } : undefined)
  const openShift = useOpenShiftMutation()
  const closeShift = useCloseShiftMutation()

  const myId = user?.id != null ? Number(user.id) : null
  const myOpen = useMemo(
    () => (shifts || []).find((s) => s.status === 'open' && myId != null && Number(s.user_id) === myId),
    [shifts, myId]
  )

  const [openDialog, setOpenDialog] = useState(false)
  const [openingCash, setOpeningCash] = useState('0')
  const [openNotes, setOpenNotes] = useState('')
  const [closeTarget, setCloseTarget] = useState<PharmacyShift | null>(null)
  const [closingCash, setClosingCash] = useState('')

  const submitOpen = async () => {
    const amt = Number(openingCash)
    if (Number.isNaN(amt) || amt < 0) { toast.error('Opening cash cannot be negative'); return }
    try {
      await openShift.mutateAsync({ opening_cash: amt, notes: openNotes || undefined })
      toast.success('Shift opened — sales from now will be attributed to it')
      setOpenDialog(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to open shift')
    }
  }

  const submitClose = async () => {
    if (!closeTarget) return
    const amt = Number(closingCash)
    if (closingCash === '' || Number.isNaN(amt) || amt < 0) { toast.error('Count the drawer and enter the closing cash'); return }
    try {
      const res = await closeShift.mutateAsync({ id: closeTarget.id, body: { closing_cash: amt } })
      const s = res?.data ?? res
      const variance = Number(s?.variance ?? 0)
      toast.success(
        `Shift #${closeTarget.id} closed · expected ${format(Number(s?.expected_cash ?? 0))} · variance ${format(variance)}`
      )
      setCloseTarget(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close shift')
    }
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-shift-close') as HTMLElement | null
      if (!btn) return
      const row = (shifts || []).find((s) => String(s.id) === btn.dataset.id)
      if (row) {
        setClosingCash('')
        setCloseTarget(row)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [shifts])

  const all = shifts || []
  const closed = all.filter((s) => s.status === 'closed')
  const lastVariance = closed.length ? Number(closed[0]?.variance ?? 0) : null
  const cards = useMemo(() => ([
    { label: 'Open Shifts', value: all.filter((s) => s.status === 'open').length, icon: Clock, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Closed (recent)', value: closed.length, icon: Wallet, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Last Variance', value: lastVariance == null ? '—' : format(lastVariance), icon: lastVariance != null && lastVariance < 0 ? TrendingDown : TrendingUp, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]), [all, closed, lastVariance, format])

  const columns = useMemo(() => [
    { data: 'id', title: 'Shift', orderable: true, render: (d: any) => `<span class="font-mono text-xs">#${d}</span>` },
    { data: 'user', title: 'User', orderable: false, render: (d: any) => d?.name || `#${d}` },
    { data: 'opened_at', title: 'Opened', orderable: false, render: (d: any) => formatDateTime(d) },
    {
      data: 'closed_at', title: 'Closed', orderable: false,
      render: (d: any) => d ? formatDateTime(d) : '<span class="text-muted-foreground">—</span>',
    },
    { data: 'opening_cash', title: 'Opening', orderable: false, render: (d: any) => format(Number(d || 0)) },
    {
      data: 'sales_count', title: 'Sales', orderable: false,
      render: (d: any) => d != null ? `${d}` : '<span class="text-muted-foreground">open…</span>',
    },
    {
      data: 'sales_total', title: 'Sales Total', orderable: false,
      render: (d: any) => d != null ? format(Number(d)) : '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'variance', title: 'Variance', orderable: false,
      render: (d: any) => {
        if (d == null) return '<span class="text-muted-foreground">—</span>'
        const v = Number(d)
        const cls = Math.abs(v) < 0.005 ? 'text-muted-foreground' : v < 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'
        return `<span class="${cls}">${format(v)}</span>`
      },
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => row.status === 'open'
        ? `<button type="button" class="js-shift-close inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-8 px-3" data-id="${row.id}">Close</button>`
        : '',
    },
  ], [format, formatDateTime])

  const start = (page - 1) * limit
  const pageItems = all.slice(start, start + limit)

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">POS Shifts</h1>
            <p className="text-sm text-muted-foreground">Counter shifts with cash reconciliation</p>
          </div>
          {!myOpen && (
            <Button onClick={() => { setOpeningCash('0'); setOpenNotes(''); setOpenDialog(true) }}>
              <Clock className="mr-2 h-4 w-4" /> Open Shift
            </Button>
          )}
        </div>

        {myOpen && (
          <div className="mb-6 rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">Your shift #{myOpen.id} is open</span>
              <span className="text-muted-foreground"> since {formatDateTime(myOpen.opened_at)} · opening cash {format(Number(myOpen.opening_cash))}. New sales are attributed to it.</span>
            </div>
            <Button onClick={() => { setClosingCash(''); setCloseTarget(myOpen) }} className="bg-blue-600 hover:bg-blue-700 text-white">Close My Shift</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={pageItems}
          meta={{ page, limit, total: all.length }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
          filterSlot={
            <Select value={status || 'all'} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Open-shift dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Open Shift</DialogTitle>
              <DialogDescription>Count the drawer first — this is the opening float.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Opening Cash</label>
                <Input type="number" step="0.01" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea placeholder="Optional" className="min-h-[60px]" value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={openShift.isPending}>Cancel</Button>
              <Button onClick={submitOpen} disabled={openShift.isPending}>{openShift.isPending ? 'Opening…' : 'Open Shift'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CloseShiftDialog
          target={closeTarget}
          closingCash={closingCash}
          setClosingCash={setClosingCash}
          onClose={() => setCloseTarget(null)}
          onSubmit={submitClose}
          pending={closeShift.isPending}
        />
      </Main>
    </>
  )
}

/** Close flow: live aggregates come from the shift DETAIL endpoint (the list
 *  leaves them NULL while open), expected cash is shown before confirm. */
function CloseShiftDialog({ target, closingCash, setClosingCash, onClose, onSubmit, pending }: {
  target: PharmacyShift | null
  closingCash: string
  setClosingCash: (v: string) => void
  onClose: () => void
  onSubmit: () => void
  pending: boolean
}) {
  const { format } = useCurrency()
  const { data: detail } = useShiftQuery(target ? String(target.id) : '')
  const agg = detail?.aggregates
  const expected = agg ? Number(target?.opening_cash ?? detail?.opening_cash ?? 0) + Number(agg.cash_sales) : null
  const variance = expected != null && closingCash !== '' ? Number(closingCash) - expected : null

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Close Shift {target ? `#${target.id}` : ''}</DialogTitle>
          <DialogDescription>Count the drawer and enter the cash on hand.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
            <span className="text-muted-foreground">Sales</span><span className="text-right font-medium">{agg ? `${agg.sales_count} · ${format(agg.sales_total)}` : '…'}</span>
            <span className="text-muted-foreground">Cash sales</span><span className="text-right font-medium">{agg ? format(agg.cash_sales) : '…'}</span>
            <span className="text-muted-foreground">Refunds (reported)</span><span className="text-right font-medium">{agg ? format(agg.refunds_total) : '…'}</span>
            <span className="text-muted-foreground">Opening cash</span><span className="text-right font-medium">{format(Number(target?.opening_cash ?? 0))}</span>
            <span className="text-muted-foreground font-semibold">Expected cash</span>
            <span className="text-right font-semibold">{expected != null ? format(expected) : '…'}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Closing Cash (counted)</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} autoFocus />
          </div>
          {variance != null && (
            <div className={`rounded-md border p-3 ${Math.abs(variance) < 0.005 ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-rose-300 bg-rose-50 dark:bg-rose-950/30'}`}>
              Variance: <span className="font-semibold">{format(variance)}</span>
              {Math.abs(variance) >= 0.005 && <span className="text-muted-foreground"> (closing − expected)</span>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={onSubmit} disabled={pending || !agg}>{pending ? 'Closing…' : 'Close Shift'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
