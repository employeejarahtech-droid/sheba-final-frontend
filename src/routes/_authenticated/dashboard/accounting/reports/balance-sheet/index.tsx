import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type StatCardData } from '@/features/assets/components/StatCard'
import { Button } from '@/components/ui/button'
import { Scale, Printer, FileText, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface BalanceSheetItem {
  id: number
  code: string
  name: string
  amount: number
  type: 'asset' | 'liability' | 'equity'
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface BalanceSheetData {
  assets: BalanceSheetItem[]
  liabilities: BalanceSheetItem[]
  equity: BalanceSheetItem[]
  total_assets: number
  total_liabilities: number
  total_equity: number
}

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/balance-sheet/')({
  component: BalanceSheetPage,
})

function BalanceSheetPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 50;
  const search = searchParams?.search || "";
  const date = searchParams?.date || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setDate = (newDate: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, date: newDate, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/accounting/reports/balance-sheet?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch balance sheet data')
      return res.json()
    },
    enabled: !!token,
  })

  const balanceSheetData: BalanceSheetData = data?.data || {
    assets: [],
    liabilities: [],
    equity: [],
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
  }

  // Combine all items for the table
  const allItems: BalanceSheetItem[] = [
    ...balanceSheetData.assets.map(item => ({ ...item, type: 'asset' as const })),
    ...balanceSheetData.liabilities.map(item => ({ ...item, type: 'liability' as const })),
    ...balanceSheetData.equity.map(item => ({ ...item, type: 'equity' as const })),
  ]

  const meta: Meta = {
    total: allItems.length,
    page: page,
    limit: limit,
    totalPages: Math.ceil(allItems.length / limit),
  }

  // Paginate items
  const paginatedItems = allItems.slice((page - 1) * limit, page * limit)

  // Calculate statistics → shared StatCards data
  const cards: StatCardData[] = useMemo(() => {
    const assetCount = balanceSheetData.assets.length
    const liabilityCount = balanceSheetData.liabilities.length
    const isBalanced = Math.abs(balanceSheetData.total_assets - (balanceSheetData.total_liabilities + balanceSheetData.total_equity)) < 0.01
    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

    return [
      { label: 'Total Assets',       value: fmt(balanceSheetData.total_assets),      icon: TrendingUp,   headerBg: COLORS[0], iconColor: COLORS[0] },
      { label: 'Total Liabilities',  value: fmt(balanceSheetData.total_liabilities), icon: TrendingDown, headerBg: COLORS[1], iconColor: COLORS[1] },
      { label: 'Total Equity',       value: fmt(balanceSheetData.total_equity),      icon: DollarSign,   headerBg: COLORS[2], iconColor: COLORS[2] },
      { label: 'Asset Accounts',     value: assetCount,                              icon: Scale,        headerBg: COLORS[3], iconColor: COLORS[3] },
      { label: 'Liability Accounts', value: liabilityCount,                          icon: Scale,        headerBg: COLORS[4], iconColor: COLORS[4] },
      { label: 'Balance Status',     value: isBalanced ? 'BALANCED' : 'DISCREPANCY', icon: Scale,        headerBg: COLORS[5], iconColor: COLORS[5] },
    ]
  }, [balanceSheetData])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
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
  }), []);

  const activePreset = useMemo(() => {
    if (!date) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === date);
    return match ? match[0] : 'custom';
  }, [date, datePresets]);

  const [presetOpen, setPresetOpen] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setDate(p.to); }
    setPresetOpen(false);
  };

  const columns = [
    {
      data: "code",
      title: "Code",
      render: (data: string) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${data || '-'}</span>`,
    },
    {
      data: "name",
      title: "Account Name",
      render: (data: string, type: string, row: BalanceSheetItem) => {
        const typeConfig = {
          asset: { icon: '🟢', label: 'Asset', class: 'bg-emerald-100 text-emerald-700' },
          liability: { icon: '🔴', label: 'Liability', class: 'bg-red-100 text-red-700' },
          equity: { icon: '🔵', label: 'Equity', class: 'bg-blue-100 text-blue-700' },
        };
        const config = typeConfig[row.type];
        return `
          <div class="flex items-center gap-2">
            <span class="text-xs">${config.icon}</span>
            <span class="font-medium">${data || '-'}</span>
            <span class="text-xs px-2 py-0.5 rounded-full ${config.class}">${config.label}</span>
          </div>
        `;
      },
    },
    {
      data: "amount",
      title: "Amount",
      className: "text-right",
      render: (data: number, type: string, row: BalanceSheetItem) => {
        const formatted = Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const colorClass = row.type === 'asset' ? 'text-emerald-600' : row.type === 'liability' ? 'text-red-600' : 'text-blue-600';
        return `<span class="font-mono font-semibold ${colorClass}">${formatted}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, _row: BalanceSheetItem) => {
        return `<div class="flex gap-2">
          <span class="text-xs text-gray-400 italic">View details in main sections</span>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Balance Sheet Report"
        description="Financial snapshot of assets, liabilities, and equity with filtering and detailed breakdown"
        fixed
      />

      <main className="">
        <div className="flex justify-end mb-4">
          <Link to="/dashboard/accounting/reports/balance-sheet/print" search={{ date: date || undefined }}>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </Link>
        </div>

        {/* Stat cards — single consolidated card */}
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border mb-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-800">
              {cards.map((card: StatCardData) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="flex items-center gap-2.5 p-4">
                    <div className="p-2 rounded-lg shadow-sm shrink-0" style={{ backgroundColor: card.headerBg }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                      <p className="text-lg font-bold truncate">{card.value ?? 0}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Balance Sheet Sections */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6 p-0">
          {/* Assets Section */}
          <Card className="lg:row-span-2 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Assets</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Resources owned by the business</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={balanceSheetData.assets.map(item => ({ ...item, type: 'asset' as const }))}
                isLoading={isLoading}
                hideExport
                showSearch={false}
                showPagination={false}
              />
              <div className="p-4 bg-emerald-50/30 border-t flex justify-between font-bold text-base">
                <span>Total Assets</span>
                <span className="text-emerald-700">{balanceSheetData.total_assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-lg">
                    <Scale className="w-4 h-4 rotate-180 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Liabilities</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Obligations owed to others</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  data={balanceSheetData.liabilities.map(item => ({ ...item, type: 'liability' as const }))}
                  isLoading={isLoading}
                  hideExport
                  showSearch={false}
                  showPagination={false}
                />
                <div className="p-4 bg-red-50/30 border-t flex justify-between font-bold text-base">
                  <span>Total Liabilities</span>
                  <span className="text-red-700">{balanceSheetData.total_liabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Scale className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Equity</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Owner's remaining interest</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  data={balanceSheetData.equity.map(item => ({ ...item, type: 'equity' as const }))}
                  isLoading={isLoading}
                  hideExport
                  showSearch={false}
                  showPagination={false}
                />
                <div className="p-4 bg-blue-50/30 border-t flex justify-between font-bold text-base">
                  <span>Total Equity</span>
                  <span className="text-blue-700">{balanceSheetData.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Accounting Equation Verification */}
            <Card className="bg-primary/5 border-primary/20 border-2 p-0">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  <span>Accounting Equation</span>
                  <span className="text-xs lowercase text-muted-foreground/50 italic">(Assets = Liabilities + Equity)</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{balanceSheetData.total_assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total Assets</div>
                  </div>
                  <div className="text-2xl font-light text-muted-foreground">=</div>
                  <div>
                    <div className="text-2xl font-bold text-slate-700">{(balanceSheetData.total_liabilities + balanceSheetData.total_equity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Liabilities + Equity</div>
                  </div>
                </div>

                {Math.abs(balanceSheetData.total_assets - (balanceSheetData.total_liabilities + balanceSheetData.total_equity)) < 0.01 ? (
                  <div className="bg-emerald-500/10 text-emerald-600 text-center py-2 rounded-md text-xs font-bold border border-emerald-200">
                    BALANCE CONFIRMED
                  </div>
                ) : (
                  <div className="bg-red-500/10 text-red-600 text-center py-2 rounded-md text-xs font-bold border border-red-200 uppercase tracking-widest">
                    DISCREPANCY DETECTED
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Combined Table with All Accounts */}
        <DataTable
          tableTitle="All Accounts (Combined View)"
          columns={columns}
          data={paginatedItems}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          hideExport
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
                value={date}
                onChange={(v: string) => { setDate(v); setPresetOpen(false); }}
                placeholder="As of date"
              />
              {date && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDate(""); }}
                >
                  Clear
                </Button>
              )}
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No balance sheet data found</p>
              <p className="text-sm text-gray-400">Select a date to view the balance sheet</p>
            </div>
          }
        />
      </main>
    </>
  )
}
