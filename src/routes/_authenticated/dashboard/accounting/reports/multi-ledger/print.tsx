import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useMultiLedgerReport } from '@/features/accounting/api/queries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    account_ids: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/multi-ledger/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: MultiLedgerPrintPage,
});

function MultiLedgerPrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const accountIds = search.account_ids.split(',').map(Number).filter(n => !isNaN(n));

    const { data: reportData, isLoading } = useMultiLedgerReport({
        account_ids: accountIds,
        from: search.from,
        to: search.to,
    });
    const { currencySymbol } = useCurrency();

    const visibleAccounts = (reportData?.accounts || []).filter((a: any) => {
        const txns = a.transactions || [];
        const dr = txns.reduce((s: number, t: any) => s + (t.debit || 0), 0);
        const cr = txns.reduce((s: number, t: any) => s + (t.credit || 0), 0);
        const opening = Math.abs(a.opening_balance || 0);
        const closing = Math.abs(a.closing_balance || 0);
        return opening > 0 || dr > 0 || cr > 0 || closing > 0;
    });

    const filteredGrand = {
        total_opening: visibleAccounts.reduce((s: number, a: any) => s + (a.opening_balance || 0), 0),
        total_debit: visibleAccounts.reduce((s: number, a: any) => {
            const txns = a.transactions || [];
            return s + txns.reduce((ss: number, t: any) => ss + (t.debit || 0), 0);
        }, 0),
        total_credit: visibleAccounts.reduce((s: number, a: any) => {
            const txns = a.transactions || [];
            return s + txns.reduce((ss: number, t: any) => ss + (t.credit || 0), 0);
        }, 0),
        total_closing: visibleAccounts.reduce((s: number, a: any) => s + (a.closing_balance || 0), 0),
    };

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/reports/multi-ledger" search={{ account_ids: search.account_ids, from: search.from, to: search.to }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Multi-Ledger
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
                        <h1 className="text-2xl font-bold text-center underline mb-2 tracking-wide">
                            MULTI-ACCOUNT LEDGER REPORT
                        </h1>
                        <h2 className="text-center text-lg font-semibold mb-6">
                            {accountIds.length} Account(s) Summary
                        </h2>

                        {/* Header Info */}
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="border px-3 py-2 w-1/3">
                                        <span className="font-semibold">Accounts:</span> {accountIds.length}
                                    </td>
                                    <td className="border px-3 py-2 w-1/3">
                                        <span className="font-semibold">From:</span> {search.from ? format(new Date(search.from), "dd/MM/yyyy") : "N/A"}
                                    </td>
                                    <td className="border px-3 py-2 w-1/3">
                                        <span className="font-semibold">To:</span> {search.to ? format(new Date(search.to), "dd/MM/yyyy") : "N/A"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Summary Table */}
                        <table className="w-full text-sm mt-4">
                            <thead>
                                <tr className="bg-row-blue">
                                    <th className="border px-3 py-2 text-left w-[70px]">Code</th>
                                    <th className="border px-3 py-2 text-left">Account Name</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Opening ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Debit ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Credit ({currencySymbol})</th>
                                    <th className="border px-3 py-2 text-right w-[110px]">Closing ({currencySymbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleAccounts.map((accountLedger: any, idx: number) => {
                                    const txns = accountLedger.transactions || [];
                                    const totalDr = txns.reduce((s: number, t: any) => s + (t.debit || 0), 0);
                                    const totalCr = txns.reduce((s: number, t: any) => s + (t.credit || 0), 0);

                                    return (
                                        <tr key={accountLedger.account.id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                            <td className="border px-3 py-1.5">{accountLedger.account.code}</td>
                                            <td className="border px-3 py-1.5">{accountLedger.account.name}</td>
                                            <td className="border px-3 py-1.5 text-right">{(accountLedger.opening_balance ?? 0).toFixed(2)}</td>
                                            <td className="border px-3 py-1.5 text-right">{totalDr.toFixed(2)}</td>
                                            <td className="border px-3 py-1.5 text-right">{totalCr.toFixed(2)}</td>
                                            <td className="border px-3 py-1.5 text-right font-semibold">{(accountLedger.closing_balance ?? 0).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                                {visibleAccounts.length > 0 && (
                                    <tr className="bg-row-blue font-bold">
                                        <td className="border px-3 py-2" colSpan={2}>Grand Total</td>
                                        <td className="border px-3 py-2 text-right">{filteredGrand.total_opening.toFixed(2)}</td>
                                        <td className="border px-3 py-2 text-right">{filteredGrand.total_debit.toFixed(2)}</td>
                                        <td className="border px-3 py-2 text-right">{filteredGrand.total_credit.toFixed(2)}</td>
                                        <td className="border px-3 py-2 text-right">{filteredGrand.total_closing.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Grand Closing Balance Summary */}
                        {visibleAccounts.length > 0 && (
                            <div className="w-full text-sm mt-4 ml-auto" style={{ maxWidth: "350px" }}>
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="px-3 py-1.5 border-b">Total Opening Balance</td>
                                            <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {filteredGrand.total_opening.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-1.5 border-b">Total Debit</td>
                                            <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {filteredGrand.total_debit.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-1.5 border-b">Total Credit</td>
                                            <td className="px-3 py-1.5 border-b text-right font-semibold">{currencySymbol} {filteredGrand.total_credit.toFixed(2)}</td>
                                        </tr>
                                        <tr className="font-bold bg-row-blue">
                                            <td className="px-3 py-2 border-b-2 border-black">Total Closing Balance</td>
                                            <td className="px-3 py-2 border-b-2 border-black text-right">{currencySymbol} {filteredGrand.total_closing.toFixed(2)}</td>
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
