import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BookOpenText, ArrowDownToLine, ArrowUpFromLine, Scale } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMedicinesQuery, useStockLedgerQuery } from '@/features/pharmacy/pharmacyQueries'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-ledger/')({
  component: StockLedgerPage,
})

const TYPE_LABEL: Record<string, string> = {
  opening: 'Opening',
  stock_in: 'Stock In',
  sale: 'Sale',
  sale_cancel: 'Sale Cancel',
  sale_return: 'Sale Return',
  purchase_return: 'Purchase Return',
  adjustment_increase: 'Adjustment +',
  adjustment_decrease: 'Adjustment −',
}

const TYPE_STYLE: Record<string, string> = {
  opening: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  stock_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  sale: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  sale_cancel: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  sale_return: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  purchase_return: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  adjustment_increase: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  adjustment_decrease: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
}

function StockLedgerPage() {
  const [medicineId, setMedicineId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500, status: 'active' })
  const medicines = medicinesResult?.rows || []

  const { data, isFetching } = useStockLedgerQuery({
    medicine_id: medicineId || undefined,
    from: from || undefined,
    to: to || undefined,
  })

  const rows = data?.rows || []
  const medicine = data?.medicine
  const filtered = Boolean(from || to)

  const cards = useMemo(() => ([
    { label: 'Medicine', value: medicine?.name || '—', icon: BookOpenText, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: filtered ? 'Opening Balance' : 'Current Stock', value: filtered ? (data?.opening_balance ?? 0) : (medicine?.stock_quantity ?? 0), icon: Scale, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
    { label: 'Movements In (units)', value: rows.filter((r) => r.direction === 'in').reduce((s, r) => s + r.quantity, 0), icon: ArrowDownToLine, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Movements Out (units)', value: rows.filter((r) => r.direction === 'out').reduce((s, r) => s + r.quantity, 0), icon: ArrowUpFromLine, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
  ]), [medicine, rows, filtered, data])

  const columns = useMemo(() => [
    {
      data: 'created_at', title: 'Date', orderable: false,
      render: (d: any) => d ? new Date(d).toLocaleString() : '—',
    },
    {
      data: 'movement_type', title: 'Type', orderable: false,
      render: (d: any) => `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_STYLE[d] || 'bg-gray-100 text-gray-700'}">${TYPE_LABEL[d] || d}</span>`,
    },
    { data: null, title: 'Batch', orderable: false, render: (_d: any, _t: string, row: any) => row?.batch?.batch_no || `<span class="font-mono text-xs">B-${row.batch_id}</span>` },
    { data: 'reference_no', title: 'Reference', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: null, title: 'In', orderable: false, render: (_d: any, _t: string, row: any) => row.direction === 'in' ? `<span class="text-emerald-600 font-semibold">${row.quantity}</span>` : '' },
    { data: null, title: 'Out', orderable: false, render: (_d: any, _t: string, row: any) => row.direction === 'out' ? `<span class="text-rose-600 font-semibold">${row.quantity}</span>` : '' },
    {
      data: 'medicine_balance_after', title: 'Stock Balance', orderable: false,
      render: (d: any) => d != null ? `<span class="font-semibold">${d}</span>` : '—',
    },
  ], [])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Stock Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Immutable in/out history per medicine, with the running stock balance after every movement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Medicine</label>
            <Select value={medicineId} onValueChange={setMedicineId}>
              <SelectTrigger className="w-[260px] h-9"><SelectValue placeholder="Select medicine" /></SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => { setFrom(''); setTo('') }}
            disabled={!from && !to}
          >
            Clear dates
          </Button>
        </div>

        {!medicineId ? (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            Select a medicine to view its ledger.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            meta={{ page: 1, limit: rows.length || 10, total: rows.length }}
            isLoading={isFetching}
            hideExport
          />
        )}
      </main>
    </>
  )
}
