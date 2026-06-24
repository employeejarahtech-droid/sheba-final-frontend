import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Printer, FileText, Calendar, PiggyBank, Wallet } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface AccountItem {
  name: string
  amount: number
}

interface ProfitLossData {
  income: AccountItem[]
  expense: AccountItem[]
  total_income: number
  total_expense: number
  net_profit: number
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/profit-and-loss/')({
  component: ProfitAndLossPage,
})

function ProfitAndLossPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

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

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss', from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/accounting/profit-loss?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch profit & loss data')
      return res.json()
    },
    enabled: !!token,
  })

  const reportData: ProfitLossData = data?.data || {
    income: [],
    expense: [],
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const incomeCount = reportData.income.length
    const expenseCount = reportData.expense.length
    const netProfit = reportData.net_profit || 0
    const isProfit = netProfit >= 0

    return [
      { label: 'Total Income', value: reportData.total_income, icon: TrendingUp, grad: 'from-green-500 to-green-600' },
      { label: 'Total Expense', value: reportData.total_expense, icon: TrendingDown, grad: 'from-red-500 to-red-600' },
      { label: isProfit ? 'Net Profit' : 'Net Loss', value: Math.abs(netProfit), icon: isProfit ? PiggyBank : Wallet, grad: isProfit ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600' },
      { label: 'Income Heads', value: incomeCount, icon: DollarSign, grad: 'from-teal-500 to-teal-600' },
      { label: 'Expense Heads', value: expenseCount, icon: Calendar, grad: 'from-pink-500 to-pink-600' },
      { label: 'Net Margin', value: reportData.total_income > 0 ? ((netProfit / reportData.total_income) * 100).toFixed(1) + '%' : '0%', icon: FileText, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [reportData])

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

  // Income table columns
  const incomeColumns = [
    {
      data: "name",
      title: "Account Name",
      className: "font-medium",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "amount",
      title: "Amount",
      className: "text-right font-mono",
      render: (data: number) => {
        return `<span class="font-semibold text-green-600">${Number(data || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`
      },
    },
  ]

  // Expense table columns
  const expenseColumns = [
    {
      data: "name",
      title: "Account Name",
      className: "font-medium",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "amount",
      title: "Amount",
      className: "text-right font-mono",
      render: (data: number) => {
        return `<span class="font-semibold text-red-600">${Number(data || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Profit & Loss Statement"
        description="Financial performance report showing income, expenses, and net profit/loss for the selected period"
        fixed
      />

      <main className="">
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
                  <p className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filter Toolbar */}
        <Card className="mb-6 shadow-none border">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 flex-wrap">
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
                to="/dashboard/reports/accounting/profit-and-loss/print"
                search={{
                  from: from || undefined,
                  to: to || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Income and Expense Tables */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* INCOME */}
          <Card className="border-emerald-100 shadow-sm pt-0">
            <CardHeader className="bg-emerald-50/30 border-b-1 py-4 gap-0">
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Income
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-6">
              <DataTable
                columns={incomeColumns}
                data={reportData.income}
                isLoading={isLoading}
                hideSearch={true}
                hidePagination={true}
              />
              <div className="p-4 bg-emerald-50/50 border-t flex justify-between font-bold text-lg mt-2">
                <span className="text-emerald-800">Total Income</span>
                <span className="text-emerald-700 font-mono">{reportData.total_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          {/* EXPENSE */}
          <Card className="border-red-100 shadow-sm pt-0">
            <CardHeader className="bg-red-50/30 border-b-1 py-4 gap-0">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-6">
              <DataTable
                columns={expenseColumns}
                data={reportData.expense}
                isLoading={isLoading}
                hideSearch={true}
                hidePagination={true}
              />
              <div className="p-4 bg-red-50/50 border-t flex justify-between font-bold text-lg mt-2">
                <span className="text-red-800">Total Expense</span>
                <span className="text-red-700 font-mono">{reportData.total_expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NET PROFIT */}
        <Card className={`mt-8 border-2 transition-all duration-300 ${
          reportData.net_profit >= 0 ? "border-emerald-500 bg-emerald-50 shadow-emerald-100/50" : "border-red-500 bg-red-50 shadow-red-100/50"
        } shadow-xl`}>
          <CardContent className="p-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h3 className="text-xl font-medium text-muted-foreground uppercase tracking-[0.2em]">
                {reportData.net_profit >= 0 ? "Net Profit" : "Net Loss"}
              </h3>
              <div className={`text-6xl font-black tracking-tight font-mono ${
                reportData.net_profit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                {reportData.net_profit >= 0 ? "+" : "-"}{Math.abs(reportData.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-4 text-sm font-medium pt-4">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  Income: {reportData.total_income.toLocaleString()}
                </div>
                <div className="text-muted-foreground">vs</div>
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  Expense: {reportData.total_expense.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
