
"use client";

import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { z } from "zod";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

import { useGetProfitLossQuery } from "@/features/accounting/accountingQueries";
import { TopNav } from "@/components/layout/top-nav";
import { topNav } from "@/data/data";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Header } from "@/components/layout/header";

const profitLossSearchSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/accounting/reports/profit-and-loss/')({
    validateSearch: (search) => profitLossSearchSchema.parse(search),
    component: ProfitAndLoss,
})

function ProfitAndLoss() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();

    const fromDateStr = searchParams.from || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const toDateStr = searchParams.to || format(new Date(), 'yyyy-MM-dd');

    const [from, setFrom] = useState<Date | undefined>(new Date(fromDateStr));
    const [to, setTo] = useState<Date | undefined>(new Date(toDateStr));

    const { data: reportData, isLoading } = useGetProfitLossQuery({
        from: fromDateStr,
        to: toDateStr,
    });

    const updateFilters = (newFrom: Date | undefined, newTo: Date | undefined) => {
        navigate({
            search: (prev: any) => ({
                ...prev,
                from: newFrom ? format(newFrom, 'yyyy-MM-dd') : undefined,
                to: newTo ? format(newTo, 'yyyy-MM-dd') : undefined,
            })
        });
    };

    const income = reportData?.income || [];
    const expense = reportData?.expense || [];
    const totalIncome = reportData?.total_income || 0;
    const totalExpense = reportData?.total_expense || 0;
    const netProfit = reportData?.net_profit || 0;

    const columns = [
        {
            data: "name",
            title: "Account",
            className: "font-medium"
        },
        {
            data: "amount",
            title: "Amount",
            className: "text-right font-mono",
            render: (data: any) => Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 })
        },
    ];

    return (
        <div className="space-y-6">
            <Header fixed>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <main className='p-6 lg:p-10'>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Profit & Loss</h2>
                        <p className="text-muted-foreground">Financial performance for the selected period.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {from ? format(from, "PP") : "Start Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={from} onSelect={(d) => { setFrom(d); updateFilters(d, to); }} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <span className="text-muted-foreground">-</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {to ? format(to, "PP") : "End Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={to} onSelect={(d) => { setTo(d); updateFilters(from, d); }} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* INCOME */}
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="bg-emerald-50/30 border-b">
                            <CardTitle className="text-emerald-700 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" /> Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={columns}
                                data={income}
                                isLoading={isLoading}
                                className="border-0"
                            />
                            <div className="p-4 bg-emerald-50/50 border-t flex justify-between font-bold text-lg">
                                <span className="text-emerald-800">Total Income</span>
                                <span className="text-emerald-700 font-mono">{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* EXPENSE */}
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader className="bg-red-50/30 border-b">
                            <CardTitle className="text-red-700 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5" /> Expense
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={columns}
                                data={expense}
                                isLoading={isLoading}
                                className="border-0"
                            />
                            <div className="p-4 bg-red-50/50 border-t flex justify-between font-bold text-lg">
                                <span className="text-red-800">Total Expense</span>
                                <span className="text-red-700 font-mono">{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
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
                                {netProfit >= 0 ? "+" : "-"}{Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium pt-4">
                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">Income: {totalIncome.toLocaleString()}</div>
                                <div className="text-muted-foreground">vs</div>
                                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Expense: {totalExpense.toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
