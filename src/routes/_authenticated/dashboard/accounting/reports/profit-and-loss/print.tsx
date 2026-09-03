import { format, startOfMonth } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft, Printer, TrendingUp, TrendingDown } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetProfitLossQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';
import { getCookie } from '@/lib/cookies';

const API_URL = import.meta.env.VITE_API_URL || '';

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
    const token = getCookie('accessToken')

    const fromDateStr = search.from || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const toDateStr = search.to || format(new Date(), 'yyyy-MM-dd');
    const { currencySymbol } = useCurrency();

    const { data: reportData, isLoading } = useGetProfitLossQuery({
        from: fromDateStr,
        to: toDateStr,
    });

    // Fetch company settings for company name, address and logo
    const { data: companySettings } = useQuery({
        queryKey: ["company-settings"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch company settings");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token,
    })

    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null;
    const companyName = companySettings?.company_name || 'Sheba Hospital';
    const companyAddress = [companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'
    const now = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    const income = reportData?.income || [];
    const expense = reportData?.expense || [];
    const totalIncome = reportData?.total_income || 0;
    const totalExpense = reportData?.total_expense || 0;
    const netProfit = reportData?.net_profit || 0;

    const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Loading profit &amp; loss data...</span>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/profit-and-loss" search={{ from: search.from, to: search.to }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profit & Loss
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>

                <div className="max-w-6xl w-full mx-auto bg-background pb-10 px-5 mt-6 print-report">
                    <style>{`
                        .bg-row-blue { background-color: #cfd2d8ff !important; }
                        @media print {
                            @page {
                                size: A4 landscape;
                                margin: 10mm;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #fff !important;
                                color: #000 !important;
                            }
                            .print\\:hidden {
                                display: none !important;
                            }
                            .max-w-6xl {
                                max-width: 100% !important;
                                padding: 1rem !important;
                            }
                            table {
                                width: 100% !important;
                                border-collapse: collapse !important;
                                color: #000 !important;
                                margin-top: 0.5rem !important;
                            }
                            th, td {
                                padding: 4px 6px !important;
                                border: 1px solid #ddd !important;
                                color: #000 !important;
                                font-size: 10px !important;
                            }
                            th {
                                background-color: #f0f9ff !important;
                                color: #000 !important;
                                font-weight: 600 !important;
                            }
                            .bg-row-blue {
                                background-color: #cfd2d8ff !important;
                            }
                            h1, h2, h3, h4, h5, h6, p, span, div {
                                color: #000 !important;
                            }
                            .text-2xl { font-size: 16px !important; }
                            .text-xl { font-size: 14px !important; }
                            .text-lg { font-size: 12px !important; }
                            .text-sm { font-size: 10px !important; }
                            .text-xs { font-size: 9px !important; }
                            /* The global print stylesheet forces every .grid into a
                               flex-wrap layout with children capped at max-width: 25%
                               (built for a 4-card stat row elsewhere). That clobbers
                               this page's 2-column Income/Expense layout, squashing
                               each side down to a quarter-width column instead of half.
                               Restore real CSS grid, scoped to this page. */
                            .grid {
                                display: grid !important;
                            }
                            .grid-cols-2 {
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                            }
                            .grid > * {
                                flex: none !important;
                                min-width: 0 !important;
                                max-width: none !important;
                            }
                        }
                    `}</style>

                    {/* Header: Logo/Company (left) + Report Title (right) */}
                    <div className="mb-2 flex items-start justify-between gap-6">
                        <div className="w-1/2 flex items-center gap-4">
                            {companyLogo ? (
                                <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
                            ) : null}
                            <div>
                                <h1 className="text-xl font-bold">{companyName}</h1>
                                <p className="text-xs mt-1 leading-4">{companyAddress}</p>
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            <h2 className="text-lg font-bold tracking-widest uppercase">Profit &amp; Loss Statement</h2>
                            <p className="text-xs text-gray-600 mt-1">Period: {format(new Date(fromDateStr), "dd/MM/yyyy")} to {format(new Date(toDateStr), "dd/MM/yyyy")}</p>
                            <p className="text-xs mt-1 leading-4">Generated: {now}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 p-2 bg-gray-50 rounded border text-[10px]">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span><span className="text-gray-600">Total Income:</span> <span className="font-bold text-emerald-600">{currencySymbol} {fmt(totalIncome)}</span></span>
                            <span className="mx-1 text-gray-400">|</span>
                            <span><span className="text-gray-600">Total Expense:</span> <span className="font-bold text-red-600">{currencySymbol} {fmt(totalExpense)}</span></span>
                            <span className="mx-1 text-gray-400">|</span>
                            <span><span className="text-gray-600">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}:</span> <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{currencySymbol} {fmt(Math.abs(netProfit))}</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* INCOME SECTION */}
                        <div className="border border-emerald-300">
                            <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200">
                                <h2 className="font-bold text-emerald-700 flex items-center gap-2 text-sm">
                                    <TrendingUp className="w-4 h-4" /> Income
                                </h2>
                            </div>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-row-blue">
                                        <th className="border px-3 py-2 text-left">Account</th>
                                        <th className="border px-3 py-2 text-right w-[120px]">Amount ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {income.length === 0 ? (
                                        <tr><td className="border px-3 py-4 text-center text-gray-500" colSpan={2}>No income recorded for this period.</td></tr>
                                    ) : income.map((account: any, idx: number) => (
                                        <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                            <td className="border px-3 py-1.5">{account.name}</td>
                                            <td className="border px-3 py-1.5 text-right font-mono">{fmt(account.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-emerald-50 font-bold">
                                        <td className="border px-3 py-2">Total Income</td>
                                        <td className="border px-3 py-2 text-right">{fmt(totalIncome)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* EXPENSE SECTION */}
                        <div className="border border-red-300">
                            <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                                <h2 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                                    <TrendingDown className="w-4 h-4" /> Expense
                                </h2>
                            </div>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-row-blue">
                                        <th className="border px-3 py-2 text-left">Account</th>
                                        <th className="border px-3 py-2 text-right w-[120px]">Amount ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expense.length === 0 ? (
                                        <tr><td className="border px-3 py-4 text-center text-gray-500" colSpan={2}>No expenses recorded for this period.</td></tr>
                                    ) : expense.map((account: any, idx: number) => (
                                        <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                                            <td className="border px-3 py-1.5">{account.name}</td>
                                            <td className="border px-3 py-1.5 text-right font-mono">{fmt(account.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-red-50 font-bold">
                                        <td className="border px-3 py-2">Total Expense</td>
                                        <td className="border px-3 py-2 text-right">{fmt(totalExpense)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* NET PROFIT/LOSS SUMMARY */}
                    <div className={`mt-6 border p-6 text-center ${netProfit >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
                        <h3 className={`text-lg font-bold uppercase tracking-widest mb-2 ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                        </h3>
                        <div className={`text-3xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {netProfit >= 0 ? '+' : '-'}{currencySymbol} {fmt(Math.abs(netProfit))}
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                            <div className="flex justify-center gap-6 font-mono">
                                <div><span className="text-emerald-600 font-bold">Income:</span> {currencySymbol} {fmt(totalIncome)}</div>
                                <div className="text-gray-400">vs</div>
                                <div><span className="text-red-600 font-bold">Expense:</span> {currencySymbol} {fmt(totalExpense)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Signature Row */}
                    <div className="flex justify-between items-end mt-6 text-xs">
                        <div className="text-left">
                            <p className="border-t border-dashed w-40 pt-1">Prepared By:</p>
                        </div>
                        <div className="text-right">
                            <p className="border-t border-dashed w-48 pt-1">Authorized Signature:</p>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    );
}
