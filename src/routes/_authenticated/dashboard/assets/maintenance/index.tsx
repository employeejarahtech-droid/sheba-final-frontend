import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Wrench, CalendarClock, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useCurrency } from '@/hooks/use-currency'
import { useAssetMaintenanceQuery, useDeleteMaintenanceMutation } from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/assets/maintenance/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: AssetMaintenancePage,
})

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

function AssetMaintenancePage() {
  const { currencySymbol } = useCurrency()

  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = useAssetMaintenanceQuery()
  const del = useDeleteMaintenanceMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-mnt-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this maintenance record?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Maintenance deleted') }
      catch { toast.error('Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const all = data || []

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((m) =>
      (m.asset?.name || '').toLowerCase().includes(q) ||
      (m.asset?.asset_code || '').toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q))
  }, [all, search])

  // Client-side pagination
  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const cards = useMemo(() => ([
    { label: 'Total Records', value: all.length, icon: Wrench, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Scheduled', value: all.filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length, icon: CalendarClock, headerBg: '#F59E0B', iconColor: '#F59E0B' },
    { label: 'Completed', value: all.filter((m) => m.status === 'completed').length, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
  ]), [all])

  const columns = useMemo(() => [
    {
      data: 'id',
      title: 'ID',
      orderable: true,
      render: (_d: any, _t: string, row: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">M-${row.id}</span>`,
    },
    {
      data: null, title: 'Asset', orderable: false,
      render: (_d: any, _t: string, row: any) =>
        `<div class="flex flex-col"><span class="font-medium">${row.asset?.name || `Asset #${row.asset_id}`}</span><span class="text-xs text-muted-foreground font-mono">${row.asset?.asset_code || ''}</span></div>`,
    },
    {
      data: 'type', title: 'Type', orderable: true,
      render: (d: any) => `<span class="capitalize">${d ?? ''}</span>`,
    },
    {
      data: 'scheduled_date', title: 'Scheduled', orderable: true,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'cost', title: `Cost (${currencySymbol})`, orderable: true,
      render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_BADGE[d] || 'bg-gray-100 text-gray-700'}">${String(d || '').replace('_', ' ')}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/assets/maintenance/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
          <button type="button" class="js-mnt-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Scheduling</h1>
          <Link to="/dashboard/assets/maintenance/create"><Button>Schedule Maintenance</Button></Link>
        </div>

        <StatCards cards={cards} />

        <DataTable
          columns={columns}
          data={pageItems}
          meta={{ page, limit, total }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
        />
      </main>
    </>
  )
}
