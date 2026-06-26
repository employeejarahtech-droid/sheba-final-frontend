import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Clock, AlertCircle, DollarSign } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useCurrency } from '@/hooks/use-currency'
import { useRequestsQuery, useUpdateRequestMutation } from '@/features/purchase/purchaseQueries'
import { StatCards } from '@/features/assets/components/StatCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/purchase/requests/pending/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PendingRequestsPage,
})

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-700',
}

function PendingRequestsPage() {
  const sp: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { currencySymbol } = useCurrency()

  const page = Number(sp?.page) || 1
  const limit = Number(sp?.limit) || 10
  const search = sp?.search || ''

  const setPage = (p: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: p }) })
  const setLimit = (l: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: l, page: 1 }) })
  const setSearch = (s: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: s, page: 1 }) })

  const { data, isFetching } = useRequestsQuery({ page, limit, search, status: 'pending' })
  const update = useUpdateRequestMutation()

  const updRef = useRef(update)
  updRef.current = update
  useEffect(() => {
    const handler = async (e: Event) => {
      const target = e.target as HTMLElement
      const approve = target.closest('.js-approve') as HTMLElement | null
      const reject = target.closest('.js-reject') as HTMLElement | null
      const btn = approve || reject
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      const newStatus = approve ? 'approved' : 'rejected'
      if (!window.confirm(`Mark request as ${newStatus}?`)) return
      try {
        await updRef.current.mutateAsync({ id, body: { status: newStatus } })
        toast.success(`Request ${newStatus}`)
      } catch { toast.error('Action failed') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const totalEstimated = (data?.rows || []).reduce((s, r) => s + Number(r.estimated_cost || 0), 0)
  const cards = useMemo(() => ([
    { label: 'Pending Requests', value: data?.total ?? 0, icon: Clock, headerBg: '#F59E0B', iconColor: '#F59E0B' },
    { label: 'High Priority', value: (data?.rows || []).filter((r) => r.priority === 'high').length, icon: AlertCircle, headerBg: '#EF4444', iconColor: '#EF4444' },
    { label: 'Estimated Value', value: `${currencySymbol} ${totalEstimated.toLocaleString()}`, icon: DollarSign, headerBg: '#3B82F6', iconColor: '#3B82F6' },
  ]), [data, currencySymbol, totalEstimated])

  const columns = useMemo(() => [
    { data: 'request_no', title: 'Request No', orderable: true, render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>` },
    { data: 'item_name', title: 'Item', orderable: true },
    { data: 'department', title: 'Department', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'requested_by', title: 'Requested By', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'estimated_cost', title: `Est. Cost (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'priority', title: 'Priority', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${PRIORITY_BADGE[d] || 'bg-gray-100 text-gray-700'}">${d ?? ''}</span>` },
    {
      data: null, title: 'Action', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <button type="button" class="js-approve inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3" data-id="${row.id}">Approve</button>
          <button type="button" class="js-reject inline-flex items-center justify-center rounded-md text-sm font-medium border border-rose-300 text-rose-600 bg-background hover:bg-rose-50 h-8 px-3" data-id="${row.id}">Reject</button>
        </div>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Pending Requests</h1>
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
        />
      </main>
    </>
  )
}
