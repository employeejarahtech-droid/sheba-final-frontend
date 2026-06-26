import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Truck, DollarSign, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useCurrency } from '@/hooks/use-currency'
import { useSupplierPerformanceQuery } from '@/features/purchase/purchaseQueries'
import { StatCards } from '@/features/assets/components/StatCard'

export const Route = createFileRoute('/_authenticated/dashboard/purchase/supplier-performance/')({
  component: SupplierPerformancePage,
})

function SupplierPerformancePage() {
  const { currencySymbol } = useCurrency()
  const { data, isFetching } = useSupplierPerformanceQuery()
  const [search, setSearch] = useState('')

  const all = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) => r.name.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q))
  }, [all, search])

  const totalValue = all.reduce((s, r) => s + Number(r.total_value || 0), 0)
  const avgRating = all.length ? (all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length).toFixed(1) : '0.0'
  const cards = useMemo(() => ([
    { label: 'Suppliers', value: all.length, icon: Truck, headerBg: '#3B82F6', iconColor: '#3B82F6' },
    { label: 'Total Procurement', value: `${currencySymbol} ${totalValue.toLocaleString()}`, icon: DollarSign, headerBg: '#10B981', iconColor: '#10B981' },
    { label: 'Avg. Rating', value: avgRating, icon: Star, headerBg: '#F59E0B', iconColor: '#F59E0B' },
  ]), [all, totalValue, avgRating, currencySymbol])

  const columns = useMemo(() => [
    { data: 'name', title: 'Supplier', orderable: true },
    { data: 'category', title: 'Category', orderable: true, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    { data: 'orders', title: 'GRNs', orderable: true },
    { data: 'total_value', title: `Total Value (${currencySymbol})`, orderable: true, render: (d: any) => Number(d || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    {
      data: 'fulfilment_rate', title: 'Fulfilment', orderable: true,
      render: (d: any) => {
        const n = Number(d || 0)
        const color = n >= 80 ? 'text-emerald-600' : n >= 50 ? 'text-amber-600' : 'text-rose-600'
        return `<span class="font-semibold ${color}">${n}%</span>`
      },
    },
    { data: 'rating', title: 'Rating', orderable: true, render: (d: any) => `<span class="font-semibold text-amber-600">${Number(d || 0).toFixed(1)} ★</span>` },
    { data: 'status', title: 'Status', orderable: true, render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d ?? ''}</span>` },
  ], [currencySymbol])

  return (
    <>
      <AppHeader fixed />
      <main className="">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Supplier Performance</h1>
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
