import { useMemo } from 'react'
import { DataTable } from '@/components/DataTable'
import type { LedgerEntry } from '@/types/pharmacy.types'
import { useCurrency } from '@/hooks/use-currency'

const TYPE_META: Record<string, { label: string; cls: string }> = {
  sale: { label: 'Sale', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  sale_return: { label: 'Sale Return', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  payment: { label: 'Payment', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  stock_in: { label: 'Purchase', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  purchase_return: { label: 'Purchase Return', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
}

/** Chronological ledger with a running balance — shared by the customer
 *  (receivable) and supplier (payable) ledger pages. The server sends
 *  debit/credit per entry; the balance column is computed here in order. */
export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  const { format } = useCurrency()

  const rows = useMemo(() => {
    let balance = 0
    return [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => {
        balance = Math.round((balance + e.debit - e.credit) * 100) / 100
        return { ...e, balance, key: `${e.type}-${e.ref || e.payment_id || e.sale_id || e.stock_in_id || e.date}-${e.date}` }
      })
  }, [entries])

  const columns = useMemo(() => [
    {
      data: 'date', title: 'Date', orderable: false,
      render: (d: any) => new Date(d).toLocaleString(),
    },
    {
      data: 'type', title: 'Type', orderable: false,
      render: (d: any) => {
        const m = TYPE_META[d] || { label: d, cls: 'bg-gray-100 text-gray-700' }
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full ${m.cls}">${m.label}</span>`
      },
    },
    { data: 'ref', title: 'Reference', orderable: false, render: (d: any) => d ? `<span class="font-mono text-xs">${d}</span>` : '<span class="text-muted-foreground">—</span>' },
    { data: 'payment_method', title: 'Method', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'debit', title: 'Debit (+)', orderable: false, render: (d: any) => (Number(d) ? format(Number(d)) : '—') },
    { data: 'credit', title: 'Credit (−)', orderable: false, render: (d: any) => (Number(d) ? format(Number(d)) : '—') },
    {
      data: 'balance', title: 'Balance', orderable: false,
      render: (d: any) => {
        const v = Number(d)
        const cls = v > 0.004 ? 'font-semibold text-rose-600' : v < -0.004 ? 'font-semibold text-emerald-600' : 'font-semibold'
        return `<span class="${cls}">${format(v)}</span>`
      },
    },
  ], [format])

  return (
    <DataTable
      columns={columns}
      data={rows}
      meta={{ page: 1, limit: rows.length || 10, total: rows.length }}
      hideExport
    />
  )
}
