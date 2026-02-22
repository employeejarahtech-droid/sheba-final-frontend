
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
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

import { useGetBalanceSheetQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from "@/components/layout/app-header";

const balanceSheetSearchSchema = z.object({
    date: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/accounting/reports/balance-sheet/')({
    validateSearch: (search) => balanceSheetSearchSchema.parse(search),
    component: BalanceSheet,
});

function BalanceSheet() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();

    const dateStr = searchParams.date || format(new Date(), "yyyy-MM-dd");
    const [localDate, setLocalDate] = useState<Date | undefined>(searchParams.date ? new Date(searchParams.date) : new Date());

    const { data: reportData, isLoading } = useGetBalanceSheetQuery({
        date: dateStr
    });

    const handleDateChange = (newDate: Date | undefined) => {
        setLocalDate(newDate);
        if (newDate) {
            navigate({
                search: (prev: any) => ({
                    ...prev,
                    date: format(newDate, "yyyy-MM-dd")
                })
            });
        }
    };

    const assets = reportData?.assets || [];
    const liabilities = reportData?.liabilities || [];
    const equity = reportData?.equity || [];
    const totalAssets = reportData?.total_assets || 0;
    const totalLiabilities = reportData?.total_liabilities || 0;
    const totalEquity = reportData?.total_equity || 0;

    const columns = [
        {
            data: "code",
            title: "Code",
            render: (data: any) => `<span class="font-mono text-xs text-muted-foreground">${data || ''}</span>`
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
            render: (data: any) => Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 })
        },
    ];

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main className='p-6 lg:p-10'>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Balance Sheet</h2>
                        <p className="text-muted-foreground">Snapshot of assets, liabilities, and equity.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">As of:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !localDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {localDate ? format(localDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={localDate}
                                    onSelect={handleDateChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 font-mono">
                    <Card className="bg-emerald-50/50 border-emerald-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-emerald-600">Total Assets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700">
                                {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50/50 border-red-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-red-600">Total Liabilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">
                                {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-blue-600">Total Equity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">
                                {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="lg:row-span-2">
                        <CardHeader>
                            <CardTitle className="text-emerald-700 flex items-center gap-2">
                                <Scale className="w-5 h-5" /> Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={columns}
                                data={assets}
                                isLoading={isLoading}
                                className="border-0 shadow-none"
                            />
                            <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                <span>Total Assets</span>
                                <span className="text-emerald-700">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-700 flex items-center gap-2">
                                    <Scale className="w-5 h-5 rotate-180" /> Liabilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DataTable
                                    columns={columns}
                                    data={liabilities}
                                    isLoading={isLoading}
                                    className="border-0 shadow-none"
                                />
                                <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                    <span>Total Liabilities</span>
                                    <span className="text-red-700">{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-blue-700 flex items-center gap-2">
                                    <Scale className="w-5 h-5" /> Equity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DataTable
                                    columns={columns}
                                    data={equity}
                                    isLoading={isLoading}
                                    className="border-0 shadow-none"
                                />
                                <div className="p-4 bg-muted/30 border-t flex justify-between font-bold text-base">
                                    <span>Total Equity</span>
                                    <span className="text-blue-700">{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20 border-2">
                            <CardContent className="py-6 space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    <span>Accounting Equation</span>
                                    <span className="text-xs lowercase text-muted-foreground/50 italic">(Assets = Liabilities + Equity)</span>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-emerald-600">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total Assets</div>
                                    </div>
                                    <div className="text-2xl font-light text-muted-foreground">=</div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-700">{(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Liabilities + Equity</div>
                                    </div>
                                </div>

                                {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? (
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
            </main>
        </div>
    );
}
