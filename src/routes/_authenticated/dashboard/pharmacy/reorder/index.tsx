import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, TrendingUp, Truck, Plus } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useReorderSuggestionsQuery } from '@/features/pharmacy/pharmacyQueries'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/reorder/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: ReorderSuggestionsPage,
})

function ReorderSuggestionsPage() {
  const { data, isFetching } = useReorderSuggestionsQuery()
  const rows = data || []

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.supplier_name || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const cards = useMemo(() => ([
    { label: 'At / Below Reorder', value: rows.length, icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Units Sold (30d)', value: rows.reduce((s, r) => s + r.sold_30d, 0), icon: TrendingUp, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Suggested Order Qty', value: rows.reduce((s, r) => s + r.suggested_qty, 0), icon: Truck, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]), [rows])

  const columns = useMemo(() => [
    { data: 'name', title: 'Medicine', orderable: true, render: (d: any) => `<span class="font-medium">${d}</span>` },
    { data: 'stock_quantity', title: 'In Stock', orderable: true, render: (d: any) => `<span class="font-semibold ${Number(d) === 0 ? 'text-rose-600' : ''}">${d}</span>` },
    { data: 'reorder_level', title: 'Reorder At', orderable: true },
    { data: 'sold_30d', title: 'Sold (30d)', orderable: true },
    { data: 'avg_daily', title: 'Avg / Day', orderable: true },
    {
      data: 'suggested_qty', title: 'Suggested Qty', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">${d}</span>`,
    },
    { data: 'supplier_name', title: 'Last Supplier', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reorder Suggestions</h1>
            <p className="text-sm text-muted-foreground">
              Active medicines at/below reorder level · suggestion = max(2× reorder − stock, 14 days of sales)
            </p>
          </div>
          <Link to="/dashboard/pharmacy/purchase-orders/create">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Purchase Order</Button>
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
      </Main>
    </>
  )
}
