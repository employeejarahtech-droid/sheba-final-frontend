import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ClipboardList, Truck, CheckCircle2, Plus } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { usePurchaseOrdersQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch(''),
})

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/purchase-orders/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PurchaseOrdersPage,
})

function PurchaseOrdersPage() {
  const { format } = useCurrency()
  const { formatDate } = useDateFormat()
  // formatDate() needs a Date — DATEONLY strings arrive as 'YYYY-MM-DD'
  const fmtDate = (v?: string | null) => (v ? formatDate(new Date(v)) : '—')
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search
  const status = searchParams.status

  const setStatus = (v: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, status: v === 'all' ? '' : v, page: 1 }) })
  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = usePurchaseOrdersQuery({
    status: status || undefined,
    search: search || undefined,
  })
  const all = data?.rows || []

  const cards = useMemo(() => ([
    { label: 'Purchase Orders', value: data?.total ?? 0, icon: ClipboardList, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Open (ordered)', value: all.filter((p) => p.status === 'ordered').length, icon: Truck, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Fully Received', value: all.filter((p) => p.status === 'received').length, icon: CheckCircle2, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
  ]), [data?.total, all])

  const columns = useMemo(() => [
    { data: 'po_no', title: 'PO No', orderable: false, render: (d: any, _t: string, row: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${d || `#${row.id}`}</span>` },
    { data: 'supplier', title: 'Supplier', orderable: false, render: (d: any) => d?.name || '<span class="text-muted-foreground">—</span>' },
    { data: 'order_date', title: 'Ordered', orderable: false, render: (d: any) => fmtDate(d) },
    { data: 'expected_date', title: 'Expected', orderable: false, render: (d: any) => (d ? formatDate(new Date(d)) : '<span class="text-muted-foreground">—</span>') },
    { data: 'total_amount', title: 'Total', orderable: false, render: (d: any) => format(Number(d || 0)) },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CLS[d] || 'bg-gray-100 text-gray-700'}">${String(d).replace('_', ' ')}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <a href="/dashboard/pharmacy/purchase-orders/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">View</a>`,
    },
  ], [format, formatDate])

  const start = (page - 1) * limit
  const pageItems = all.slice(start, start + limit)

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground">Order from suppliers, then receive into batch stock</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/pharmacy/reorder"><Button variant="outline">Reorder Suggestions</Button></Link>
            <Link to="/dashboard/pharmacy/purchase-orders/create"><Button><Plus className="mr-2 h-4 w-4" /> New PO</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={pageItems}
          meta={{ page, limit, total: data?.total ?? 0 }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
          filterSlot={
            <Select value={status || 'all'} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="partially_received">Partially received</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </Main>
    </>
  )
}
