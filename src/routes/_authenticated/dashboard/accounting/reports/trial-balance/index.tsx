"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Scale, Printer, DollarSign, Wallet, ListChecks } from "lucide-react";
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
import { StatCards, type StatCardData } from "@/features/assets/components/StatCard";

import { useGetTrialBalanceQuery } from "@/features/accounting/accountingQueries";
import { AppHeader } from '@/components/layout/app-header';

const trialBalanceSearchSchema = z.object({
    date: z.string().optional(),
})

const STAT_COLORS = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6']

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
    ASSET: { label: 'Asset', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    LIABILITY: { label: 'Liability', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
    EQUITY: { label: 'Equity', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
    INCOME: { label: 'Income', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
    EXPENSE: { label: 'Expense', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}

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

    // Only show heads with an actual (non-zero) debit or credit balance —
    // zero-balance heads add noise without adding information. Totals below
    // still come from the API's full-set sums, so they stay correct either way.
    // @ts-ignore
    const trialBalanceData = (reportData?.trial_balance || []).filter(
        (row: any) => Number(row.debit) > 0 || Number(row.credit) > 0
    );
    // @ts-ignore
    const totalDebit = reportData?.total_debit || 0;
    // @ts-ignore
    const totalCredit = reportData?.total_credit || 0;
    // @ts-ignore
    const status = reportData?.status || "UNBALANCED";
    const isBalanced = status === "BALANCED";
    const activeAccountCount = trialBalanceData.length;

    // Rows actually handed to the table: the fetched accounts plus a synthetic
    // TOTALS row, appended only once loading has finished and there's data.
    const tableRows = !isLoading && trialBalanceData.length > 0
        ? [...trialBalanceData, { __isTotal: true, code: '', account: 'TOTALS', type: '', debit: totalDebit, credit: totalCredit }]
        : trialBalanceData;

    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const cards: StatCardData[] = [
        { label: 'Total Debit', value: fmt(totalDebit), icon: DollarSign, headerBg: STAT_COLORS[0], iconColor: STAT_COLORS[0] },
        { label: 'Total Credit', value: fmt(totalCredit), icon: Wallet, headerBg: STAT_COLORS[1], iconColor: STAT_COLORS[1] },
        { label: 'Balance Status', value: isBalanced ? 'BALANCED' : 'UNBALANCED', icon: Scale, headerBg: isBalanced ? STAT_COLORS[2] : '#EF4444', iconColor: isBalanced ? STAT_COLORS[2] : '#EF4444' },
        { label: 'Accounts with Activity', value: activeAccountCount, icon: ListChecks, headerBg: STAT_COLORS[3], iconColor: STAT_COLORS[3] },
    ]

    return (
        <div className="space-y-6">
            <AppHeader fixed />
            <main className=''>
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Trial Balance
                            </h1>
                            <p className="text-muted-foreground text-sm">Net debit/credit balance per account, as of a given date</p>
                        </div>
                    </div>
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
                </div>

                <StatCards cards={cards} />

                <DataTable
                    tableTitle="Account Balances"
                    columns={[
                        {
                            data: "code",
                            title: "Code",
                            className: "text-left",
                            render: (data: any, _type: string, row: any) =>
                                row.__isTotal ? '' : `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data || ''}</span>`
                        },
                        {
                            data: "account",
                            title: "Account Name",
                            className: "font-medium",
                            render: (data: any, _type: string, row: any) =>
                                row.__isTotal ? `<span class="font-bold">${data}</span>` : data
                        },
                        {
                            data: "type",
                            title: "Type",
                            render: (data: any, _type: string, row: any) => {
                                if (row.__isTotal) return '';
                                const cfg = TYPE_BADGE[data] || { label: data || '-', className: 'bg-gray-100 text-gray-600' };
                                return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}">${cfg.label}</span>`;
                            }
                        },
                        {
                            data: "debit",
                            title: "Debit Balance",
                            className: "text-right font-mono text-sm",
                            render: (data: any, _type: string, row: any) => {
                                const val = data > 0 ? Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-";
                                return row.__isTotal ? `<span class="font-bold text-emerald-600">${val}</span>` : val;
                            }
                        },
                        {
                            data: "credit",
                            title: "Credit Balance",
                            className: "text-right font-mono text-sm",
                            render: (data: any, _type: string, row: any) => {
                                const val = data > 0 ? Number(data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-";
                                return row.__isTotal ? `<span class="font-bold text-emerald-600">${val}</span>` : val;
                            }
                        },
                    ]}
                    data={tableRows}
                    meta={{ page: 1, limit: tableRows.length || 1, total: tableRows.length }}
                    // Every account is fetched and rendered in one go (no server paging
                    // for this report) — without an explicit limit, DataTable.tsx's
                    // internal jQuery pageLength defaults to 10 with no page controls
                    // wired up, silently hiding every account past the 10th.
                    isLoading={isLoading}
                    hideExport
                    // The rows already arrive pre-sorted Assets → Liabilities → Equity →
                    // Income → Expense, by code (see accounting.repository.js
                    // getTrialBalance). Without this, DataTable.tsx's default
                    // `order: [[0, 'desc']]` re-sorts client-side by the Code column —
                    // which renders a badge <span>, so it's a string sort on markup, not
                    // even a clean numeric one — scrambling the type grouping entirely.
                    defaultOrder={[]}
                    createdRow={(row: any, rowData: any) => {
                        if (rowData?.__isTotal) {
                            row.classList.add('bg-muted/50', 'border-t-2', 'border-t-foreground/20');
                        }
                    }}
                />
            </main>
        </div>
    );
}
