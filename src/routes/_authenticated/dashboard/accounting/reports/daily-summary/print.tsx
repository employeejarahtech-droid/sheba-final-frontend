import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer, Receipt, Scale, TrendingUp, TrendingDown } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetDailySummaryQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    date: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/daily-summary/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: DailySummaryPrintPage,
});

function DailySummaryPrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const selectedDate = search.date || format(new Date(), "yyyy-MM-dd");
    const { currencySymbol } = useCurrency();

    const { data: summaryData, isLoading } = useGetDailySummaryQuery({
        date: selectedDate,
    });

    const report = summaryData?.data;

    const openingBalance = report?.opening_balance ?? 0;
    const todayDebit = report?.today_debit ?? 0;
    const todayCredit = report?.today_credit ?? 0;
    const closingBalance = report?.closing_balance ?? 0;
    const transactions = report?.transactions ?? [];

    const refTypeBadge: Record<string, { label: string }> = {
        TRANSACTION: { label: "Transaction" },
        MANUAL: { label: "Manual" },
        INVOICE: { label: "Invoice" },
    };

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/daily-summary" search={{ date: search.date }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Daily Summary
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="padding-select" className="text-sm font-medium">Padding Top:</label>
                            <select
                                id="padding-select"
                                value={paddingTop}
                                onChange={(e) => setPaddingTop(Number(e.target.value))}
                                className="h-8 px-2 text-sm border rounded-md bg-background"
                            >
                                {paddingOptions.map((value) => (
                                    <option key={value} value={value}>{value}px</option>
                                ))}
                            </select>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div
                        className="max-w-5xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report"
                        style={{ paddingTop: `${paddingTop}px` }}
                    >
                        <style>
                            {`
                                @media print {
                                    * {
                                        -webkit-print-color-adjust: exact !important;
                                        print-color-adjust: exact !important;
                                        color-adjust: exact !important;
                                    }
                                    .bg-background { background-color: #fff; }
                                    body { color: #000; background-color: #fff; }
                                    .border { border-color: #333 !important; }
                                    .border-dashed { border-color: #999 !important; }
                                    .bg-row-blue { background-color: #cfd2d8ff !important; }
                                }
                            `}
                        </style>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-center underline mb-2 tracking-wide">
                            DAILY SUMMARY
                        </h1>
                        <div className="text-center text-sm text-gray-600 mb-6">
                            Date: {format(new Date(selectedDate), "dd/MM/yyyy")}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="border-2 border-blue-300 bg-blue-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase flex items-center justify-center gap-1">
                                    <Scale className="w-3 h-3" /> Opening Balance
                                </div>
                                <div className="text-xl font-bold text-blue-700 mt-1">{openingBalance.toFixed(2)}</div>
                            </div>
                            <div className="border-2 border-emerald-300 bg-emerald-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Today's Debit</div>
                                <div className="text-xl font-bold text-emerald-700 mt-1">{todayDebit.toFixed(2)}</div>
                            </div>
                            <div className="border-2 border-red-300 bg-red-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Today's Credit</div>
                                <div className="text-xl font-bold text-red-700 mt-1">{todayCredit.toFixed(2)}</div>
                            </div>
                            <div className={`border-2 p-3 text-center ${closingBalance >= 0 ? 'border-violet-300 bg-violet-50' : 'border-red-300 bg-red-50'}`}>
                                <div className="text-xs text-gray-600 uppercase flex items-center justify-center gap-1">
                                    {closingBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    Closing Balance
                                </div>
                                <div className={`text-xl font-bold mt-1 ${closingBalance >= 0 ? 'text-violet-700' : 'text-red-700'}`}>
                                    {closingBalance.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Calculation */}
                        <div className="border-2 border-gray-300 bg-gray-50 mb-6 p-4">
                            <div className="flex items-center justify-center gap-4 text-sm font-mono">
                                <span className="font-semibold">Closing Balance =</span>
                                <span className="text-blue-600 font-semibold">{currencySymbol} {openingBalance.toFixed(2)}</span>
                                <span className="text-gray-600">+</span>
                                <span className="text-emerald-600 font-semibold">{currencySymbol} {todayDebit.toFixed(2)}</span>
                                <span className="text-gray-600">-</span>
                                <span className="text-red-600 font-semibold">{currencySymbol} {todayCredit.toFixed(2)}</span>
                                <span className="text-gray-600">=</span>
                                <span className={`font-bold text-lg ${closingBalance >= 0 ? 'text-violet-600' : 'text-red-600'}`}>
                                    {currencySymbol} {closingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Today's Transactions */}
                        <div className="border-2 border-gray-300">
                            <div className="bg-blue-50 px-4 py-2 border-b-2 border-blue-200">
                                <h2 className="font-bold text-blue-700 flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Today's Transactions
                                </h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-row-blue">
                                        <th className="border px-3 py-2 text-left w-[60px]">ID</th>
                                        <th className="border px-3 py-2 text-left">Narration</th>
                                        <th className="border px-3 py-2 text-left w-[100px]">Type</th>
                                        <th className="border px-3 py-2 text-left">Accounts</th>
                                        <th className="border px-3 py-2 text-right w-[120px]">Debit ({currencySymbol})</th>
                                        <th className="border px-3 py-2 text-right w-[120px]">Credit ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx: any) => {
                                        const badge = refTypeBadge[tx.reference_type] || { label: tx.reference_type || '-' };
                                        return (
                                            <tr key={tx.journal_id} className="bg-gray-50">
                                                <td className="border px-3 py-1.5 font-mono text-xs">#{tx.journal_id}</td>
                                                <td className="border px-3 py-1.5 font-medium">{tx.narration || "-"}</td>
                                                <td className="border px-3 py-1.5">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="border px-3 py-1.5 text-xs">
                                                    {tx.entries.map((e: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-gray-500">{e.account_code}</span>
                                                            <span>{e.account_name}</span>
                                                            {e.debit > 0 && <span className="text-emerald-600 text-xs">Dr {e.debit.toFixed(2)}</span>}
                                                            {e.credit > 0 && <span className="text-red-600 text-xs">Cr {e.credit.toFixed(2)}</span>}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-mono text-emerald-600">
                                                    {tx.total_debit > 0 ? tx.total_debit.toFixed(2) : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-mono text-red-600">
                                                    {tx.total_credit > 0 ? tx.total_credit.toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="border px-3 py-2 text-right" colSpan={4}>Total</td>
                                        <td className="border px-3 py-2 text-right font-mono text-emerald-600">{todayDebit.toFixed(2)}</td>
                                        <td className="border px-3 py-2 text-right font-mono text-red-600">{todayCredit.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {transactions.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No transactions found for {format(new Date(selectedDate), "dd/MM/yyyy")}.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="grid grid-cols-2 mt-20 text-sm">
                            <div>
                                <p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p>
                            </div>
                            <div className="text-right">
                                <p className="border-t border-dashed w-56 ml-auto pt-1">Authorized Signature:</p>
                            </div>
                        </div>
                    </div>
                )}
            </Main>
        </>
    );
}