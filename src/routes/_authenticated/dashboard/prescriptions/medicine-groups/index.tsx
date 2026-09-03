import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Boxes, CheckCircle2, XCircle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCan } from '@/hooks/use-can'
import { useMedicineGroupsQuery, useDeleteMedicineGroupMutation } from '@/features/prescriptions/rxMedicinesQueries'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/medicine-groups/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: MedicineGroupsPage,
})

function MedicineGroupsPage() {
  const can = useCan()
  const canEdit = can('prescriptions.edit')
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

  const { data, isFetching } = useMedicineGroupsQuery()
  const del = useDeleteMedicineGroupMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-rx-group-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this medicine group? Groups with medicines cannot be deleted.')) return
      try { await delRef.current.mutateAsync(id); toast.success('Medicine group deleted') }
      catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const all = data?.rows ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((g) => g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
  }, [all, search])

  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const columns = useMemo(() => [
    {
      data: 'id', title: 'ID', orderable: true,
      render: (_d: any, _t: string, row: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">G-${row.id}</span>`,
    },
    { data: 'name', title: 'Group Name', orderable: true },
    {
      data: 'description', title: 'Description', orderable: false,
      render: (d: any) => d || '<span class="text-muted-foreground">—</span>',
    },
    { data: 'sort_order', title: 'Sort', orderable: true },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          ${canEdit ? `<a href="/dashboard/prescriptions/medicine-groups/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          ${canEdit ? `<button type="button" class="js-rx-group-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>` : ''}
        </div>`,
    },
  ], [canEdit])

  const cards = useMemo(() => ([
    { label: 'Total Groups', value: all.length, icon: Boxes, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Active', value: all.filter((g) => g.status === 'active').length, icon: CheckCircle2, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Inactive', value: all.filter((g) => g.status !== 'active').length, icon: XCircle, gradientClass: 'from-gray-500 to-slate-500 shadow-gray-500/20' },
  ]), [all])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medicine Groups</h1>
            <p className="text-sm text-muted-foreground">Group-wise management for the prescription medicine list</p>
          </div>
          {canEdit && <Link to="/dashboard/prescriptions/medicine-groups/create"><Button>Add Group</Button></Link>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

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
      </Main>
    </>
  )
}
