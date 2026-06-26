import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useAssetLocationsQuery, useDeleteLocationMutation } from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'

export const Route = createFileRoute('/_authenticated/dashboard/assets/locations/')({
  component: AssetLocationsPage,
})

function AssetLocationsPage() {
  const { data, isFetching } = useAssetLocationsQuery()
  const del = useDeleteLocationMutation()
  const [search, setSearch] = useState('')

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-loc-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this location?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Location deleted') }
      catch { toast.error('Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const all = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      (l.building || '').toLowerCase().includes(q) ||
      (l.floor || '').toLowerCase().includes(q))
  }, [all, search])

  const cards = useMemo(() => ([
    { label: 'Total Locations', value: all.length, icon: MapPin, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Active', value: all.filter((l) => l.status === 'active').length, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Inactive', value: all.filter((l) => l.status === 'inactive').length, icon: XCircle, headerBg: '#6B7280', iconColor: '#6B7280' },
  ]), [all])

  const columns = useMemo(() => [
    { data: 'name', title: 'Name', orderable: true },
    {
      data: 'building', title: 'Building', orderable: true,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'floor', title: 'Floor', orderable: true,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/assets/locations/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
          <button type="button" class="js-loc-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Asset Locations</h1>
          <Link to="/dashboard/assets/locations/create"><Button>Add Location</Button></Link>
        </div>

        <StatCards cards={cards} />

        <DataTable
          columns={columns}
          data={filtered}
          meta={{ page: 1, limit: Math.max(filtered.length, 1), total: filtered.length }}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
        />
      </main>
    </>
  )
}
