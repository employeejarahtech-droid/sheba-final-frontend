import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ArrowLeft, Printer, TrendingUp, TrendingDown } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetProfitLossQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';

const printSearchSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/reports/profit-and-loss/print',
)({
    validateSearch: (search) => printSearchSchema.parse(search),
    component: ProfitAndLossPrintPage,
});

function ProfitAndLossPrintPage() {
    const search = Route.useSearch();
    const [paddingTop, setPaddingTop] = useState(32);
    const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5);

    const fromDateStr = search.from || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const toDateStr = search.to || format(new Date(), 'yyyy-MM-dd');
    const { currencySymbol } = useCurrency();

    const { data: reportData, isLoading } = useGetProfitLossQuery({
        from: fromDateStr,
        to: toDateStr,
    });

    const income = reportData?.income || [];
    const expense = reportData?.expense || [];
    const totalIncome = reportData?.total_income || 0;
    const totalExpense = reportData?.total_expense || 0;
    const netProfit = reportData?.net_profit || 0;

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/profit-and-loss" search={{ from: search.from, to: search.to }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profit & Loss
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
                                    .section-header { background-color: #f8fafc !important; }
                                }
                            `}
                        </style>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-center underline mb-2 tracking-wide">
                            PROFIT & LOSS STATEMENT
                        </h1>
                        <div className="text-center text-sm text-gray-600 mb-6">
                            Period: {format(new Date(fromDateStr), "dd/MM/yyyy")} to {format(new Date(toDateStr), "dd/MM/yyyy")}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* INCOME SECTION */}
                            <div className="border-2 border-emerald-300">
                                <div className="bg-emerald-50 px-4 py-2 border-b-2 border-emerald-200">
                                    <h2 className="font-bold text-emerald-700 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> INCOME
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
                                        {income.map((account: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5">{account.name}</td>
                                                <td className="border px-3 py-1.5 text-right font-mono">
                                                    {Number(account.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-emerald-50 font-bold">
                                            <td className="border px-3 py-2">Total Income</td>
                                            <td className="border px-3 py-2 text-right">{totalIncome.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* EXPENSE SECTION */}
                            <div className="border-2 border-red-300">
                                <div className="bg-red-50 px-4 py-2 border-b-2 border-red-200">
                                    <h2 className="font-bold text-red-700 flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4" /> EXPENSE
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
                                        {expense.map((account: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="border px-3 py-1.5">{account.name}</td>
                                                <td className="border px-3 py-1.5 text-right font-mono">
                                                    {Number(account.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-red-50 font-bold">
                                            <td className="border px-3 py-2">Total Expense</td>
                                            <td className="border px-3 py-2 text-right">{totalExpense.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NET PROFIT/LOSS SUMMARY */}
                        <div className={`mt-8 border-2 p-8 text-center ${netProfit >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
                            <h3 className={`text-xl font-bold uppercase tracking-widest mb-4 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                            </h3>
                            <div className={`text-6xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {netProfit >= 0 ? '+' : '-'}{Math.abs(netProfit).toFixed(2)}
                            </div>
                            <div className="mt-6 text-sm text-gray-600">
                                <div className="flex justify-center gap-8 font-mono">
                                    <div>
                                        <span className="text-emerald-600 font-bold">Income:</span> {totalIncome.toFixed(2)}
                                    </div>
                                    <div className="text-gray-400">vs</div>
                                    <div>
                                        <span className="text-red-600 font-bold">Expense:</span> {totalExpense.toFixed(2)}
                                    </div>
                                </div>
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