"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Wallet, TrendingUp, ArrowRightLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DateField } from "@/components/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useGetCashFlowQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';

const cashFlowSearchSchema = z.object({
    from: z.string().catch(''),
    to: z.string().catch(''),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/cash-flow/')({
    validateSearch: (search) => cashFlowSearchSchema.parse(search),
    component: CashFlow,
});

const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });

const columns = [
    {
        data: "code",
        title: "Code",
        className: "text-left",
        render: (data: any) => `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data || ''}</span>`
    },
    {
        data: "name",
        title: "Account Name",
        className: "font-medium"
    },
    {
        data: "amount",
        title: "Amount",
        className: "text-right font-mono text-sm",
        render: (data: any) => {
            const val = Number(data);
            const color = val >= 0 ? 'text-emerald-600' : 'text-red-600';
            return `<span class="${color}">${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>`;
        }
    },
];

// ---- Date preset helpers (same pattern as the Journal report) ----
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const toYMD = (d: Date) => format(d, 'yyyy-MM-dd');

function CashFlow() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();

    // All URL-driven — no local date state, same model as the Journal report.
    const from = searchParams.from || "";
    const to = searchParams.to || "";

    const setFrom = (v: string) => navigate({ to: '.', search: { from: v, to } });
    const setTo = (v: string) => navigate({ to: '.', search: { from, to: v } });
    const clearDates = () => navigate({ to: '.', search: { from: '', to: '' } });

    const datePresets = useMemo(() => ({
        today: { from: toYMD(today()), to: toYMD(today()) },
        yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { from: toYMD(d), to: toYMD(d) }; })(),
        last7: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
        last15: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
        last30: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
        last45: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
        last60: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
        last90: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
        last180: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
        last365: { from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
    }), []);

    const activePreset = useMemo(() => {
        if (!from || !to) return 'custom';
        const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
        return match ? match[0] : 'custom';
    }, [from, to, datePresets]);

    const applyPreset = (key: string) => {
        const p = (datePresets as any)[key];
        if (p) navigate({ to: '.', search: { from: p.from, to: p.to } });
    };

    const { data: reportData, isLoading } = useGetCashFlowQuery({
        from: from || undefined,
        to: to || undefined,
    });

    const operating = reportData?.operating || { items: [], total: 0 };
    const investing = reportData?.investing || { items: [], total: 0 };
    const financing = reportData?.financing || { items: [], total: 0 };
    const openingCash = reportData?.opening_cash || 0;
    const closingCash = reportData?.closing_cash || 0;
    const netCashChange = reportData?.net_cash_change || 0;
    const cashItems = reportData?.cash_items || [];

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main className=''>
                <PageHeader
                    title="Cash Flow"
                    description="Cash inflows and outflows by Operating, Investing, and Financing activities."
                    actions={
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Select value={activePreset} onValueChange={applyPreset}>
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
                            <DateField value={from} onChange={setFrom} placeholder="From" />
                            <span className="text-xs text-muted-foreground">to</span>
                            <DateField value={to} onChange={setTo} placeholder="To" />
                            {(from || to) && (
                                <Button variant="ghost" size="sm" onClick={clearDates}>Clear</Button>
                            )}
                            <Link to="/dashboard/accounting/reports/cash-flow/print" search={{ from: from || undefined, to: to || undefined }}>
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                            </Link>
                        </div>
                    }
                    showBackButton={false}
                />

                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6 font-mono">
                    <Card className="bg-slate-50/50 border-slate-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-slate-600">Opening Cash</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-700">{fmt(openingCash)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50/50 border-emerald-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-emerald-600">Operating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", operating.total >= 0 ? "text-emerald-700" : "text-red-700")}>
                                {fmt(operating.total)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-blue-600">Net Cash Change</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", netCashChange >= 0 ? "text-emerald-700" : "text-red-700")}>
                                {fmt(netCashChange)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-primary">Closing Cash</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{fmt(closingCash)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Sections */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Operating Activities */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Operating Activities</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Cash from core business operations</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={operating.items} isLoading={isLoading} hideExport />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Cash from Operations</span>
                                <span className={operating.total >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(operating.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investing Activities */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                                    <Wallet className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Investing Activities</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Cash from buying or selling assets</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={investing.items} isLoading={isLoading} hideExport />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Cash from Investing</span>
                                <span className={investing.total >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(investing.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financing Activities */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg shadow-lg">
                                    <ArrowRightLeft className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Financing Activities</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Cash from loans, capital, and owners</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={financing.items} isLoading={isLoading} hideExport />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Cash from Financing</span>
                                <span className={financing.total >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(financing.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Cash Summary */}
                    <Card className="bg-primary/5 border-primary/20 border-2">
                        <CardContent className="py-6 space-y-4">
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Cash Flow Summary</div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span>Opening Cash Balance</span>
                                    <span className="font-mono font-medium">{fmt(openingCash)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>(+) Operating Activities</span>
                                    <span className={cn("font-mono font-medium", operating.total >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(operating.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>(+) Investing Activities</span>
                                    <span className={cn("font-mono font-medium", investing.total >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(investing.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>(+) Financing Activities</span>
                                    <span className={cn("font-mono font-medium", financing.total >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(financing.total)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
                                    <span>Net Cash Change</span>
                                    <span className={cn("font-mono", netCashChange >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(netCashChange)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                                    <span>Closing Cash Balance</span>
                                    <span className="font-mono text-primary">{fmt(closingCash)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cash & Bank Movement — the accounts that make up the net change */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 lg:col-span-2">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg shadow-lg">
                                    <Wallet className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Cash & Bank Movement</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">How the net cash change breaks down by cash &amp; bank account</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={cashItems} isLoading={isLoading} hideExport />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Change in Cash</span>
                                <span className={netCashChange >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(netCashChange)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

export default CashFlow;
