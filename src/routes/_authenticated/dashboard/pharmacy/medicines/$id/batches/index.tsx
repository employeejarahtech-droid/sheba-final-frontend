import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Layers } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useMedicineBatchesQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/medicines/$id/batches/')({
  component: MedicineBatchesPage,
})

const SOURCE_LABEL: Record<string, string> = {
  stock_in: 'Purchase',
  opening: 'Opening',
  adjustment: 'Adjustment',
  legacy: 'Legacy',
}

function MedicineBatchesPage() {
  const { id } = Route.useParams()
  const { format } = useCurrency()
  const { data: batches, isFetching } = useMedicineBatchesQuery(id)

  const rows = batches || []
  const live = rows.filter((b) => b.quantity_remaining > 0)

  const cards = useMemo(() => ([
    { label: 'Total Batches', value: rows.length, icon: Layers, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Live (unsold)', value: live.length, icon: Layers, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Live Units', value: live.reduce((s, b) => s + b.quantity_remaining, 0), icon: Layers, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Live Value (at cost)', value: format(live.reduce((s, b) => s + b.quantity_remaining * Number(b.purchase_price), 0)), icon: Layers, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [rows, live, format])

  const columns = useMemo(() => [
    { data: 'id', title: 'ID', orderable: false, render: (d: any) => `<span class="font-mono text-xs">B-${d}</span>` },
    { data: 'batch_no', title: 'Batch No', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    {
      data: 'expiry_date', title: 'Expiry', orderable: false,
      render: (d: any) => {
        if (!d) return '<span class="text-muted-foreground">No expiry</span>'
        const expired = new Date(d) < new Date()
        return `<span class="${expired ? 'text-rose-600 font-semibold' : ''}">${d}${expired ? ' (expired)' : ''}</span>`
      },
    },
    { data: 'quantity_received', title: 'Received', orderable: false },
    {
      data: 'quantity_remaining', title: 'Remaining', orderable: false,
      render: (d: any) => `<span class="font-semibold ${Number(d) === 0 ? 'text-muted-foreground' : 'text-emerald-600'}">${d}</span>`,
    },
    { data: 'purchase_price', title: 'Cost / Unit', orderable: false, render: (d: any) => format(Number(d || 0)) },
    {
      data: 'source', title: 'Source', orderable: false,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">${SOURCE_LABEL[d] || d}</span>`,
    },
    { data: null, title: 'Stock-In Ref', orderable: false, render: (_d: any, _t: string, row: any) => row?.stockInItem?.stockIn?.stock_in_no || '-' },
  ], [format])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/pharmacy/medicines">
              <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Medicine Batches</h1>
              <p className="text-sm text-muted-foreground">FEFO dispensing order — earliest expiry first</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={rows}
          meta={{ page: 1, limit: rows.length || 10, total: rows.length }}
          isLoading={isFetching}
          hideExport
        />
      </main>
    </>
  )
}
