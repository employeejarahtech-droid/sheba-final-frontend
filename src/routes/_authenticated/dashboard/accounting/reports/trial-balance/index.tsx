"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Printer } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

import { useGetTrialBalanceQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header'

const trialBalanceSearchSchema = z.object({
    date: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/trial-balance/')({
    validateSearch: (search) => trialBalanceSearchSchema.parse(search),
    component: TrialBalance,
})

function TrialBalance() {
    const searchParams = Route.useSearch();
    const navigate = Route.useNavigate();

    const dateStr = searchParams.date || format(new Date(), "yyyy-MM-dd");
    const [localDate, setLocalDate] = useState<Date | undefined>(searchParams.date ? new Date(searchParams.date) : new Date());

    const { data: reportData, isLoading } = useGetTrialBalanceQuery({
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

    // @ts-ignore
    const trialBalanceData = reportData?.data?.trial_balance || [];
    // @ts-ignore
    const totalDebit = reportData?.data?.total_debit || 0;
    // @ts-ignore
    const totalCredit = reportData?.data?.total_credit || 0;
    // @ts-ignore
    const status = reportData?.data?.status || "UNBALANCED";
    const isBalanced = status === "BALANCED";

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main className='p-6 lg:p-10'>
                <PageHeader
                    title="Trial Balance"
                    description="Summary of all ledger account balances."
                    actions={
                        <div className="flex items-center gap-2">
                            <Link to="/dashboard/accounting/reports/trial-balance/print" search={{ date: dateStr }}>
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                            </Link>
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
                    }
                    showBackButton={false}
                />

                <Card className="py-6 mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Account Balances</CardTitle>
                        {isLoading ? (
                            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                        ) : isBalanced ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> BALANCED
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" /> UNBALANCED
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="p-0 px-6">
                        <DataTable
                            columns={[
                                {
                                    data: "code",
                                    title: "Code",
                                    render: (data: any) => <span class="font-mono text-xs text-muted-foreground">${data || ''}</span>
                                },
                                {
                                    data: "account",
                                    title: "Account Name",
                                    className: "font-medium"
                                },
                                {
                                    data: "type",
                                    title: "Type",
                                    className: "text-xs text-muted-foreground"
                                },
                                {
                                    data: "debit",
                                    title: "Debit Balance",
                                    className: "text-right font-mono text-sm",
                                    render: (data: any) => data > 0 ? Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"
                                },
                                {
                                    data: "credit",
                                    title: "Credit Balance",
                                    className: "text-right font-mono text-sm",
                                    render: (data: any) => data > 0 ? Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"
                                },
                            ]}
                            data={trialBalanceData}
                            isLoading={isLoading}
                        />
                        {!isLoading && trialBalanceData.length > 0 && (
                            <div className="flex items-center gap-4 bg-muted/50 p-4 font-bold text-base border-t">
                                <div className="ml-auto">Totals</div>
                                <div className="w-[150px] text-right text-emerald-600">
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="w-[150px] text-right text-emerald-600">
                                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}