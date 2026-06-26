import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { FileText, Clock, CheckCircle2, DollarSign } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { useRequestsQuery, usePurchaseDashboardQuery, useDeleteRequestMutation } from '@/features/purchase/purchaseQueries'
import { StatCards } from '@/features/assets/components/StatCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/purchase/requests/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PurchaseRequestsPage,
})

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-violet-100 text-violet-700',
}
const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-700',
}

function PurchaseRequestsPage() {
  const sp: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { currencySymbol } = useCurrency()

  const page = Number(sp?.page) || 1
  const limit = Number(sp?.limit) || 10
  const search = sp?.search || ''
  const status = sp?.status || ''

  const setPage = (p: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: p }) })
  const setLimit = (l: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: l, page: 1 }) })
  const setSearch = (s: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: s, page: 1 }) })
  const setStatus = (s: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, status: s, page: 1 }) })

  const { data, isFetching } = useRequestsQuery({ page, limit, search, status: status || undefined })
  const { data: dash } = usePurchaseDashboardQuery()
  const del = useDeleteRequestMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-req-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this request?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Request deleted') }
      catch { toast.error('Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const cards = useMemo(() => ([
    { label: 'Total Requests', value: dash?.total_requests ?? 0, icon: FileText, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Pending', value: dash?.pending_requests ?? 0, icon: Clock, headerBg: '#F59E0B', iconColor: '#F59E0B' },
    { label: 'Approved', value: dash?.approved_requests ?? 0, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Received Value', value: `${currencySymbol} ${Number(dash?.total_received_value ?? 0).toLocaleString()}`, icon: DollarSign, headerBg: '#8B5CF6', iconColor: '#8B5CF6' },
  ]), [dash, currencySymbol])

  const columns = useMemo(() => [
    { data: 'request_no', title: 'Request No', orderable: true, render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>` },
    { data: 'item_name', title: 'Item', orderable: true },
    { data: 'department', title: 'Department', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'quantity', title: 'Qty', orderable: true, render: (d: any, _t: string, row: any) => `${d ?? ''} ${row.unit || ''}` },
    { data: 'estimated_cost', title: `Est. Cost (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'priority', title: 'Priority', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${PRIORITY_BADGE[d] || 'bg-gray-100 text-gray-700'}">${d ?? ''}</span>` },
    { data: 'status', title: 'Status', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-700'}">${d ?? ''}</span>` },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/purchase/requests/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
          <button type="button" class="js-req-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Purchase Requests</h1>
          <Link to="/dashboard/purchase/requests/create"><Button>New Request</Button></Link>
        </div>

        <StatCards cards={cards} />

        <DataTable
          columns={columns}
          data={data?.rows || []}
          meta={{ page, limit, total: data?.total || 0 }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
          filterSlot={
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </main>
    </>
  )
}
