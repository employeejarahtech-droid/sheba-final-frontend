import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, Boxes, Layers } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useLowStockMedicinesQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/low-stock/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: LowStockPage,
})

function LowStockPage() {
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

  const { data, isFetching } = useLowStockMedicinesQuery()
  const rows = data || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.category?.name || '').toLowerCase().includes(q) ||
      (m.unit || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const cards = useMemo(() => ([
    { label: 'Low / Out of Stock', value: rows.length, icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Completely Out', value: rows.filter((m) => Number(m.stock_quantity) === 0).length, icon: Boxes, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'At/Below Half of Reorder', value: rows.filter((m) => Number(m.stock_quantity) <= Number(m.reorder_level) / 2).length, icon: Layers, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]), [rows])

  const columns = useMemo(() => [
    { data: 'name', title: 'Medicine', orderable: false },
    { data: null, title: 'Category', orderable: false, render: (_d: any, _t: string, row: any) => row?.category?.name || '<span class="text-muted-foreground">—</span>' },
    { data: 'unit', title: 'Unit', orderable: false, render: (d: any) => d || '—' },
    {
      data: 'stock_quantity', title: 'On Hand', orderable: false,
      render: (d: any, _t: string, row: any) => {
        const qty = Number(d || 0)
        const ratio = Number(row.reorder_level || 0) > 0 ? qty / Number(row.reorder_level) : 1
        const cls = qty === 0 ? 'text-rose-600' : ratio <= 0.5 ? 'text-rose-600' : 'text-amber-600'
        return `<span class="font-semibold ${cls}">${qty}</span>`
      },
    },
    { data: 'reorder_level', title: 'Reorder Level', orderable: false },
    {
      data: null, title: 'Shortfall', orderable: false,
      render: (_d: any, _t: string, row: any) => {
        const shortfall = Math.max(0, Number(row.reorder_level || 0) - Number(row.stock_quantity || 0))
        return `<span class="${shortfall > 0 ? 'text-rose-600 font-semibold' : ''}">${shortfall}</span>`
      },
    },
    {
      data: null, title: 'Batches', orderable: false,
      render: (_d: any, _t: string, row: any) =>
        `<a href="/dashboard/pharmacy/medicines/${row.id}/batches" class="text-blue-600 hover:underline text-sm font-medium">View</a>`,
    },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Low Stock</h1>
            <p className="text-sm text-muted-foreground">Medicines at or under their reorder level</p>
          </div>
          <Link to="/dashboard/pharmacy/stock-in/create" className="text-sm font-medium text-blue-600 hover:underline">
            Record a stock-in →
          </Link>
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
      </main>
    </>
  )
}
