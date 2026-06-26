import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DollarSign, TrendingDown, Wallet } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useCurrency } from '@/hooks/use-currency'
import { useAssetDepreciationQuery } from '@/features/assets/assetQueries'
import { StatCards } from '@/features/assets/components/StatCard'

export const Route = createFileRoute('/_authenticated/dashboard/assets/depreciation/')({
  component: AssetDepreciationPage,
})

function AssetDepreciationPage() {
  const { currencySymbol } = useCurrency()
  const { data, isFetching } = useAssetDepreciationQuery()
  const [search, setSearch] = useState('')

  const all = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) => r.name.toLowerCase().includes(q) || r.asset_code.toLowerCase().includes(q))
  }, [all, search])

  const totals = useMemo(() => ({
    cost: all.reduce((s, r) => s + Number(r.purchase_cost || 0), 0),
    accumulated: all.reduce((s, r) => s + Number(r.accumulated_depreciation || 0), 0),
    book: all.reduce((s, r) => s + Number(r.book_value || 0), 0),
  }), [all])

  const fmt = (n: number) => `${currencySymbol} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const cards = [
    { label: 'Total Cost', value: fmt(totals.cost), icon: DollarSign, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Accumulated Depreciation', value: fmt(totals.accumulated), icon: TrendingDown, headerBg: '#F59E0B', iconColor: '#F59E0B' },
    { label: 'Net Book Value', value: fmt(totals.book), icon: Wallet, headerBg: '#10B981', iconColor: '#10B981' },
  ]

  const columns = useMemo(() => [
    {
      data: 'asset_code', title: 'Code', orderable: true,
      render: (d: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${d ?? ''}</span>`,
    },
    { data: 'name', title: 'Name', orderable: true },
    { data: 'purchase_cost', title: `Cost (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'salvage_value', title: `Salvage (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'useful_life_years', title: 'Life (yrs)', orderable: true },
    { data: 'annual_depreciation', title: 'Annual Dep.', orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { data: 'accumulated_depreciation', title: 'Accumulated', orderable: true, render: (d: any) => `<span class="text-amber-600 font-medium">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
    { data: 'book_value', title: 'Book Value', orderable: true, render: (d: any) => `<span class="text-emerald-600 font-semibold">${Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Depreciation Tracking</h1>
        </div>

        <StatCards cards={cards} />

        <DataTable
          columns={columns}
          data={filtered}
          meta={{ page: 1, limit: Math.max(filtered.length, 1), total: filtered.length }}
          search={search}
          onSearchChange={setSearch}
          isLoading={isFetching}
        />
      </main>
    </>
  )
}
