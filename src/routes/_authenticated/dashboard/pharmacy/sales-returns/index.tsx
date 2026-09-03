import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Undo2, DollarSign, Plus, Search, FileText, ArrowLeft, ChevronRight } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useSalesQuery, useSaleReturnsQuery } from '@/features/pharmacy/pharmacyQueries'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { useCurrency } from '@/hooks/use-currency'

type PickerMode = 'search' | null

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales-returns/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: SaleReturnsPage,
})

function SaleReturnsPage() {
  const { currencySymbol, format } = useCurrency()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>(null)
  const [saleSearch, setSaleSearch] = useState('')
  const { data: pickerSales } = useSalesQuery({ search: saleSearch || undefined, status: 'completed', page: 1, limit: 20 })
  const closePicker = () => { setPickerOpen(false); setPickerMode(null); setSaleSearch('') }
  const pickSale = (id: number) => { closePicker(); navigate({ to: '/dashboard/pharmacy/sales/$id/return', params: { id: String(id) } }) }
  const goStandalone = () => { closePicker(); navigate({ to: '/dashboard/pharmacy/sales-returns/create' }) }

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) => navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data, isFetching } = useSaleReturnsQuery({ page, limit, search })
  const rows = data?.rows || []
  const total = data?.total || 0
  const totalValue = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0)

  const cards = useMemo(() => ([
    { label: 'Returns (this page)', value: rows.length, icon: Undo2, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'Total Refunded (this page)', value: format(totalValue), icon: DollarSign, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
  ]), [rows, totalValue, format])

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
      cell.colSpan = 5
      cell.appendChild(details)
      newRow.appendChild(cell)
      row.parentNode?.insertBefore(newRow, row.nextSibling)
      row.classList.add('expanded')
      btn.textContent = '−'
      btn.style.backgroundColor = '#dc2626'

      try {
        const full = await pharmacyService.getSaleReturn(id)
        const items = full.items || []
        details.innerHTML = `
          <div class="border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/5 border-b">
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Medicine</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Qty</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Unit Price</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((it: any) => `
                  <tr class="border-b last:border-b-0">
                    <td class="px-3 py-2">${it.medicine?.name || '-'}</td>
                    <td class="px-3 py-2 text-right">${it.quantity}</td>
                    <td class="px-3 py-2 text-right">${currencySymbol} ${Number(it.unit_price).toFixed(2)}</td>
                    <td class="px-3 py-2 text-right">${currencySymbol} ${Number(it.subtotal).toFixed(2)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" class="px-3 py-4 text-center text-muted-foreground">No items</td></tr>'}
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
      data: 'id', title: 'Return No.', orderable: true,
      render: (data: any, _type: string, row: any) => `
        <div class="flex items-center gap-2">
          <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;" type="button" data-id="${data}">+</button>
          <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.return_no || `#${data}`}</span>
        </div>`,
    },
    {
      data: null, title: 'Original Sale', orderable: false,
      render: (_d: any, _t: string, row: any) => row?.sale?.sale_no
        || (row?.sale_id ? `#${row.sale_id}` : '<span class="text-xs italic text-muted-foreground">Standalone (no sale)</span>'),
    },
    {
      data: null, title: 'Patient', orderable: false,
      render: (_d: any, _t: string, row: any) => row?.sale?.patient_name || row?.patient_name || '<span class="text-muted-foreground">Walk-in</span>',
    },
    { data: 'reason', title: 'Reason', orderable: false, render: (d: any) => d || '-' },
    { data: 'return_date', title: 'Date', orderable: true, render: (d: any) => d || '-' },
    { data: 'total_amount', title: `Refund (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toFixed(2) },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
            <p className="text-sm text-muted-foreground">Pick the original sale to record a return against it.</p>
          </div>
          <Button onClick={() => setPickerOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" />New Return
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

        <Dialog open={pickerOpen} onOpenChange={(open) => (open ? setPickerOpen(true) : closePicker())}>
          <DialogContent className="p-0 gap-0 max-w-md">
            {pickerMode === null && (
              <>
                <DialogHeader className="px-4 pt-4 pb-2">
                  <DialogTitle>New Return</DialogTitle>
                </DialogHeader>
                <div className="p-4 pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setPickerMode('search')}
                    className="w-full flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    <div className="p-2 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 shadow"><Search className="w-4 h-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">1. Against Existing Sale</p>
                      <p className="text-xs text-muted-foreground">Search and browse recent sales by patient name or receipt no.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={goStandalone}
                    className="w-full flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    <div className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 shadow"><FileText className="w-4 h-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">2. With Sales Invoice</p>
                      <p className="text-xs text-muted-foreground">Not in this system (e.g. an external/paper invoice) — enter medicines and prices directly, like a new sale.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </>
            )}

            {pickerMode === 'search' && (
              <>
                <DialogHeader className="px-4 pt-4 pb-2">
                  <button type="button" onClick={() => { setPickerMode(null); setSaleSearch('') }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <DialogTitle>1. Against Existing Sale</DialogTitle>
                </DialogHeader>
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search by receipt no. or patient name…" value={saleSearch} onValueChange={setSaleSearch} />
                  <CommandList>
                    <CommandEmpty>No completed sale found.</CommandEmpty>
                    <CommandGroup>
                      {(pickerSales?.rows || []).map((s) => (
                        <CommandItem key={s.id} value={String(s.id)} onSelect={() => pickSale(s.id)}>
                          <div className="flex w-full items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{s.sale_no || `#${s.id}`}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.patient_name || 'Walk-in'} · {s.sale_date || '-'}</p>
                            </div>
                            <span className="text-sm font-semibold shrink-0">{currencySymbol} {Number(s.total_amount || 0).toFixed(2)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
