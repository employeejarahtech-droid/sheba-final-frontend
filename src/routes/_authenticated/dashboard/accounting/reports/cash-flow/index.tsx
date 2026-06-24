"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useGetCashFlowQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';

const cashFlowSearchSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
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
        render: (data: any) => <span class="font-mono text-xs text-muted-foreground">${data || ``}</span>
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
            return <span class="${color}">${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>;
        }
    },
];

function CashFlow() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [localFrom, setLocalFrom] = useState<Date | undefined>(
        searchParams.from ? new Date(searchParams.from) : firstDayOfMonth
    );
    const [localTo, setLocalTo] = useState<Date | undefined>(
        searchParams.to ? new Date(searchParams.to) : today
    );

    const fromStr = localFrom ? format(localFrom, "yyyy-MM-dd") : undefined;
    const toStr = localTo ? format(localTo, "yyyy-MM-dd") : undefined;

    const { data: reportData, isLoading } = useGetCashFlowQuery({
        from: fromStr,
        to: toStr,
    });

    const handleNavigate = (key: string, date: Date | undefined) => {
        if (!date) return;
        navigate({
            search: (prev: any) => ({
                ...prev,
                [key]: format(date, "yyyy-MM-dd"),
            })
        });
    };

    const operating = reportData?.operating || { items: [], total: 0 };
    const investing = reportData?.investing || { items: [], total: 0 };
    const financing = reportData?.financing || { items: [], total: 0 };
    const openingCash = reportData?.opening_cash || 0;
    const closingCash = reportData?.closing_cash || 0;
    const netCashChange = reportData?.net_cash_change || 0;

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main className='p-6 lg:p-10'>
                <PageHeader
                    title="Cash Flow"
                    description="Cash inflows and outflows by Operating, Investing, and Financing activities."
                    actions={
                        <div className="flex items-center gap-2">
                            <Link to="/dashboard/accounting/reports/cash-flow/print" search={{ from: fromStr, to: toStr }}>
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                            </Link>
                            <span className="text-sm font-medium">From:</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !localFrom && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {localFrom ? format(localFrom, "PP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="single" selected={localFrom} onSelect={(d) => { setLocalFrom(d); handleNavigate("from", d); }} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <span className="text-sm font-medium">To:</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !localTo && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {localTo ? format(localTo, "PP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="single" selected={localTo} onSelect={(d) => { setLocalTo(d); handleNavigate("to", d); }} initialFocus />
                                </PopoverContent>
                            </Popover>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-emerald-700 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" /> Operating Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={operating.items} isLoading={isLoading} />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Cash from Operations</span>
                                <span className={operating.total >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(operating.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investing Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <Wallet className="w-5 h-5" /> Investing Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={investing.items} isLoading={isLoading} />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Net Cash from Investing</span>
                                <span className={investing.total >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(investing.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financing Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-purple-700 flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5" /> Financing Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={financing.items} isLoading={isLoading} />
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
                </div>
            </main>
        </div>
    );
}