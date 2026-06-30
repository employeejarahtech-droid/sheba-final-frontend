import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useLedgerReport } from '@/features/accounting/api/queries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    account_id: z.coerce.number(),
    from: z.string().optional(),
    to: z.string().optional(),
    account_name: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/ledger/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: LedgerPrintPage,
});

function LedgerPrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const { data: ledgerResponse, isLoading } = useLedgerReport({
        account_id: search.account_id,
        from: search.from,
        to: search.to,
    });
    const { currencySymbol } = useCurrency();

    const transactions = ledgerResponse?.transactions || [];
    const accountName = ledgerResponse?.account?.name || search.account_name || `#${search.account_id}`;
    const openingBalance = ledgerResponse?.opening_balance ?? 0;
    const totalDebit = transactions.reduce((sum: number, t: any) => sum + (t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum: number, t: any) => sum + (t.credit || 0), 0);
    const closingBalance = ledgerResponse?.closing_balance ?? 0;

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Ledger
                    </Button>
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
                        <h1 className="text-2xl font-bold text-center underline mb-2 tracking-wide">
                            LEDGER REPORT
                        </h1>
                        <h2 className="text-center text-lg font-semibold mb-6">
                            {accountName}
                        </h2>

                        {/* Header Info */}
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="border px-3 py-2 w-1/2">
                                        <span className="font-semibold">Account:</span> {accountName}
                                    </td>
                                    <td className="border px-3 py-2 w-1/4">
                                        <span className="font-semibold">From:</span> {search.from ? format(new Date(search.from), "dd/MM/yyyy") : "N/A"}
                                    </td>
                                    <td className="border px-3 py-2 w-1/4">
                                        <span className="font-semibold">To:</span> {search.to ? format(new Date(search.to), "dd/MM/yyyy") : "N/A"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Transactions Table */}
                        <table className="w-full text-sm mt-4">
                            <thead>
                                <tr className="bg-row-blue">
                                    <th className="border px-3 py-2 text-left w-[100px]">Date</th>
                                    <th className="border px-3 py-2 text-left">Particulars</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Debit ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Credit ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Balance ({currencySymbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    <>
                                        {transactions.map((t: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5">
                                                    {t.date ? format(new Date(t.date), 'dd/MM/yyyy') : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5">{t.narration || "-"}</td>
                                                <td className="border px-3 py-1.5 text-right">
                                                    {t.debit ? (Number(t.debit)).toFixed(2) : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right">
                                                    {t.credit ? (Number(t.credit)).toFixed(2) : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-semibold">
                                                    {(Number(t.balance) || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-row-blue font-bold">
                                            <td className="border px-3 py-2" colSpan={2}>Total</td>
                                            <td className="border px-3 py-2 text-right">{totalDebit.toFixed(2)}</td>
                                            <td className="border px-3 py-2 text-right">{totalCredit.toFixed(2)}</td>
                                            <td className="border px-3 py-2 text-right">{closingBalance.toFixed(2)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td className="border px-3 py-4 text-center text-gray-500" colSpan={5}>No transactions found for the selected period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Closing Balance Summary */}
                        <div className="w-full text-sm mt-4 ml-auto" style={{ maxWidth: "350px" }}>
                            <table className="w-full">
                                <tbody>
                                    <tr>
                                        <td className="px-3 py-1.5 border-b">Opening Balance</td>
                                        <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {openingBalance.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-1.5 border-b">Total Debit</td>
                                        <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {totalDebit.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-1.5 border-b">Total Credit</td>
                                        <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {totalCredit.toFixed(2)}</td>
                                    </tr>
                                    <tr className="font-bold bg-row-blue">
                                        <td className="px-3 py-2 border-b-2 border-black">Closing Balance</td>
                                        <td className="px-3 py-2 border-b-2 border-black text-right">{currencySymbol} {closingBalance.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
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
