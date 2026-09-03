import { useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PackageCheck, Truck, DollarSign } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useStockInsQuery, usePharmacyDashboardQuery } from '@/features/pharmacy/pharmacyQueries'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/stock-in/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: StockInPage,
})

function StockInPage() {
  const { currencySymbol, format } = useCurrency()
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

  const { data, isFetching } = useStockInsQuery({ page, limit, search })
  const { data: dashboard } = usePharmacyDashboardQuery()

  const rows = data?.rows || []
  const total = data?.total || 0

  const cards = useMemo(() => ([
    { label: 'Records (this page)', value: rows.length, icon: PackageCheck, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Total Value (all time)', value: format(dashboard?.total_stock_in_value || 0), icon: DollarSign, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Active Suppliers', value: dashboard?.active_suppliers || 0, icon: Truck, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]), [rows, dashboard, format])

  // Handle expand button clicks — fetches the full stock-in (with line items)
  // on demand and renders an inline detail row, matching the pattern used
  // across the pathology/accounting list pages.
  useEffect(() => {
    const handleExpandClick = async (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn')
      if (!button) return
      const btn = button as HTMLButtonElement
      const row = btn.closest('tr')
      if (!row) return

      const nextRow = row.nextElementSibling
      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove()
        row.classList.remove('expanded')
        btn.textContent = '+'
        btn.style.backgroundColor = '#10B981'
        return
      }
      if (row.classList.contains('expanded')) return

      const id = btn.dataset.id || ''
      const details = document.createElement('div')
      details.className = 'p-2'
      details.innerHTML = `<div class="text-sm text-muted-foreground py-4 text-center">Loading…</div>`

      const newRow = document.createElement('tr')
      newRow.className = 'child-row-detail'
      const cell = document.createElement('td')
      cell.className = 'p-4 bg-muted/50'
      cell.colSpan = 6
      cell.appendChild(details)
      newRow.appendChild(cell)
      row.parentNode?.insertBefore(newRow, row.nextSibling)
      row.classList.add('expanded')
      btn.textContent = '−'
      btn.style.backgroundColor = '#dc2626'

      try {
        const full = await pharmacyService.getStockIn(id)
        const items = full.items || []
        details.innerHTML = `
          <div class="border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/5 border-b">
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Medicine</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Batch</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Qty</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Cost/Unit</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Expiry</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((it: any) => `
                  <tr class="border-b last:border-b-0">
                    <td class="px-3 py-2">${it.medicine?.name || '-'}</td>
                    <td class="px-3 py-2">${it.batch_no || '-'}</td>
                    <td class="px-3 py-2 text-right">${it.quantity}</td>
                    <td class="px-3 py-2 text-right">${currencySymbol} ${Number(it.purchase_price).toFixed(2)}</td>
                    <td class="px-3 py-2">${it.expiry_date || '-'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="5" class="px-3 py-4 text-center text-muted-foreground">No items</td></tr>'}
              </tbody>
            </table>
          </div>
        `
      } catch {
        details.innerHTML = '<div class="text-sm text-rose-500 py-4 text-center">Failed to load details</div>'
      }
    }

    document.addEventListener('click', handleExpandClick)
    return () => document.removeEventListener('click', handleExpandClick)
  }, [currencySymbol])

  const columns = useMemo(() => [
    {
      data: 'id',
      title: 'Stock-In No.',
      orderable: true,
      render: (data: any, _type: string, row: any) => `
        <div class="flex items-center gap-2">
          <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;" type="button" data-id="${data}">+</button>
          <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.stock_in_no || `#${data}`}</span>
        </div>`,
    },
    { data: null, title: 'Supplier', orderable: false, render: (_d: any, _t: string, row: any) => row?.supplier?.name || '<span class="text-muted-foreground">—</span>' },
    { data: 'invoice_no', title: 'Invoice No.', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'stock_in_date', title: 'Date', orderable: true, render: (d: any) => d || '-' },
    { data: 'total_amount', title: `Total (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toFixed(2) },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Stock In</h1>
          <Link to="/dashboard/pharmacy/stock-in/create"><Button>Record Stock-In</Button></Link>
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
