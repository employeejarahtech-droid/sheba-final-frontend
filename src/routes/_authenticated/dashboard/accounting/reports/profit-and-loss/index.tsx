"use client";

import { useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from "zod";
import { TrendingUp, TrendingDown, Printer, X, AlertCircle, FileText, CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/date-field";

import { useGetProfitLossQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { useCurrency } from '@/hooks/use-currency';

const profitLossSearchSchema = z.object({
    from: z.string().catch(''),
    to: z.string().catch(''),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/profit-and-loss/')({
    validateSearch: (search) => profitLossSearchSchema.parse(search),
    component: ProfitAndLoss,
})

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Parse a YYYY-MM-DD string as a local date (avoids UTC off-by-one in display). */
const parseLocal = (iso: string) => {
    const [y, m, d] = (iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const shift = (days: number) => { const d = today(); d.setDate(d.getDate() + days); return d; };

const DATE_PRESETS: Record<string, { label: string; from: string; to: string }> = {
    today:     { label: 'Today',         from: toYMD(today()),                to: toYMD(today()) },
    yesterday: { label: 'Yesterday',     from: toYMD(shift(-1)),              to: toYMD(shift(-1)) },
    last7:     { label: 'Last 7 days',   from: toYMD(shift(-6)),              to: toYMD(today()) },
    last15:    { label: 'Last 15 days',  from: toYMD(shift(-14)),             to: toYMD(today()) },
    last30:    { label: 'Last 30 days',  from: toYMD(shift(-29)),             to: toYMD(today()) },
    last60:    { label: 'Last 60 days',  from: toYMD(shift(-59)),             to: toYMD(today()) },
    last90:    { label: 'Last 90 days',  from: toYMD(shift(-89)),             to: toYMD(today()) },
    last180:   { label: 'Last 180 days', from: toYMD(shift(-179)),            to: toYMD(today()) },
    last365:   { label: 'Last 365 days', from: toYMD(shift(-364)),            to: toYMD(today()) },
    thisMonth: { label: 'This month',    from: toYMD(startOfMonth(today())),  to: toYMD(today()) },
    thisYear:  { label: 'This year',     from: `${today().getFullYear()}-01-01`, to: toYMD(today()) },
};

type Line = { code?: string; name?: string; amount?: number };

function BreakdownTable({ rows, total, currencySymbol, tone, isLoading, emptyText }: {
    rows: Line[];
    total: number;
    currencySymbol: string;
    tone: 'income' | 'expense';
    isLoading: boolean;
    emptyText: string;
}) {
    const toneClasses = tone === 'income'
        ? { footBg: 'bg-emerald-50/60', footText: 'text-emerald-800' }
        : { footBg: 'bg-red-50/60', footText: 'text-red-800' };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2.5 px-6 font-semibold">Account</th>
                        <th className="py-2.5 px-6 text-right font-semibold w-[150px]">Amount</th>
                        <th className="py-2.5 px-6 text-right font-semibold w-24">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="border-b last:border-0">
                                <td className="py-2.5 px-6"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></td>
                                <td className="py-2.5 px-6 text-right"><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></td>
                                <td className="py-2.5 px-6 text-right"><div className="h-4 w-10 bg-muted animate-pulse rounded ml-auto" /></td>
                            </tr>
                        ))
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="py-8 px-6 text-center text-sm text-muted-foreground italic">{emptyText}</td>
                        </tr>
                    ) : (
                        rows.map((row, i) => {
                            const share = total > 0 ? ((Number(row.amount) || 0) / total) * 100 : 0;
                            return (
                                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="py-2.5 px-6">
                                        <span className="font-medium">{row.name || '—'}</span>
                                        {row.code && <span className="ml-2 font-mono text-xs text-muted-foreground">{row.code}</span>}
                                    </td>
                                    <td className="py-2.5 px-6 text-right font-mono tabular-nums">{fmt(row.amount || 0)}</td>
                                    <td className="py-2.5 px-6 text-right text-muted-foreground tabular-nums">{share.toFixed(1)}%</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                <tfoot>
                    <tr className={cn('border-t-2 font-bold', toneClasses.footBg)}>
                        <td className={cn('py-3 px-6', toneClasses.footText)}>Total {tone === 'income' ? 'Income' : 'Expense'}</td>
                        <td className={cn('py-3 px-6 text-right font-mono tabular-nums', toneClasses.footText)}>
                            {currencySymbol} {fmt(total)}
                        </td>
                        <td className="py-3 px-6 text-right text-muted-foreground">100%</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function ProfitAndLoss() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();
    const { currencySymbol } = useCurrency();

    // All params are URL-driven
    const from = searchParams.from || "";
    const to   = searchParams.to   || "";

    // URL navigators
    const setFrom = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: v }) });
    const setTo   = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, to: v }) });
    const clearDates = () => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: '', to: '' }) });

    // When the URL has no range, default to the current month (matches the print page).
    const effectiveFrom = from || DATE_PRESETS.thisMonth.from;
    const effectiveTo   = to   || DATE_PRESETS.thisMonth.to;

    // Active preset detection
    const activePreset = useMemo(() => {
        if (!from && !to) return 'thisMonth';
        if (!from || !to) return 'custom';
        const match = Object.entries(DATE_PRESETS).find(([, v]) => v.from === from && v.to === to);
        return match ? match[0] : 'custom';
    }, [from, to]);

    const applyPreset = (key: string) => {
        const p = DATE_PRESETS[key];
        if (p) {
            navigate({ to: '.', search: (prev: any) => ({ ...prev, from: p.from, to: p.to }) });
        }
    };

    const invalidRange = !!from && !!to && from > to;

    const { data: reportData, isLoading, isError, error, refetch } = useGetProfitLossQuery({
        from: effectiveFrom,
        to:   effectiveTo,
    });

    const income = reportData?.income || [];
    const expense = reportData?.expense || [];
    const totalIncome = reportData?.total_income || 0;
    const totalExpense = reportData?.total_expense || 0;
    const netProfit = reportData?.net_profit || 0;

    const hasData = income.length > 0 || expense.length > 0;

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main>
                <PageHeader
                    title="Profit & Loss"
                    description="Financial performance for the selected period."
                    actions={
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                                to="/dashboard/accounting/reports/profit-and-loss/print"
                                search={{ from: effectiveFrom, to: effectiveTo } as any}
                            >
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                            </Link>
                            <Select value={activePreset} onValueChange={applyPreset}>
                                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                                    <SelectValue placeholder="Filter by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="thisMonth">This month</SelectItem>
                                    <SelectItem value="thisYear">This year</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7">Last 7 days</SelectItem>
                                    <SelectItem value="last15">Last 15 days</SelectItem>
                                    <SelectItem value="last30">Last 30 days</SelectItem>
                                    <SelectItem value="last60">Last 60 days</SelectItem>
                                    <SelectItem value="last90">Last 90 days</SelectItem>
                                    <SelectItem value="last180">Last 180 days</SelectItem>
                                    <SelectItem value="last365">Last 365 days</SelectItem>
                                    <SelectItem value="custom">Custom range</SelectItem>
                                </SelectContent>
                            </Select>
                            <DateField value={from} onChange={setFrom} placeholder="From" />
                            <span className="text-xs text-muted-foreground">to</span>
                            <DateField value={to} onChange={setTo} placeholder="To" />
                            {(from || to) && (
                                <Button variant="ghost" size="sm" onClick={clearDates} className="h-9 px-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    }
                    showBackButton={false}
                />

                {/* Period label */}
                <div className="mt-2 mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CalendarRange className="h-4 w-4" />
                    <span>Period:</span>
                    <span className="font-medium text-foreground">{format(parseLocal(effectiveFrom), 'dd MMM yyyy')}</span>
                    <span>–</span>
                    <span className="font-medium text-foreground">{format(parseLocal(effectiveTo), 'dd MMM yyyy')}</span>
                </div>

                {invalidRange ? (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="flex items-center gap-3 p-6 text-amber-800">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-medium">Invalid date range</p>
                                <p className="text-sm text-amber-700">The &ldquo;From&rdquo; date is after the &ldquo;To&rdquo; date. Please choose a valid range.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : isError ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                            <p className="font-medium text-red-700">Couldn&apos;t load the report</p>
                            <p className="text-sm text-red-600 max-w-md">
                                {error instanceof Error && error.message
                                    ? error.message
                                    : 'Something went wrong while fetching the Profit &amp; Loss data.'}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                        </CardContent>
                    </Card>
                ) : !isLoading && !hasData ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
                            <p className="font-medium">No data for this period</p>
                            <p className="text-sm text-muted-foreground max-w-md">
                                There are no income or expense postings between {format(parseLocal(effectiveFrom), 'dd MMM yyyy')} and {format(parseLocal(effectiveTo), 'dd MMM yyyy')}.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* INCOME */}
                            <Card className="border-emerald-100 shadow-sm pt-0 overflow-hidden">
                                <CardHeader className="bg-emerald-50/40 border-b py-4 gap-0">
                                    <CardTitle className="text-emerald-700 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" /> Income
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <BreakdownTable
                                        rows={income}
                                        total={totalIncome}
                                        currencySymbol={currencySymbol}
                                        tone="income"
                                        isLoading={isLoading}
                                        emptyText="No income recorded for this period."
                                    />
                                </CardContent>
                            </Card>

                            {/* EXPENSE */}
                            <Card className="border-red-100 shadow-sm pt-0 overflow-hidden">
                                <CardHeader className="bg-red-50/40 border-b py-4 gap-0">
                                    <CardTitle className="text-red-700 flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5" /> Expense
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <BreakdownTable
                                        rows={expense}
                                        total={totalExpense}
                                        currencySymbol={currencySymbol}
                                        tone="expense"
                                        isLoading={isLoading}
                                        emptyText="No expenses recorded for this period."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* NET PROFIT */}
                        <Card className={cn(
                            "mt-8 border-2 transition-all duration-300",
                            netProfit >= 0 ? "border-emerald-500 bg-emerald-50 shadow-emerald-100/50" : "border-red-500 bg-red-50 shadow-red-100/50",
                            "shadow-xl"
                        )}>
                            <CardContent className="p-10">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <h3 className="text-xl font-medium text-muted-foreground uppercase tracking-[0.2em]">{netProfit >= 0 ? "Net Profit" : "Net Loss"}</h3>
                                    <div className={cn("text-6xl font-black tracking-tight font-mono", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                                        {netProfit >= 0 ? '+' : '−'}{currencySymbol} {fmt(Math.abs(netProfit))}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium pt-4">
                                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">Income: {currencySymbol} {fmt(totalIncome)}</div>
                                        <div className="text-muted-foreground">vs</div>
                                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Expense: {currencySymbol} {fmt(totalExpense)}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
