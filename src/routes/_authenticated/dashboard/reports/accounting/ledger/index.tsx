import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { z } from 'zod'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, Hash, Printer, FileText, Calendar, Wallet } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface LedgerTransaction {
  id: number
  date: string
  narration: string
  debit: number
  credit: number
  balance: number
}

interface LedgerResponse {
  opening_balance: number
  transactions: LedgerTransaction[]
  closing_balance: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const ledgerSearchSchema = z.object({
  account_id: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/ledger/')({
  validateSearch: (search) => ledgerSearchSchema.parse(search),
  component: LedgerReport,
})

function LedgerReport() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();
  const { currencySymbol } = useCurrency();

  const accountId = searchParams.account_id;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const [localAccountId, setLocalAccountId] = useState<number | null>(accountId || null);

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };
  const setAccountId = (id: number | null) => {
    setLocalAccountId(id);
    navigate({ to: '.', search: (prev: any) => ({ ...prev, account_id: id || undefined, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['ledger-report', accountId, from, to, page, limit],
    queryFn: async () => {
      if (!accountId) return null;
      const params = new URLSearchParams({
        account_id: String(accountId),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/accounting/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch ledger data')
      return res.json() as Promise<LedgerResponse>
    },
    enabled: !!token && !!accountId,
    placeholderData: (prev) => prev || null,
  })

  const items: LedgerTransaction[] = data?.transactions || []
  const openingBalance = data?.opening_balance || 0
  const closingBalance = data?.closing_balance || 0

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDebit = items.reduce((sum, t) => sum + (t.debit || 0), 0)
    const totalCredit = items.reduce((sum, t) => sum + (t.credit || 0), 0)

    return [
      { label: 'Opening Balance', value: openingBalance, icon: Wallet, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Debit', value: totalDebit, icon: TrendingUp, grad: 'from-green-500 to-green-600' },
      { label: 'Total Credit', value: totalCredit, icon: TrendingDown, grad: 'from-red-500 to-red-600' },
      { label: 'Closing Balance', value: closingBalance, icon: DollarSign, grad: 'from-yellow-500 to-yellow-600' },
      { label: 'Transactions', value: items.length, icon: Hash, grad: 'from-teal-500 to-teal-600' },
      { label: 'This Page', value: Math.min(items.length, limit), icon: FileText, grad: 'from-purple-500 to-purple-600' },
    ]
  }, [items, openingBalance, closingBalance, limit])

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
    if (!from || !to) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to, datePresets]);

  const [presetOpen, setPresetOpen] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  // Filter transactions locally
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((t) =>
      (t.narration || "").toLowerCase().includes(q) ||
      (t.date || "").toLowerCase().includes(q) ||
      String(t.debit || "").includes(q) ||
      String(t.credit || "").includes(q)
    );
  }, [items, search]);

  const columns = [
    {
      data: "date",
      title: "Date",
      render: (data: string) => {
        if (!data) return '-'
        const date = new Date(data)
        return `<div class="text-sm">
          <div>${formatDate(date)}</div>
        </div>`
      },
    },
    {
      data: "narration",
      title: "Particulars",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "debit",
      title: `Debit (${currencySymbol})`,
      className: "text-right text-emerald-600",
      render: (data: number) => {
        const value = Number(data) || 0;
        return `<span class="font-semibold text-emerald-600">${value.toFixed(2)}</span>`;
      },
    },
    {
      data: "credit",
      title: `Credit (${currencySymbol})`,
      className: "text-right text-red-600",
      render: (data: number) => {
        const value = Number(data) || 0;
        return `<span class="font-semibold text-red-600">${value.toFixed(2)}</span>`;
      },
    },
    {
      data: "balance",
      title: `Balance (${currencySymbol})`,
      className: "text-right font-bold",
      render: (data: number) => {
        const value = Number(data) || 0;
        const colorClass = value >= 0 ? 'text-blue-600' : 'text-red-600';
        return `<span class="font-bold ${colorClass}">${value.toFixed(2)}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: LedgerTransaction) => {
        return `<div class="flex gap-2">
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors" onclick="window.print()">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </button>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors" onclick="alert('View details for transaction ${row.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </button>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Ledger Report"
        description="View detailed transaction history for a specific account"
        fixed
      />

      <main className="">
        {/* Account Selection Card */}
        <Card className="mb-6 border-t-4 border-emerald-500 shadow-md">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Account</label>
                <NestedAccountSelect
                  value={localAccountId}
                  onChange={setAccountId}
                  placeholder="Select account"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date From</label>
                <DateField
                  value={from}
                  onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
                  placeholder="From"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date To</label>
                <DateField
                  value={to}
                  onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
                  placeholder="To"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{currencySymbol}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Ledger Transactions"
          columns={columns}
          data={filteredItems}
          meta={{
            total: filteredItems.length,
            page,
            limit,
            totalPages: Math.ceil(filteredItems.length / limit)
          }}
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
                onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
                placeholder="From"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField
                value={to}
                onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
                placeholder="To"
              />
              {(from || to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFrom(""); setTo(""); }}
                >
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/accounting/ledger/print"
                search={{
                  account_id: accountId || undefined,
                  from: from || undefined,
                  to: to || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()} disabled={!accountId}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No transactions found</p>
              <p className="text-sm text-gray-400">Select an account and adjust your filters</p>
            </div>
          }
        />
      </main>
    </>
  )
}
