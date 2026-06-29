import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Package, DollarSign, CheckCircle2, Wrench } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { useAssetsQuery, useAssetDashboardQuery, useDeleteAssetMutation } from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'
import { useCan } from '@/hooks/use-can'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/assets/list/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: AllAssetsPage,
})

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  in_repair: 'bg-amber-100 text-amber-700',
  retired: 'bg-gray-100 text-gray-700',
  disposed: 'bg-rose-100 text-rose-700',
}

function AllAssetsPage() {
    const can = useCan();
    const canEdit = can('assets.list.edit');
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

  const { data, isFetching } = useAssetsQuery({ page, limit, search, status: status || undefined })
  const { data: dash } = useAssetDashboardQuery()
  const del = useDeleteAssetMutation()

  // Keep latest delete fn for the delegated listener
  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-asset-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this asset? This cannot be undone.')) return
      try {
        await delRef.current.mutateAsync(id)
        toast.success('Asset deleted')
      } catch {
        toast.error('Failed to delete')
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const cards = useMemo(() => ([
    { label: 'Total Assets', value: dash?.total_assets ?? 0, icon: Package, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Total Value', value: `${currencySymbol} ${Number(dash?.total_value ?? 0).toLocaleString()}`, icon: DollarSign, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Active', value: dash?.active ?? 0, icon: CheckCircle2, headerBg: '#8B5CF6', iconColor: '#8B5CF6' },
    { label: 'In Repair', value: dash?.in_repair ?? 0, icon: Wrench, headerBg: '#F59E0B', iconColor: '#F59E0B' },
  ]), [dash, currencySymbol])

  const columns = useMemo(() => [
    {
      data: 'asset_code', title: 'Code', orderable: true,
      render: (_d: any, _t: string, row: any) => {
        const assetCode = row.asset_code ?? '';
        const displayCode = assetCode.startsWith('AST-') ? assetCode : `AST-${assetCode}`;
        return `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${displayCode}</span>`;
      },
    },
    { data: 'name', title: 'Name', orderable: true },
    {
      data: null, title: 'Category', orderable: false,
      render: (_d: any, _t: string, row: any) => row.category?.name || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: null, title: 'Location', orderable: false,
      render: (_d: any, _t: string, row: any) => row.location?.name || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'purchase_cost', title: `Cost (${currencySymbol})`, orderable: true,
      render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      data: 'condition', title: 'Condition', orderable: true,
      render: (d: any) => `<span class="capitalize">${d ?? ''}</span>`,
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-700'}">${String(d || '').replace('_', ' ')}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          ${canEdit ? `<a href="/dashboard/assets/list/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          <button type="button" class="js-asset-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">All Assets</h1>
          <Link to="/dashboard/assets/list/create"><Button>Add Asset</Button></Link>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </main>
    </>
  )
}
