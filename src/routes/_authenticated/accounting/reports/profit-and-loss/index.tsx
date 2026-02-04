
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { DateRange } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetProfitLossQuery } from "@/features/accounting/accountingQueries";
import { TopNav } from "@/components/layout/top-nav";
import { topNav } from "@/data/data";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Header } from "@/components/layout/header";

export const Route = createFileRoute('/_authenticated/accounting/reports/profit-and-loss/')({
    component: ProfitAndLoss,
})

function ProfitAndLoss() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const { data: reportData, isLoading } = useGetProfitLossQuery({
        from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    });

    const income = reportData?.income || [];
    const expense = reportData?.expense || [];
    // @ts-ignore
    const totalIncome = reportData?.total_income || 0;
    // @ts-ignore
    const totalExpense = reportData?.total_expense || 0;
    const netProfit = totalIncome - totalExpense;

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
                        <p className="text-muted-foreground">Financial performance summary.</p>
                    </div>
                    <div className="flex gap-2">
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            placeholder="Select period"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* INCOME */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-emerald-600">Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                    ) : income.length === 0 ? (
                                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No income records.</TableCell></TableRow>
                                    ) : (
                                        income.map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell>Total Income</TableCell>
                                        <TableCell className="text-right text-emerald-600">{totalIncome.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* EXPENSE */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                    ) : expense.length === 0 ? (
                                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No expense records.</TableCell></TableRow>
                                    ) : (
                                        expense.map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell>Total Expense</TableCell>
                                        <TableCell className="text-right text-red-600">{totalExpense.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* NET PROFIT */}
                <Card className={cn("mt-6 border-l-4", netProfit >= 0 ? "border-l-emerald-500" : "border-l-red-500")}>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Net Profit / (Loss)</h3>
                            <div className={cn("text-2xl font-bold", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {netProfit >= 0 ? `+ ${netProfit.toFixed(2)}` : `- ${Math.abs(netProfit).toFixed(2)}`}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
