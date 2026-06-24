import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { Clock, AlertCircle, TestTube2, Activity, Printer, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface PendingResultItem {
  id: number
  invoice_id: string
  patient_name: string
  department_name: string
  tests: string
  created_at: string
  status: string
  bill_amount?: number
  collected_amount?: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/pathology/pending-results/')({
  component: PendingResultsReportPage,
})

function daysPending(dateStr: string): number {
  if (!dateStr) return 0
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function PendingResultsReportPage() {
  const searchParams: any = Route.useSearch()
  const navigate = Route.useNavigate()
  const { formatDate } = useDateFormat()

  const page = Number(searchParams?.page) || 1
  const limit = Number(searchParams?.limit) || 10
  const search = searchParams?.search || ""
  const from = searchParams?.from || ""
  const to = searchParams?.to || ""

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  }
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  }
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })
  }
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) })
  }
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) })
  }

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['pathology-pending-results', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } } },
  })

  const allItems: PendingResultItem[] = data?.data?.items ?? []
  const meta: Meta = data?.data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 }

  const pendingItems = useMemo(
    () => allItems.filter((i) => i.status !== 'Completed' && i.status !== 'completed'),
    [allItems]
  )

  const stats = useMemo(() => {
    const urgent = pendingItems.filter((i) => daysPending(i.created_at) > 2).length
    const oldest = pendingItems.reduce((acc: string, i: PendingResultItem) => {
      if (!acc) return i.created_at || ''
      return new Date(i.created_at) < new Date(acc) ? i.created_at : acc
    }, '')

    return [
      { label: 'Total Pending', value: pendingItems.length, icon: Clock, grad: 'from-green-500 to-green-600' },
      { label: 'Oldest Pending', value: oldest ? formatDate(new Date(oldest)) : '-', icon: AlertCircle, grad: 'from-orange-500 to-orange-600' },
      { label: 'Total Invoices', value: meta.total || 0, icon: TestTube2, grad: 'from-pink-500 to-pink-600' },
      { label: 'Urgent (>2 days)', value: urgent, icon: Activity, grad: 'from-teal-500 to-teal-600' },
      { label: 'This Page', value: pendingItems.length, icon: Clock, grad: 'from-yellow-500 to-yellow-600' },
      { label: 'Avg Pending', value: pendingItems.length > 0 ? `${Math.round(pendingItems.reduce((acc, i) => acc + daysPending(i.created_at), 0) / pendingItems.length)}d` : '-', icon: Activity, grad: 'from-blue-500 to-blue-600' },
    ]
  }, [pendingItems, meta, formatDate])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) }; })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
    last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
    last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
    last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
    last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
  }), [])

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom'
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
    return match ? match[0] : 'custom'
  }, [from, to, datePresets])

  const [presetOpen, setPresetOpen] = useState(false)
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key]
    if (p) { setFrom(p.from); setTo(p.to) }
    setPresetOpen(false)
  }

  const columns = [
    {
      data: 'id',
      title: 'Invoice ID',
      orderable: true,
      responsivePriority: 1,
      render: (d: any) => `<span class="font-semibold text-purple-600">${d || '-'}</span>`,
      defaultContent: '-',
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      orderable: true,
      responsivePriority: 1,
      defaultContent: '-',
    },
    {
      data: 'department_name',
      title: 'Department',
      orderable: false,
      responsivePriority: 2,
      defaultContent: '-',
    },
    {
      data: 'tests',
      title: 'Tests',
      orderable: false,
      responsivePriority: 3,
      render: (d: any) => d || '-',
      defaultContent: '-',
    },
    {
      data: 'created_at',
      title: 'Created Date',
      orderable: true,
      responsivePriority: 4,
      render: (d: any) => {
        if (!d) return '-'
        const date = new Date(d)
        return `<div class="text-sm">${formatDate(date)}</div>`
      },
      defaultContent: '-',
    },
    {
      data: 'created_at',
      title: 'Days Pending',
      orderable: false,
      responsivePriority: 3,
      render: (d: any) => {
        const days = daysPending(d)
        const cls = days > 2 ? 'text-red-600 font-bold' : 'text-yellow-600'
        return `<span class="${cls}">${days}d</span>`
      },
      defaultContent: '-',
    },
    {
      data: 'status',
      title: 'Status',
      orderable: false,
      responsivePriority: 2,
      render: (d: any) => `<span class="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">${d || 'Pending'}</span>`,
      defaultContent: '-',
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: PendingResultItem) => {
        const id = row.id
        return `<div class="flex gap-2">
          <a href="/dashboard/reports/pathology/pending-results/print?id=${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/pathology/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </a>
        </div>`
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Pending Results Report"
        description="Invoices with pending test results"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: COLORS[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: COLORS[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Pending Results List"
          columns={columns}
          data={pendingItems}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
            <div className="flex items-center gap-1.5">
              <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last15">Last 15 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last45">Last 45 days</SelectItem>
                  <SelectItem value="last60">Last 60 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last180">Last 180 days</SelectItem>
                  <SelectItem value="last365">Last 365 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <DateField
                value={from}
                onChange={(v: string) => { setFrom(v); setPresetOpen(false) }}
                placeholder="From"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField
                value={to}
                onChange={(v: string) => { setTo(v); setPresetOpen(false) }}
                placeholder="To"
              />
              {(from || to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFrom(""); setTo("") }}
                >
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/pathology/pending-results/print"
                search={{
                  search: search || undefined,
                  start_date: from || undefined,
                  end_date: to || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No pending results found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
