import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Boxes, CheckCircle2, XCircle } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useAssetCategoriesQuery, useDeleteCategoryMutation } from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'

export const Route = createFileRoute('/_authenticated/dashboard/assets/categories/')({
  component: AssetCategoriesPage,
})

function AssetCategoriesPage() {
  const { data, isFetching } = useAssetCategoriesQuery()
  const del = useDeleteCategoryMutation()
  const [search, setSearch] = useState('')

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-cat-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this category?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Category deleted') }
      catch { toast.error('Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const all = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
  }, [all, search])

  const cards = useMemo(() => ([
    { label: 'Total Categories', value: all.length, icon: Boxes, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Active', value: all.filter((c) => c.status === 'active').length, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Inactive', value: all.filter((c) => c.status === 'inactive').length, icon: XCircle, headerBg: '#6B7280', iconColor: '#6B7280' },
  ]), [all])

  const columns = useMemo(() => [
    { data: 'name', title: 'Name', orderable: true },
    {
      data: 'description', title: 'Description', orderable: false,
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
          <a href="/dashboard/assets/categories/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
          <button type="button" class="js-cat-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Asset Categories</h1>
          <Link to="/dashboard/assets/categories/create"><Button>Add Category</Button></Link>
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
