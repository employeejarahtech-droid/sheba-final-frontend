import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Truck, CheckCircle2, Star } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useSuppliersQuery, useDeleteSupplierMutation } from '@/features/purchase/purchaseQueries'
import { StatCards } from '@/features/assets/components/StatCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/purchase/suppliers/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: SuppliersPage,
})

function SuppliersPage() {
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

  const { data, isFetching } = useSuppliersQuery()
  const del = useDeleteSupplierMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-sup-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this supplier?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Supplier deleted') }
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
    return all.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.contact_person || '').toLowerCase().includes(q))
  }, [all, search])

  // Client-side pagination
  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const avgRating = all.length ? (all.reduce((s, x) => s + Number(x.rating || 0), 0) / all.length).toFixed(1) : '0.0'
  const cards = useMemo(() => ([
    { label: 'Total Suppliers', value: all.length, icon: Truck, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Active', value: all.filter((s) => s.status === 'active').length, icon: CheckCircle2, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Avg. Rating', value: avgRating, icon: Star, headerBg: '#F59E0B', iconColor: '#F59E0B' },
  ]), [all, avgRating])

  const columns = useMemo(() => [
    {
      data: 'id',
      title: 'ID',
      orderable: true,
      render: (_d: any, _t: string, row: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">S-${row.id}</span>`,
    },
    { data: 'name', title: 'Name', orderable: true },
    { data: 'category', title: 'Category', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'contact_person', title: 'Contact', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'phone', title: 'Phone', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'rating', title: 'Rating', orderable: true, render: (d: any) => `<span class="font-semibold text-amber-600">${Number(d || 0).toFixed(1)} ★</span>` },
    { data: 'status', title: 'Status', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>` },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/purchase/suppliers/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>
          <button type="button" class="js-sup-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <Link to="/dashboard/purchase/suppliers/create"><Button>Add Supplier</Button></Link>
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
