import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetTrialBalanceQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    date: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/trial-balance/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: TrialBalancePrintPage,
});

function TrialBalancePrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const dateStr = search.date || format(new Date(), "yyyy-MM-dd");
    const { currencySymbol } = useCurrency();

    const { data: reportData, isLoading } = useGetTrialBalanceQuery({
        date: dateStr
    });

    const trialBalanceData = reportData?.data?.trial_balance || [];
    const totalDebit = reportData?.data?.total_debit || 0;
    const totalCredit = reportData?.data?.total_credit || 0;
    const status = reportData?.data?.status || "UNBALANCED";
    const isBalanced = status === "BALANCED";

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/trial-balance" search={{ date: search.date }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Trial Balance
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
                        className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report"
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
                        <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide">
                            TRIAL BALANCE
                        </h1>

                        {/* Header Info */}
                        <div className="flex items-center justify-between mb-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">As of:</span>
                                <span className="font-medium">{search.date ? format(new Date(search.date), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isBalanced ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> BALANCED
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <AlertCircle className="w-3 h-3 mr-1" /> UNBALANCED
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Trial Balance Table */}
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-row-blue">
                                    <th className="border px-3 py-2 text-left w-[80px]">Code</th>
                                    <th className="border px-3 py-2 text-left">Account Name</th>
                                    <th className="border px-3 py-2 text-left w-[100px]">Type</th>
                                    <th className="border px-3 py-2 text-right w-[130px]">Debit ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[130px]">Credit ({currencySymbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trialBalanceData.length > 0 ? (
                                    <>
                                        {trialBalanceData.map((account: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5 font-mono text-xs">
                                                    {account.code || '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 font-medium">
                                                    {account.account || '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-xs text-gray-600">
                                                    {account.type || '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-mono text-sm">
                                                    {account.debit > 0 ? Number(account.debit).toFixed(2) : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-mono text-sm">
                                                    {account.credit > 0 ? Number(account.credit).toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-row-blue font-bold">
                                            <td className="border px-3 py-2" colSpan={3}>TOTALS</td>
                                            <td className="border px-3 py-2 text-right">{totalDebit.toFixed(2)}</td>
                                            <td className="border px-3 py-2 text-right">{totalCredit.toFixed(2)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td className="border px-3 py-4 text-center text-gray-500" colSpan={5}>No accounts found for the selected date.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Summary */}
                        {trialBalanceData.length > 0 && (
                            <div className="w-full text-sm mt-6 ml-auto" style={{ maxWidth: "400px" }}>
                                <table className="w-full">
                                    <tbody>
                                        <tr className={isBalanced ? "bg-emerald-50" : "bg-red-50"}>
                                            <td className="px-3 py-2 border-b font-semibold">Status</td>
                                            <td className={`px-3 py-2 border-b text-right font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {status}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b">Total Debit</td>
                                            <td className="px-3 py-2 border-b text-right font-semibold">{currencySymbol} {totalDebit.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b">Total Credit</td>
                                            <td className="px-3 py-2 border-b text-right font-semibold">{currencySymbol} {totalCredit.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b">Difference</td>
                                            <td className="px-3 py-2 border-b text-right font-semibold">
                                                {currencySymbol} {Math.abs(totalDebit - totalCredit).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

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