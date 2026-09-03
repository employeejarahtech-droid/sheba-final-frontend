import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ClipboardEdit, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useStockAdjustmentsQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-adjustments/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: StockAdjustmentsPage,
})

function StockAdjustmentsPage() {
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = useStockAdjustmentsQuery({ page, limit, search })
  const rows = data?.rows || []
  const total = data?.total || 0

  const cards = useMemo(() => ([
    { label: 'Records (this page)', value: rows.length, icon: ClipboardEdit, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Increases', value: rows.filter((r) => r.adjustment_type === 'increase').length, icon: ArrowUpCircle, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Decreases', value: rows.filter((r) => r.adjustment_type === 'decrease').length, icon: ArrowDownCircle, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
  ]), [rows])

  const columns = useMemo(() => [
    { data: null, title: 'Medicine', orderable: false, render: (_d: any, _t: string, row: any) => row?.medicine?.name || '-' },
    {
      data: 'adjustment_type', title: 'Direction', orderable: false,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'increase' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${d === 'increase' ? '+ Increase' : '− Decrease'}</span>`,
    },
    { data: 'quantity', title: 'Quantity', orderable: false },
    { data: 'reason', title: 'Reason', orderable: false },
    { data: 'notes', title: 'Notes', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'created_at', title: 'Date', orderable: false, render: (d: any) => d ? String(d).slice(0, 10) : '-' },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <Link to="/dashboard/pharmacy/stock-adjustments/create"><Button>New Adjustment</Button></Link>
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
