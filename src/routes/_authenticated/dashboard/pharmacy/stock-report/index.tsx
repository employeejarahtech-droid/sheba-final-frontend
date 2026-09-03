import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BarChart3, Layers, TrendingUp, AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePharmacyCategoriesQuery, useStockReportQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-report/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: StockReportPage,
})

function StockReportPage() {
  const [categoryId, setCategoryId] = useState('all')
  const { format, currencySymbol } = useCurrency()
  const { data: categories } = usePharmacyCategoriesQuery()
  const { data, isFetching } = useStockReportQuery(categoryId !== 'all' ? Number(categoryId) : undefined)

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

  const rows = data?.rows || []
  const totals = data?.totals || { qty: 0, stock_value: 0, potential_value: 0 }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.category?.name || '').toLowerCase().includes(q) ||
      (r.unit || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const cards = useMemo(() => ([
    { label: 'Medicines', value: rows.length, icon: BarChart3, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Units on Hand', value: totals.qty, icon: Layers, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Stock Value (at cost)', value: format(totals.stock_value), icon: TrendingUp, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Potential Sales Value', value: format(totals.potential_value), icon: TrendingUp, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [rows, totals, format])

  const columns = useMemo(() => [
    { data: 'name', title: 'Medicine', orderable: false },
    { data: null, title: 'Category', orderable: false, render: (_d: any, _t: string, row: any) => row?.category?.name || '<span class="text-muted-foreground">—</span>' },
    { data: null, title: 'Unit', orderable: false, render: (_d: any, _t: string, row: any) => row?.unit || '—' },
    {
      data: 'batch_qty', title: 'On Hand', orderable: false,
      render: (d: any, _t: string, row: any) => {
        const qty = Number(d || 0)
        const drift = row.batch_drift
        return `<span class="font-semibold ${drift ? 'text-rose-600' : ''}">${qty}</span>${drift ? ' <span class="text-xs text-rose-500">(cache ' + row.stock_quantity + ')</span>' : ''}`
      },
    },
    { data: 'weighted_avg_cost', title: `Avg Cost (${currencySymbol})`, orderable: false, render: (d: any) => Number(d || 0).toFixed(2) },
    { data: 'stock_value', title: `Stock Value (${currencySymbol})`, orderable: false, render: (d: any) => Number(d || 0).toFixed(2) },
    { data: 'unit_price', title: `Sell Price (${currencySymbol})`, orderable: false, render: (d: any) => Number(d || 0).toFixed(2) },
    { data: 'potential_value', title: `Potential (${currencySymbol})`, orderable: false, render: (d: any) => Number(d || 0).toFixed(2) },
    {
      data: null, title: 'Status', orderable: false,
      render: (_d: any, _t: string, row: any) => row.low_stock
        ? '<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">Low stock</span>'
        : '<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">OK</span>',
    },
    {
      data: null, title: 'Batches', orderable: false,
      render: (_d: any, _t: string, row: any) =>
        `<a href="/dashboard/pharmacy/medicines/${row.id}/batches" class="text-blue-600 hover:underline text-sm font-medium">View</a>`,
    },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Report</h1>
            <p className="text-sm text-muted-foreground">
              Valuation of live batches at cost, with potential sales value at current prices.
            </p>
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        {rows.some((r) => r.batch_drift) && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30 px-4 py-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Some medicines show a cache/batch mismatch — run a Stock Adjustment recount or contact an administrator.
          </div>
        )}

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
