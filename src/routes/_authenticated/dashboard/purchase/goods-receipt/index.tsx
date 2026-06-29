import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Truck, CheckCircle2, DollarSign } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { useReceiptsQuery, useDeleteReceiptMutation } from '@/features/purchase/purchaseQueries'
import { StatCards } from '@/features/assets/components/StatCard'
import { useCan } from '@/hooks/use-can'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/purchase/goods-receipt/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: GoodsReceiptPage,
})

const STATUS_BADGE: Record<string, string> = {
  received: 'bg-emerald-100 text-emerald-700', partial: 'bg-amber-100 text-amber-700', pending: 'bg-gray-100 text-gray-700',
}

function GoodsReceiptPage() {
    const can = useCan();
    const canEdit = can('purchase.goods-receipt.edit');
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

  const { data, isFetching } = useReceiptsQuery({ page, limit, search, status: status || undefined })
  const del = useDeleteReceiptMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-grn-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this goods receipt note?')) return
      try { await delRef.current.mutateAsync(id); toast.success('GRN deleted') }
      catch { toast.error('Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const rows = data?.rows || []
  const totalValue = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0)
  const cards = useMemo(() => ([
    { label: 'Total GRNs', value: data?.total ?? 0, icon: Truck, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Fully Received', value: rows.filter((r) => r.status === 'received').length, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Received Value (page)', value: `${currencySymbol} ${totalValue.toLocaleString()}`, icon: DollarSign, headerBg: '#8B5CF6', iconColor: '#8B5CF6' },
  ]), [data, rows, currencySymbol, totalValue])

  const columns = useMemo(() => [
    { data: 'grn_no', title: 'GRN No', orderable: true, render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>` },
    { data: null, title: 'Supplier', orderable: false, render: (_d: any, _t: string, row: any) => row.supplier?.name || '<span class="text-muted-foreground">—</span>' },
    { data: null, title: 'Against Request', orderable: false, render: (_d: any, _t: string, row: any) => row.request?.request_no || '<span class="text-muted-foreground">—</span>' },
    { data: 'received_date', title: 'Received', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'invoice_no', title: 'Invoice', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'total_amount', title: `Amount (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'status', title: 'Status', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-700'}">${d ?? ''}</span>` },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          ${canEdit ? `<a href="/dashboard/purchase/goods-receipt/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          <button type="button" class="js-grn-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes</h1>
          <Link to="/dashboard/purchase/goods-receipt/create"><Button>New GRN</Button></Link>
        </div>

        <StatCards cards={cards} />

        <DataTable
          columns={columns}
          data={rows}
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
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </main>
    </>
  )
}
