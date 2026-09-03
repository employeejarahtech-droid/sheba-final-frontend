import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft, Printer, Receipt, Scale, TrendingUp, TrendingDown } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetDailySummaryQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';
import { getCookie } from '@/lib/cookies';

const API_URL = import.meta.env.VITE_API_URL || '';

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
    const token = getCookie('accessToken');

    const { data: summaryData, isLoading } = useGetDailySummaryQuery({
        date: selectedDate,
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
                                /* Nested "Head / Debit / Credit" mini-table inside the Accounts
                                   cell stays compact and borderless — it isn't a second report
                                   table, just a breakdown within one outer cell. */
                                .inner-accounts-table th,
                                .inner-accounts-table td {
                                    border: none !important;
                                    padding: 1px 4px 1px 0 !important;
                                    background: transparent !important;
                                    font-size: 9px !important;
                                    font-weight: normal !important;
                                }
                                .inner-accounts-table th {
                                    font-weight: 600 !important;
                                }
                                h1, h2, h3, h4, h5, h6, p, span, div {
                                    color: #000 !important;
                                }
                                .text-2xl { font-size: 16px !important; }
                                .text-xl { font-size: 14px !important; }
                                .text-lg { font-size: 12px !important; }
                                .text-sm { font-size: 10px !important; }
                                .text-xs { font-size: 9px !important; }
                            }
                        `}</style>

                        {/* Header: Logo/Company (left) + Report Title (right) */}
                        <div className="mb-2 flex items-start justify-between gap-6">
                            <div className="w-1/2 flex items-center gap-4">
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt="Company Logo"
                                        className="w-20 h-20 object-contain"
                                    />
                                ) : null}
                                <div>
                                    <h1 className="text-xl font-bold">{companyName}</h1>
                                    <p className="text-xs mt-1 leading-4">{companyAddress}</p>
                                </div>
                            </div>

                            <div className="w-1/2 text-right">
                                <h2 className="text-lg font-bold tracking-widest uppercase">Daily Summary Report</h2>
                                <p className="text-xs text-gray-600 mt-1">Opening balance, today's transactions, and closing balance</p>
                                <p className="text-xs mt-1 leading-4">Date: {format(new Date(selectedDate), "dd/MM/yyyy")}</p>
                                <p className="text-xs leading-4">Generated: {now}</p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="border border-blue-300 bg-blue-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase flex items-center justify-center gap-1">
                                    <Scale className="w-3 h-3" /> Opening Balance
                                </div>
                                <div className="text-xl font-bold text-blue-700 mt-1">{openingBalance.toFixed(2)}</div>
                            </div>
                            <div className="border border-emerald-300 bg-emerald-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Today's Debit</div>
                                <div className="text-xl font-bold text-emerald-700 mt-1">{todayDebit.toFixed(2)}</div>
                            </div>
                            <div className="border border-red-300 bg-red-50 p-3 text-center">
                                <div className="text-xs text-gray-600 uppercase">Today's Credit</div>
                                <div className="text-xl font-bold text-red-700 mt-1">{todayCredit.toFixed(2)}</div>
                            </div>
                            <div className={`border p-3 text-center ${closingBalance >= 0 ? 'border-violet-300 bg-violet-50' : 'border-red-300 bg-red-50'}`}>
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
                        <div className="border border-gray-300 bg-gray-50 mb-6 p-4">
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
                        <div className="border border-gray-300">
                            <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                                <h2 className="font-bold text-blue-700 flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Today's Transactions
                                </h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-row-blue">
                                        <th className="border px-3 py-2 text-left w-[60px]">ID</th>
                                        <th className="border px-3 py-2 text-left">Narration / Type</th>
                                        <th className="border px-3 py-2 text-left">Accounts ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx: any) => {
                                        const badge = refTypeBadge[tx.reference_type] || { label: tx.reference_type || '-' };
                                        return (
                                            <tr key={tx.journal_id} className="bg-gray-50">
                                                <td className="border px-3 py-1.5 font-mono text-xs">#{tx.journal_id}</td>
                                                <td className="border px-3 py-1.5">
                                                    <div className="font-medium">{tx.narration || "-"}</div>
                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="border px-3 py-1.5 text-xs">
                                                    <table className="inner-accounts-table w-full text-[10px] border-collapse">
                                                        <thead>
                                                            <tr className="text-gray-500">
                                                                <th className="text-left font-medium pb-0.5">Head</th>
                                                                <th className="text-right font-medium pb-0.5 w-16">Debit</th>
                                                                <th className="text-right font-medium pb-0.5 w-16">Credit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tx.entries.map((e: any, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="pr-2 py-0.5">
                                                                        <span className="font-mono text-gray-500">{e.account_code}</span>{' '}
                                                                        <span>{e.account_name}</span>
                                                                    </td>
                                                                    <td className="text-right py-0.5 text-emerald-600">{e.debit > 0 ? e.debit.toFixed(2) : '-'}</td>
                                                                    <td className="text-right py-0.5 text-red-600">{e.credit > 0 ? e.credit.toFixed(2) : '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="border px-3 py-2 text-right" colSpan={2}>Total</td>
                                        <td className="border px-3 py-2 text-right font-mono">
                                            <span className="text-emerald-600">Dr {todayDebit.toFixed(2)}</span>
                                            {' / '}
                                            <span className="text-red-600">Cr {todayCredit.toFixed(2)}</span>
                                        </td>
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