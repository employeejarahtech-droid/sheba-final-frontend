import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Clock, PackageX } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExpiryReportQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/expiry-report/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: ExpiryReportPage,
})

function ExpiryReportPage() {
  const [withinDays, setWithinDays] = useState('90')
  const { data, isFetching } = useExpiryReportQuery(Number(withinDays))
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
      (r.medicine?.name || '').toLowerCase().includes(q) ||
      (r.batch_no || '').toLowerCase().includes(q) ||
      (r.stockInItem?.stockIn?.stock_in_no || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const total = filtered.length
  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const cards = useMemo(() => ([
    { label: 'Live Batches at Risk', value: rows.length, icon: Clock, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Already Expired', value: rows.filter((r) => r.is_expired).length, icon: PackageX, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'Value at Risk', value: rows.reduce((s, r) => s + Number(r.value_at_risk || 0), 0).toFixed(2), icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [rows])

  const columns = useMemo(() => [
    { data: null, title: 'Medicine', orderable: false, render: (_d: any, _t: string, row: any) => row?.medicine?.name || '-' },
    { data: 'batch_no', title: 'Batch', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'quantity_remaining', title: 'Qty Remaining', orderable: false, render: (d: any) => `<span class="font-semibold">${d}</span>` },
    {
      data: 'value_at_risk', title: 'Value at Risk', orderable: false,
      render: (d: any) => Number(d || 0).toFixed(2),
    },
    {
      data: 'expiry_date', title: 'Expiry Date', orderable: false,
      render: (d: any, _t: string, row: any) => {
        const cls = row.is_expired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
        return `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}">${d || '—'}${row.is_expired ? ' · expired' : ''}</span>`
      },
    },
    { data: null, title: 'Stock-In Ref', orderable: false, render: (_d: any, _t: string, row: any) => row?.stockInItem?.stockIn?.stock_in_no || '-' },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expiry Report</h1>
            <p className="text-sm text-muted-foreground">
              Live (unsold) stock nearing or past expiry, with the value still on shelves.
            </p>
          </div>
          <Select value={withinDays} onValueChange={setWithinDays}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
              <SelectItem value="180">Next 180 days</SelectItem>
              <SelectItem value="365">Next 365 days</SelectItem>
            </SelectContent>
          </Select>
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
