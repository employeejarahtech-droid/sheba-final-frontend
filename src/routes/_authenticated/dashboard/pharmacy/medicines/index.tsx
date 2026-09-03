import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Pill, CheckCircle2, AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useMedicinesQuery, useDeleteMedicineMutation, useLowStockMedicinesQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'
import { useCan } from '@/hooks/use-can'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/medicines/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: MedicinesPage,
})

function MedicinesPage() {
  const can = useCan()
  const canEdit = can('pharmacy.medicines.edit')
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

  const { data, isFetching } = useMedicinesQuery({ page, limit, search })
  const { data: lowStock } = useLowStockMedicinesQuery()
  const del = useDeleteMedicineMutation()

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-medicine-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this medicine?')) return
      try { await delRef.current.mutateAsync(id); toast.success('Medicine deleted') }
      catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const rows = data?.rows || []
  const total = data?.total || 0

  const cards = useMemo(() => ([
    { label: 'Total (this page)', value: rows.length, icon: Pill, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Active', value: rows.filter((m) => m.status === 'active').length, icon: CheckCircle2, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Low Stock', value: lowStock?.length || 0, icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [rows, lowStock])

  const columns = useMemo(() => [
    {
      data: 'id',
      title: 'ID',
      orderable: true,
      render: (_d: any, _t: string, row: any) =>
        `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">M-${row.id}</span>`,
    },
    { data: 'name', title: 'Name', orderable: true },
    { data: 'generic_name', title: 'Generic Name', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: null, title: 'Category', orderable: false, render: (_d: any, _t: string, row: any) => row?.category?.name || '<span class="text-muted-foreground">—</span>' },
    { data: 'unit', title: 'Unit', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'unit_price', title: `Price (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toFixed(2) },
    {
      data: 'stock_quantity', title: 'Stock', orderable: true,
      render: (d: any, _t: string, row: any) => {
        const qty = Number(d || 0)
        const low = qty <= Number(row.reorder_level || 0)
        return `<span class="font-semibold ${low ? 'text-rose-600' : 'text-emerald-600'}">${qty}</span>`
      },
    },
    { data: 'status', title: 'Status', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>` },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          ${canEdit ? `<a href="/dashboard/pharmacy/medicines/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Edit</a>` : ''}
          <a href="/dashboard/pharmacy/medicines/${row.id}/batches" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Batches</a>
          <button type="button" class="js-medicine-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>
        </div>`,
    },
  ], [canEdit, currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Medicines</h1>
          <Link to="/dashboard/pharmacy/medicines/create"><Button>Add Medicine</Button></Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={rows}
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
