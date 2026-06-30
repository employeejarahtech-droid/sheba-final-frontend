
import { useMemo } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddIncomeModal } from '@/components/accounting/AddIncomeModal'
import { AddExpenseModal } from '@/components/accounting/AddExpenseModal'
import { createFileRoute } from '@tanstack/react-router'
import { useGetAccountingChartDataQuery, useGetAccountingOverviewQuery, useGetExpenseBreakdownQuery, useGetRecentActivityQuery } from '@/features/accounting/accountingQueries'
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    Calendar,
    CalendarClock,
    CalendarDays,
    CalendarRange,
    History,
    Plus,
} from 'lucide-react'
import {
    Bar,
    BarChart,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from 'recharts'
import { Overview } from '@/types/accounting.types'
import { useCurrency } from '@/hooks/use-currency'

export const Route = createFileRoute('/_authenticated/dashboard/accounting/')({
    component: AccountingOverview,
})


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

const fmt = (n: number) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type KpiTone = 'emerald' | 'red' | 'default'
function Kpi({ label, value, tone = 'default' }: { label: string; value: string; tone?: KpiTone }) {
    const toneClass =
        tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
            : tone === 'red' ? 'text-red-600 dark:text-red-400'
                : 'text-foreground'
    return (
        <div className="rounded-lg border bg-card px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={cn('mt-0.5 truncate text-sm font-semibold tabular-nums', toneClass)}>{value}</div>
        </div>
    )
}

function AccountingOverview() {
    const { currencySymbol } = useCurrency()

    // Queries
    const { data: accountingOverview } = useGetAccountingOverviewQuery();
    const { data: recentActivityData, isLoading: recentLoading, isError: recentError } = useGetRecentActivityQuery();
    const { data: expenseBreakdownResponse } = useGetExpenseBreakdownQuery();
    const { data: chartData } = useGetAccountingChartDataQuery();

    const summaryData = accountingOverview?.data || {
        today: { income: 0, expense: 0, net: 0 },
        this_week: { income: 0, expense: 0, net: 0 },
        this_month: { income: 0, expense: 0, net: 0 },
        this_year: { income: 0, expense: 0, net: 0 },
    };
    // @ts-ignore
    const recentActivity = recentActivityData?.data || [];
    // @ts-ignore
    const expenseBreakdownData = expenseBreakdownResponse?.data || [];
    const chartTrendData = chartData?.data || [];

    // Derived stats for the card KPI strips. Depend on the (stable) query results
    // rather than the inline `|| []` fallbacks, which would recompute every render.
    const trendStats = useMemo(() => {
        // ChartResponse is mis-typed as ChartOfAccount[]; runtime rows are { date, income, expense }.
        const rows = (chartData?.data || []) as unknown as { income?: number; expense?: number }[]
        let income = 0
        let expense = 0
        for (const point of rows) {
            income += Number(point.income || 0)
            expense += Number(point.expense || 0)
        }
        return { income, expense, net: income - expense }
    }, [chartData])

    const expenseStats = useMemo(() => {
        const data = expenseBreakdownResponse?.data || []
        const total = data.reduce((s, d) => s + Number(d.value || 0), 0)
        let top: { name: string; value: number } | null = null
        for (const d of data) {
            const v = Number(d.value || 0)
            if (!top || v > top.value) top = { name: d.name || '—', value: v }
        }
        return {
            total,
            count: data.length,
            top,
            topPct: top && total > 0 ? (top.value / total) * 100 : 0,
        }
    }, [expenseBreakdownResponse])

    const activityStats = useMemo(() => {
        const rows = recentActivityData?.data || []
        let income = 0
        let expense = 0
        for (const a of rows) {
            if (a.type === 'income') income += Number(a.amount || 0)
            else if (a.type === 'expense') expense += Number(a.amount || 0)
        }
        return { count: rows.length, income, expense, net: income - expense }
    }, [recentActivityData])

    const periods: (keyof Overview)[] = ["today", "this_week", "this_month", "this_year"];

    return (
        <>
            <AppHeader fixed />
            <main className='p-4 space-y-4'>
                <PageHeader
                    title="Accounting Overview"
                    description="Track financial trends and manage transactions."
                    actions={
                        <>
                            <AddIncomeModal>
                                <button className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 h-9 px-4 py-2'>
                                    <Plus size={18} /> Add Income
                                </button>
                            </AddIncomeModal>
                            <AddExpenseModal>
                                <button className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-rose-600 text-white shadow-xs hover:bg-rose-700 h-9 px-4 py-2'>
                                    <Plus size={18} /> Add Expense
                                </button>
                            </AddExpenseModal>
                        </>
                    }
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {periods.map((period) => {
                        const data = summaryData[period] || { income: 0, expense: 0, net: 0 };
                        const periodLabel =
                            period === "today"
                                ? "Today"
                                : period === "this_week"
                                    ? "This Week"
                                    : period === "this_month"
                                        ? "This Month"
                                        : "This Year";

                        const income = Number(data.income) || 0;
                        const expense = Number(data.expense) || 0;

                        let incomePercent = 0;
                        let expensePercent = 0;

                        if (income === 0 && expense === 0) {
                            incomePercent = 0;
                            expensePercent = 0;
                        } else if (income > 0 && expense === 0) {
                            incomePercent = 100;
                            expensePercent = 0;
                        } else if (expense > 0 && income === 0) {
                            incomePercent = 0;
                            expensePercent = 100;
                        } else {
                            const total = income + expense;
                            incomePercent = Math.round((income / total) * 100);
                            expensePercent = 100 - incomePercent;
                        }

                        const netProfit = data.net || 0;

                        // Assign gradient & icon based on period
                        let gradientStr = "";
                        let shadowStr = "";
                        let IconComp = null;

                        if (period === "today") {
                            gradientStr = "from-blue-600 to-blue-400";
                            shadowStr = "shadow-blue-500/30";
                            IconComp = <Calendar className="w-6 h-6 text-white" />;
                        } else if (period === "this_week") {
                            gradientStr = "from-emerald-600 to-emerald-400";
                            shadowStr = "shadow-emerald-500/30";
                            IconComp = <CalendarDays className="w-6 h-6 text-white" />;
                        } else if (period === "this_month") {
                            gradientStr = "from-amber-600 to-amber-400";
                            shadowStr = "shadow-amber-500/30";
                            IconComp = <CalendarRange className="w-6 h-6 text-white" />;
                        } else { // this_year
                            gradientStr = "from-violet-600 to-violet-400";
                            shadowStr = "shadow-violet-500/30";
                            IconComp = <CalendarClock className="w-6 h-6 text-white" />;
                        }


                        return (
                            <div
                                key={period}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientStr} p-6 shadow-lg ${shadowStr} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                            >
                                {/* Background Pattern */}
                                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                                <div className="relative flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-white/90 uppercase tracking-widest">{periodLabel}</p>
                                        <h3 className="mt-2 text-2xl font-bold text-white">
                                            Net: {currencySymbol} {netProfit.toLocaleString()}
                                        </h3>
                                    </div>
                                    <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                        {IconComp}
                                    </div>
                                </div>

                                <div className="relative space-y-2">
                                    <div className="flex justify-between text-white/90 text-sm">
                                        <span>Income</span>
                                        <span className="font-semibold">{currencySymbol} {data.income.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-1.5 mb-1">
                                        <div className="bg-white/80 h-1.5 rounded-full" style={{ width: `${incomePercent}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-white/90 text-sm pt-1">
                                        <span>Expense</span>
                                        <span className="font-semibold">{currencySymbol} {data.expense.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-1.5">
                                        <div className="bg-white/40 h-1.5 rounded-full" style={{ width: `${expensePercent}%` }}></div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className='mt-8 grid gap-6 md:grid-cols-2'>
                    {/* Trend Chart (Bar/Line) */}
                    <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle>Income vs Expense Trend</CardTitle>
                                    <p className="text-xs text-muted-foreground">Daily totals · last 30 days</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-6">
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <Kpi label="Income" value={`${currencySymbol} ${fmt(trendStats.income)}`} tone="emerald" />
                                <Kpi label="Expense" value={`${currencySymbol} ${fmt(trendStats.expense)}`} tone="red" />
                                <Kpi label="Net" value={`${currencySymbol} ${fmt(trendStats.net)}`} tone={trendStats.net >= 0 ? 'emerald' : 'red'} />
                            </div>
                            <div className="h-[300px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={chartTrendData}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expense Breakdown Pie Chart */}
                    <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-orange-200 hover:shadow-lg py-0">
                        <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-orange-950/30 border-b-1 border-orange-100 dark:border-orange-900 py-3 gap-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/30">
                                    <CalendarRange className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle>Expense Breakdown</CardTitle>
                                    <p className="text-xs text-muted-foreground">Distribution by expense account</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6 pt-4">
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <Kpi label="Total" value={`${currencySymbol} ${fmt(expenseStats.total)}`} tone="red" />
                                <Kpi label="Categories" value={String(expenseStats.count)} />
                                <Kpi label="Largest" value={expenseStats.top ? `${expenseStats.topPct.toFixed(0)}% · ${expenseStats.top.name}` : '—'} />
                            </div>
                            <div className="h-[300px] w-full min-w-0 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            data={expenseBreakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {expenseBreakdownData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>

                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="mt-8 overflow-hidden border-2 transition-all duration-300 hover:border-violet-200 hover:shadow-lg py-0">
                    <CardHeader className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-violet-950/30 border-b-1 border-violet-100 dark:border-violet-900 py-3 gap-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl shadow-lg shadow-violet-500/30">
                                <History className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle>Recent Activity</CardTitle>
                                <p className="text-xs text-muted-foreground">Latest journal postings</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-3">
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Kpi label="Entries" value={String(activityStats.count)} />
                            <Kpi label="Income" value={`${currencySymbol} ${fmt(activityStats.income)}`} tone="emerald" />
                            <Kpi label="Expense" value={`${currencySymbol} ${fmt(activityStats.expense)}`} tone="red" />
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                            </div>
                                        </div>
                                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                    </div>
                                ))
                            ) : recentError ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Couldn&apos;t load recent activity.</p>
                            ) : recentActivity.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">No recent activity yet.</p>
                            ) : (
                                recentActivity.map((activity: any, idx: number) => {
                                    const isIncome = activity.type === 'income';
                                    const isExpense = activity.type === 'expense';
                                    const amount = Number(activity.amount) || 0;
                                    return (
                                        <div key={activity.id ?? idx} className="flex items-center justify-between py-3.5">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : isExpense ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {isIncome
                                                        ? <ArrowUpRight className="h-5 w-5" />
                                                        : isExpense
                                                            ? <ArrowDownLeft className="h-5 w-5" />
                                                            : <ArrowLeftRight className="h-5 w-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{activity.title}</p>
                                                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                                                </div>
                                            </div>
                                            <div className={`ml-4 shrink-0 font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                                {isIncome ? '+' : isExpense ? '−' : ''}{currencySymbol} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    )
}
