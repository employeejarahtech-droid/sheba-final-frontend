import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Truck, Wallet, AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { PaymentDialog } from '@/features/pharmacy/components/PaymentDialog'
import { useSupplierDuesQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import type { SupplierDueRow } from '@/types/pharmacy.types'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/supplier-dues/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: SupplierDuesPage,
})

function SupplierDuesPage() {
  const { format } = useCurrency()
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

  const { data: dues, isFetching } = useSupplierDuesQuery()
  const [payTarget, setPayTarget] = useState<SupplierDueRow | null>(null)

  const all = dues || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((s) => s.name.toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q))
  }, [all, search])

  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const totalDue = all.reduce((s, c) => s + c.due, 0)
  const cards = useMemo(() => ([
    { label: 'Suppliers', value: all.length, icon: Truck, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Total Payable', value: format(totalDue), icon: Wallet, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'With Payable', value: all.filter((s) => s.due > 0.004).length, icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [all, totalDue, format])

  useEffect(() => {
    const handler = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-ph-sup-pay') as HTMLElement | null
      if (!btn) return
      const row = all.find((s) => String(s.id) === btn.dataset.id)
      if (row) setPayTarget(row)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [all])

  const columns = useMemo(() => [
    { data: 'name', title: 'Supplier', orderable: true, render: (d: any) => `<span class="font-medium">${d}</span>` },
    { data: 'phone', title: 'Phone', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'purchases_count', title: 'Purchases', orderable: true },
    { data: 'purchased', title: 'Purchased', orderable: true, render: (d: any) => format(Number(d || 0)) },
    { data: 'paid_at_purchase', title: 'Paid @ Purchase', orderable: true, render: (d: any) => format(Number(d || 0)) },
    { data: 'returns_total', title: 'Returned', orderable: true, render: (d: any) => format(Number(d || 0)) },
    { data: 'payments_total', title: 'Payments', orderable: true, render: (d: any) => format(Number(d || 0)) },
    {
      data: 'due', title: 'Payable', orderable: true,
      render: (d: any) => {
        const v = Number(d)
        const cls = v > 0.004 ? 'font-semibold text-rose-600' : 'text-muted-foreground'
        return `<span class="${cls}">${format(v)}</span>`
      },
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/pharmacy/supplier-dues/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Ledger</a>
          <button type="button" class="js-ph-sup-pay inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3" data-id="${row.id}">Pay</button>
        </div>`,
    },
  ], [format])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Supplier Dues</h1>
          <p className="text-sm text-muted-foreground">Payables: purchases − paid at purchase − returns − payments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={pageItems}
          meta={{ page, limit, total: filtered.length }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
        />

        {payTarget && (
          <PaymentDialog
            open={!!payTarget}
            onOpenChange={(v) => !v && setPayTarget(null)}
            mode="supplier"
            targetId={payTarget.id}
            targetName={payTarget.name}
            currentDue={payTarget.due}
          />
        )}
      </Main>
    </>
  )
}
