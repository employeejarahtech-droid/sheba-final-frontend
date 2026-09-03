import { useEffect, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Receipt, CheckCircle2, XCircle } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { useSalesQuery, useCancelSaleMutation } from '@/features/pharmacy/pharmacyQueries'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'
import { useCan } from '@/hooks/use-can'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PharmacySalesPage,
})

function PharmacySalesPage() {
  const can = useCan()
  const canCancel = can('pharmacy.sales.edit')
  const { currencySymbol } = useCurrency()
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

  const { data, isFetching } = useSalesQuery({ page, limit, search })
  const cancel = useCancelSaleMutation()

  const cancelRef = useRef(cancel)
  cancelRef.current = cancel

  const rows = data?.rows || []
  const total = data?.total || 0

  const cards = useMemo(() => ([
    { label: 'Sales (this page)', value: rows.length, icon: Receipt, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Completed', value: rows.filter((s) => s.status === 'completed').length, icon: CheckCircle2, gradientClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Cancelled', value: rows.filter((s) => s.status === 'cancelled').length, icon: XCircle, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
  ]), [rows])

  // Cancel button + expand-row detail, delegated click handling (mirrors the
  // pathology/accounting list pages' pattern).
  useEffect(() => {
    const handleClick = async (e: Event) => {
      const cancelBtn = (e.target as HTMLElement).closest('.js-sale-cancel') as HTMLElement | null
      if (cancelBtn) {
        const id = cancelBtn.dataset.id
        if (!id) return
        if (!window.confirm('Cancel this sale and restore stock?')) return
        try {
          await cancelRef.current.mutateAsync(id)
          toast.success('Sale cancelled, stock restored')
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to cancel sale')
        }
        return
      }

      const expandBtn = (e.target as HTMLElement).closest('.expand-btn') as HTMLButtonElement | null
      if (!expandBtn) return
      const row = expandBtn.closest('tr')
      if (!row) return

      const nextRow = row.nextElementSibling
      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove()
        row.classList.remove('expanded')
        expandBtn.textContent = '+'
        expandBtn.style.backgroundColor = '#10B981'
        return
      }
      if (row.classList.contains('expanded')) return

      const id = expandBtn.dataset.id || ''
      const details = document.createElement('div')
      details.className = 'p-2'
      details.innerHTML = `<div class="text-sm text-muted-foreground py-4 text-center">Loading…</div>`

      const newRow = document.createElement('tr')
      newRow.className = 'child-row-detail'
      const cell = document.createElement('td')
      cell.className = 'p-4 bg-muted/50'
      cell.colSpan = 7
      cell.appendChild(details)
      newRow.appendChild(cell)
      row.parentNode?.insertBefore(newRow, row.nextSibling)
      row.classList.add('expanded')
      expandBtn.textContent = '−'
      expandBtn.style.backgroundColor = '#dc2626'

      try {
        const full = await pharmacyService.getSale(id)
        const items = full.items || []
        details.innerHTML = `
          <div class="border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/5 border-b">
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Medicine</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Qty</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Unit Price</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Discount</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((it: any) => {
                  const netSubtotal = Number(it.subtotal ?? it.unit_price * it.quantity)
                  const discountAmt = Number(it.discount_amount || 0)
                  const discountPct = Number(it.discount_pct || 0)
                  const grossUnitPrice = discountAmt > 0 ? (netSubtotal + discountAmt) / it.quantity : Number(it.unit_price)
                  return `
                  <tr class="border-b last:border-b-0">
                    <td class="px-3 py-2">${it.medicine?.name || '-'}</td>
                    <td class="px-3 py-2 text-right">${it.quantity}</td>
                    <td class="px-3 py-2 text-right">${currencySymbol} ${grossUnitPrice.toFixed(2)}</td>
                    <td class="px-3 py-2 text-right">${discountAmt > 0 ? `${currencySymbol} ${discountAmt.toFixed(2)} (${discountPct}%)` : '-'}</td>
                    <td class="px-3 py-2 text-right">${currencySymbol} ${netSubtotal.toFixed(2)}</td>
                  </tr>
                `}).join('') || '<tr><td colspan="5" class="px-3 py-4 text-center text-muted-foreground">No items</td></tr>'}
              </tbody>
            </table>
          </div>
        `
      } catch {
        details.innerHTML = '<div class="text-sm text-rose-500 py-4 text-center">Failed to load details</div>'
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [currencySymbol])

  const columns = useMemo(() => [
    {
      data: 'id',
      title: 'Sale No.',
      orderable: true,
      render: (data: any, _type: string, row: any) => `
        <div class="flex items-center gap-2">
          <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;" type="button" data-id="${data}">+</button>
          <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.sale_no || `#${data}`}</span>
        </div>`,
    },
    { data: 'patient_name', title: 'Patient', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">Walk-in</span>' },
    { data: 'sale_date', title: 'Date', orderable: true, render: (d: any) => d || '-' },
    { data: 'total_amount', title: `Total (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toFixed(2) },
    { data: 'payment_method', title: 'Payment', orderable: false, render: (d: any) => d || '-' },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/pharmacy/sales/${row.id}/print" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Print</a>
          ${canCancel && row.status !== 'cancelled' ? `<button type="button" class="js-sale-cancel inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Cancel</button>` : ''}
        </div>`,
    },
  ], [canCancel, currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Pharmacy Sales</h1>
          <Link to="/dashboard/pharmacy/sales/create"><Button>New Sale</Button></Link>
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
