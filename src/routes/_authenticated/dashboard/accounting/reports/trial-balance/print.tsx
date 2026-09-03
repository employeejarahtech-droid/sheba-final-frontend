import { useState } from 'react';
import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetTrialBalanceQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';
import { getCookie } from '@/lib/cookies';

const API_URL = import.meta.env.VITE_API_URL || '';

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
    const token = getCookie('accessToken');

    const { data: reportData, isLoading } = useGetTrialBalanceQuery({
        date: dateStr
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

    // Only print accounts with an actual (non-zero) debit or credit amount —
    // zero-balance heads add noise without adding information. Totals still
    // come from the API's full-set sums, so they stay correct either way.
    const trialBalanceData = (reportData?.trial_balance || []).filter(
        (a: any) => Number(a.debit) > 0 || Number(a.credit) > 0
    );
    const totalDebit = reportData?.total_debit || 0;
    const totalCredit = reportData?.total_credit || 0;
    const status = reportData?.status || "UNBALANCED";
    const isBalanced = status === "BALANCED";

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Trial Balance
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
                        className="max-w-6xl w-full mx-auto bg-background pb-10 px-5 mt-6 print-report"
                        style={{ paddingTop: `${paddingTop}px` }}
                    >
                        <style>{`
                            .bg-row-blue { background-color: #cfd2d8ff !important; }
                            @media print {
                                /* Portrait, not landscape: this report is only 5 narrow
                                   columns (Code/Account/Type/Debit/Credit) but can have many
                                   rows — portrait's taller page fits more rows per sheet,
                                   where landscape would just waste width and force more
                                   page breaks. */
                                @page {
                                    size: A4 portrait;
                                    margin: 12mm;
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
                                <h2 className="text-lg font-bold tracking-widest uppercase">Trial Balance Report</h2>
                                <p className="text-xs text-gray-600 mt-1">As of {search.date ? format(new Date(search.date), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</p>
                                <p className="text-xs mt-1 leading-4">Generated: {now}</p>
                            </div>
                        </div>

                        {/* Header Info */}
                        <div className="flex items-center justify-between mb-6 text-xs">
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
                        <table className="w-full text-xs">
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
                                                <td className="border px-3 py-1.5 text-right font-mono text-xs">
                                                    {account.debit > 0 ? Number(account.debit).toFixed(2) : '-'}
                                                </td>
                                                <td className="border px-3 py-1.5 text-right font-mono text-xs">
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
                            <div className="w-full text-xs mt-6 ml-auto" style={{ maxWidth: "400px" }}>
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
                )}
            </Main>
        </>
    );
}