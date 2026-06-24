import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer, Wallet, TrendingUp, ArrowRightLeft } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetCashFlowQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/cash-flow/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: CashFlowPrintPage,
});

function CashFlowPrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromStr = search.from || format(firstDayOfMonth, "yyyy-MM-dd");
    const toStr = search.to || format(today, "yyyy-MM-dd");
    const { currencySymbol } = useCurrency();

    const { data: reportData, isLoading } = useGetCashFlowQuery({
        from: fromStr,
        to: toStr,
    });

    const operating = reportData?.operating || { items: [], total: 0 };
    const investing = reportData?.investing || { items: [], total: 0 };
    const financing = reportData?.financing || { items: [], total: 0 };
    const openingCash = reportData?.opening_cash || 0;
    const closingCash = reportData?.closing_cash || 0;
    const netCashChange = reportData?.net_cash_change || 0;

    const fmt = (n: number) => Number(n).toFixed(2);

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/cash-flow" search={{ from: search.from, to: search.to }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cash Flow
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
                            CASH FLOW STATEMENT
                        </h1>
                        <div className="text-center text-sm text-gray-600 mb-6">
                            Period: {format(new Date(fromStr), "dd/MM/yyyy")} to {format(new Date(toStr), "dd/MM/yyyy")}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="border-2 border-slate-300 bg-slate-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Opening Cash</div>
                                <div className="text-xl font-bold text-slate-700">{fmt(openingCash)}</div>
                            </div>
                            <div className="border-2 border-emerald-300 bg-emerald-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Operating</div>
                                <div className={`text-xl font-bold ${operating.total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {fmt(operating.total)}
                                </div>
                            </div>
                            <div className="border-2 border-blue-300 bg-blue-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Net Change</div>
                                <div className={`text-xl font-bold ${netCashChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {fmt(netCashChange)}
                                </div>
                            </div>
                            <div className="border-2 border-violet-300 bg-violet-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Closing Cash</div>
                                <div className="text-xl font-bold text-violet-700">{fmt(closingCash)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Operating Activities */}
                            <div className="border-2 border-emerald-300">
                                <div className="bg-emerald-50 px-4 py-2 border-b-2 border-emerald-200">
                                    <h2 className="font-bold text-emerald-700 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Operating Activities
                                    </h2>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-row-blue">
                                            <th className="border px-3 py-2 text-left">Account</th>
                                            <th className="border px-3 py-2 text-right w-[120px]">Amount ({currencySymbol})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {operating.items.map((item: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5">{item.name}</td>
                                                <td className={`border px-3 py-1.5 text-right font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {fmt(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-emerald-50 font-bold">
                                            <td className="border px-3 py-2">Net Cash from Operations</td>
                                            <td className={`border px-3 py-2 text-right ${operating.total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                {fmt(operating.total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Investing Activities */}
                            <div className="border-2 border-blue-300">
                                <div className="bg-blue-50 px-4 py-2 border-b-2 border-blue-200">
                                    <h2 className="font-bold text-blue-700 flex items-center gap-2">
                                        <Wallet className="w-4 h-4" /> Investing Activities
                                    </h2>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-row-blue">
                                            <th className="border px-3 py-2 text-left">Account</th>
                                            <th className="border px-3 py-2 text-right w-[120px]">Amount ({currencySymbol})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {investing.items.map((item: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5">{item.name}</td>
                                                <td className={`border px-3 py-1.5 text-right font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {fmt(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50 font-bold">
                                            <td className="border px-3 py-2">Net Cash from Investing</td>
                                            <td className={`border px-3 py-2 text-right ${investing.total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                {fmt(investing.total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financing Activities */}
                        <div className="mt-6 border-2 border-purple-300">
                            <div className="bg-purple-50 px-4 py-2 border-b-2 border-purple-200">
                                <h2 className="font-bold text-purple-700 flex items-center gap-2">
                                    <ArrowRightLeft className="w-4 h-4" /> Financing Activities
                                </h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-row-blue">
                                        <th className="border px-3 py-2 text-left">Account</th>
                                        <th className="border px-3 py-2 text-right w-[120px]">Amount ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financing.items.map((item: any, idx: number) => (
                                        <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                            <td className="border px-3 py-1.5">{item.name}</td>
                                            <td className={`border px-3 py-1.5 text-right font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {fmt(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-purple-50 font-bold">
                                        <td className="border px-3 py-2">Net Cash from Financing</td>
                                        <td className={`border px-3 py-2 text-right ${financing.total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {fmt(financing.total)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Cash Flow Summary */}
                        <div className="mt-6 border-2 border-gray-300">
                            <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-300">
                                <h2 className="font-bold text-gray-700 text-center">CASH FLOW SUMMARY</h2>
                            </div>
                            <div className="px-4 py-4">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr>
                                            <td className="px-3 py-2 border-b">Opening Cash Balance</td>
                                            <td className="px-3 py-2 border-b text-right font-semibold">{fmt(openingCash)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b pl-6">(+) Operating Activities</td>
                                            <td className={`px-3 py-2 border-b text-right font-semibold ${operating.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {fmt(operating.total)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b pl-6">(+) Investing Activities</td>
                                            <td className={`px-3 py-2 border-b text-right font-semibold ${investing.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {fmt(investing.total)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 border-b pl-6">(+) Financing Activities</td>
                                            <td className={`px-3 py-2 border-b text-right font-semibold ${financing.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {fmt(financing.total)}
                                            </td>
                                        </tr>
                                        <tr className="font-bold bg-gray-50">
                                            <td className="px-3 py-2 border-b-2">Net Cash Change</td>
                                            <td className={`px-3 py-2 border-b-2 text-right ${netCashChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {fmt(netCashChange)}
                                            </td>
                                        </tr>
                                        <tr className="font-bold text-lg">
                                            <td className="px-3 py-2 text-violet-700">Closing Cash Balance</td>
                                            <td className="px-3 py-2 text-right text-violet-700 font-mono">{fmt(closingCash)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
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