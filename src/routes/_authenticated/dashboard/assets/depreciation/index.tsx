import { useMemo, useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DollarSign, TrendingDown, Wallet, CalendarClock, History, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useCurrency } from '@/hooks/use-currency'
import {
  useAssetDepreciationQuery,
  useDepreciationRunsQuery,
  usePostDepreciationMutation,
} from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/date-picker'

export const Route = createFileRoute('/_authenticated/dashboard/assets/depreciation/')({
  component: AssetDepreciationPage,
})

function AssetDepreciationPage() {
  const { currencySymbol } = useCurrency()
  const { data: scheduleData, isFetching: fetchingSchedule } = useAssetDepreciationQuery()
  const { data: runsData, isFetching: fetchingRuns } = useDepreciationRunsQuery()
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  // Schedule filtering
  const allSchedule = scheduleData || []
  const filteredSchedule = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allSchedule
    return allSchedule.filter((r) => r.name.toLowerCase().includes(q) || r.asset_code.toLowerCase().includes(q))
  }, [allSchedule, search])

  // Schedule totals
  const totals = useMemo(() => ({
    cost: allSchedule.reduce((s, r) => s + Number(r.purchase_cost || 0), 0),
    accumulated: allSchedule.reduce((s, r) => s + Number(r.accumulated_depreciation || 0), 0),
    book: allSchedule.reduce((s, r) => s + Number(r.book_value || 0), 0),
  }), [allSchedule])

  const fmt = (n: number) => `${currencySymbol} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Mutation
  const postDep = usePostDepreciationMutation()
  const handlePostDepreciation = () => {
    postDep.mutate(selectedMonth, {
      onSuccess: (res: any) => {
        const d = res?.data
        toast.success(
          `Depreciation posted for ${d?.period}: ${fmt(Number(d?.total_amount || 0))} across ${d?.asset_count} asset(s)`
        )
        setIsModalOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to post depreciation')
      },
    })
  }

  const cards = [
    { label: 'Total Cost', value: fmt(totals.cost), icon: DollarSign, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Accumulated Depreciation', value: fmt(totals.accumulated), icon: TrendingDown, headerBg: '#F59E0B', iconColor: '#F59E0B' },
    { label: 'Net Book Value', value: fmt(totals.book), icon: Wallet, headerBg: '#10B981', iconColor: '#10B981' },
  ]

  // Handle expand button clicks using event delegation
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
        const button = (e.target as HTMLElement).closest('.expand-btn');
        if (!button) return;

        const btn = button as HTMLButtonElement;
        const row = btn.closest('tr');
        if (!row) return;

        const isExpanded = row.classList.contains('expanded');
        const nextRow = row.nextElementSibling;

        // Toggle collapse
        if (nextRow && nextRow.classList.contains('child-row-detail')) {
            nextRow.remove();
            row.classList.remove('expanded');
            btn.textContent = '+';
            btn.style.backgroundColor = '#3B82F6';
            return;
        }

        // Don't expand if already expanded
        if (isExpanded) return;

        // Get data from attributes
        const name = btn.dataset.name || '-';
        const category = btn.dataset.category || '-';
        const purchaseDate = btn.dataset.purchaseDate || '-';
        const method = btn.dataset.depreciationMethod || '-';
        const yearsElapsed = btn.dataset.yearsElapsed || '0';

        // Create card HTML
        const cardContainer = document.createElement('div');
        cardContainer.className = 'max-w-3xl mx-auto my-4';
        cardContainer.innerHTML = `
            <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <h2 class="text-lg font-semibold text-white">Asset Information</h2>
                    <p class="text-blue-100 text-sm">Detailed overview of selected asset</p>
                </div>
                <div class="p-6">
                    <ul class="grid md:grid-cols-2 gap-6 text-sm">
                        <li class="flex flex-col">
                            <span class="text-gray-500">Asset Name</span>
                            <span class="font-semibold text-gray-800 text-base">${name}</span>
                        </li>
                        <li class="flex flex-col">
                            <span class="text-gray-500">Category</span>
                            <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-purple-100 text-purple-700">${category}</span>
                        </li>
                        <li class="flex flex-col">
                            <span class="text-gray-500">Purchase Date</span>
                            <span class="font-medium text-gray-700">${purchaseDate}</span>
                        </li>
                        <li class="flex flex-col">
                            <span class="text-gray-500">Depreciation Method</span>
                            <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-teal-100 text-teal-700 uppercase">${method.replace('_', ' ')}</span>
                        </li>
                        <li class="flex flex-col">
                            <span class="text-gray-500">Years Elapsed</span>
                            <span class="font-bold text-lg text-blue-600">${yearsElapsed} Years</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;

        // Create new row
        const newRow = document.createElement('tr');
        newRow.className = 'child-row-detail';
        const cell = document.createElement('td');
        cell.className = 'p-4 bg-muted/50';
        cell.colSpan = 10;
        cell.appendChild(cardContainer);
        newRow.appendChild(cell);

        row.parentNode?.insertBefore(newRow, row.nextSibling);
        row.classList.add('expanded');
        btn.textContent = '−';
        btn.style.backgroundColor = '#dc2626';
    };

    document.addEventListener('click', handleExpandClick);
    return () => document.removeEventListener('click', handleExpandClick);
  }, []);

  const scheduleColumns = useMemo(() => [
    {
      data: 'asset_code', title: 'Code', orderable: true,
      render: (_data: any, _type: string, row: any) => `
        <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#3B82F6;"
                type="button"
                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                data-category="${(row.category || '-').replace(/"/g, '&quot;')}"
                data-purchase-date="${row.purchase_date || '-'}"
                data-depreciation-method="${row.depreciation_method || '-'}"
                data-years-elapsed="${row.years_elapsed || '0'}"
                >+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${row.asset_code ?? ''}</span>
        </div>
      `,
    },
    { data: 'name', title: 'Name', orderable: true },
    { data: 'purchase_cost', title: `Cost (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'salvage_value', title: `Salvage (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'useful_life_years', title: 'Life (yrs)', orderable: true },
    { data: 'annual_depreciation', title: 'Annual Dep.', orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'accumulated_depreciation', title: 'Accumulated', orderable: true, render: (d: any) => `<span class="text-amber-600 font-medium">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
    { data: 'book_value', title: 'Book Value', orderable: true, render: (d: any) => `<span class="text-emerald-600 font-semibold">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
  ], [currencySymbol])

  const historyColumns = useMemo(() => [
    { data: 'period', title: 'Period', orderable: true, render: (d: any) => `<span class="font-semibold">${d}</span>` },
    { data: 'depreciation_date', title: 'Posted Date', orderable: true },
    { data: 'asset_count', title: 'Assets Affected', orderable: true },
    { data: 'total_amount', title: `Total Amount (${currencySymbol})`, orderable: true, render: (d: any) => `<span class="text-rose-600 font-medium">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
    { data: 'journal_id', title: 'Journal ID', orderable: true, render: (d: any) => `<span class="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">#${d}</span>` },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Depreciation Tracking</h1>
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CalendarClock className="size-4" />
            Run Depreciation
          </Button>
        </div>

        <StatCards cards={cards} />

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Asset Schedule
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Run History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-0">
            <DataTable
              columns={scheduleColumns}
              data={filteredSchedule}
              meta={{ page: 1, limit: Math.max(filteredSchedule.length, 1), total: filteredSchedule.length }}
              search={search}
              onSearchChange={setSearch}
              isLoading={fetchingSchedule}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <DataTable
              columns={historyColumns}
              data={runsData || []}
              meta={{ page: 1, limit: Math.max((runsData || []).length, 1), total: (runsData || []).length }}
              search={search}
              onSearchChange={setSearch}
              isLoading={fetchingRuns}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Depreciation</DialogTitle>
            <DialogDescription>
              Post straight-line depreciation for a specific month. This will automatically post a summary journal entry to your ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period">Target Period (Month)</Label>
              <DatePicker
                selected={selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    setSelectedMonth(`${year}-${month}`)
                  } else {
                    setSelectedMonth('')
                  }
                }}
                placeholder="Select period"
              />
              <p className="text-xs text-muted-foreground">Select the month to calculate depreciation for.</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
                <CheckCircle className="h-4 w-4" />
                Action Preview
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You are about to calculate and post depreciation for <strong>{selectedMonth}</strong>.
                If depreciation has already been posted for this period, the system will prevent duplicate entries.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePostDepreciation} disabled={postDep.isPending || !selectedMonth}>
              {postDep.isPending ? 'Posting...' : 'Confirm & Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
