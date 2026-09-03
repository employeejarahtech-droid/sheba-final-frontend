import { format } from 'date-fns';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft, Printer } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { useGetCashFlowQuery } from '@/features/accounting/accountingQueries';
import { useCurrency } from '@/hooks/use-currency';
import { getCookie } from '@/lib/cookies';

const API_URL = import.meta.env.VITE_API_URL || '';

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

type CashFlowSection = { title: string; color: string; items: { name: string; amount: number }[]; total: number };

function CashFlowPrintPage() {
    const search = Route.useSearch();

    // No date range = all time — same default as the interactive Cash Flow page.
    const fromStr = search.from || '';
    const toStr = search.to || '';
    const { currencySymbol } = useCurrency();
    const token = getCookie('accessToken');

    const { data: reportData, isLoading } = useGetCashFlowQuery({
        from: fromStr || undefined,
        to: toStr || undefined,
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

    const openingCash = reportData?.opening_cash || 0;
    const closingCash = reportData?.closing_cash || 0;
    const netCashChange = reportData?.net_cash_change || 0;

    const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const sections: CashFlowSection[] = [
        { title: 'Operating Activities', color: '#10B981', items: reportData?.operating?.items || [], total: reportData?.operating?.total || 0 },
        { title: 'Investing Activities', color: '#3B82F6', items: reportData?.investing?.items || [], total: reportData?.investing?.total || 0 },
        { title: 'Financing Activities', color: '#8B5CF6', items: reportData?.financing?.items || [], total: reportData?.financing?.total || 0 },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Loading cash flow data...</span>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <div className="print:hidden flex items-center justify-between gap-4 mb-4">
                    <Link to="/dashboard/accounting/reports/cash-flow" search={{ from: search.from, to: search.to }}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cash Flow
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>

                <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print-report">
                    <style>{`
                        @media print {
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
                            .max-w-4xl {
                                max-width: 100% !important;
                                padding: 1rem !important;
                            }
                            table {
                                width: 100% !important;
                                border-collapse: collapse !important;
                                color: #000 !important;
                                margin-top: 0.4rem !important;
                            }
                            th, td {
                                padding: 3px 6px !important;
                                border: 1px solid #ddd !important;
                                color: #000 !important;
                                font-size: 9px !important;
                            }
                            th {
                                background-color: #f0f9ff !important;
                                color: #000 !important;
                                font-weight: 600 !important;
                            }
                            h1, h2, h3, h4, h5, h6, p, span, div {
                                color: #000 !important;
                            }
                            .text-lg { font-size: 12px !important; }
                            .text-xl { font-size: 14px !important; }
                            .text-sm { font-size: 10px !important; }
                            .text-xs { font-size: 9px !important; }
                            .section { break-inside: avoid; page-break-inside: avoid; }
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
                            <h2 className="text-lg font-bold tracking-widest uppercase">Cash Flow Statement</h2>
                            <p className="text-xs text-gray-600 mt-1">
                                Period: {fromStr ? format(new Date(fromStr), "dd/MM/yyyy") : 'All time'} to {toStr ? format(new Date(toStr), "dd/MM/yyyy") : 'today'}
                            </p>
                            <p className="text-xs mt-1 leading-4">Generated: {now}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 p-2 bg-gray-50 rounded border text-[10px]">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span><span className="text-gray-600">Opening Cash:</span> <span className="font-bold">{currencySymbol} {fmt(openingCash)}</span></span>
                            <span className="mx-1 text-gray-400">|</span>
                            <span><span className="text-gray-600">Net Change:</span> <span className={`font-bold ${netCashChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{currencySymbol} {fmt(netCashChange)}</span></span>
                            <span className="mx-1 text-gray-400">|</span>
                            <span><span className="text-gray-600">Closing Cash:</span> <span className="font-bold">{currencySymbol} {fmt(closingCash)}</span></span>
                        </div>
                    </div>

                    {/* Sections */}
                    {sections.map((section) => (
                        <div key={section.title} className="section mb-4">
                            <div className="px-2 py-1 border-b-2" style={{ borderColor: section.color }}>
                                <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: section.color }}>
                                    {section.title} <span className="text-[10px] font-normal text-gray-500">({section.items.length} account{section.items.length !== 1 ? 's' : ''})</span>
                                </h3>
                            </div>
                            {section.items.length === 0 ? (
                                <p className="text-xs text-gray-400 italic px-2 py-2">No activity in this category.</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th className="text-left">Account</th>
                                            <th className="text-right w-28">Amount ({currencySymbol})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.name}</td>
                                                <td className={`text-right font-mono ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold" style={{ backgroundColor: '#f8fafc' }}>
                                            <td>Net Cash from {section.title.replace(' Activities', '')}</td>
                                            <td className={`text-right font-mono ${section.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(section.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    ))}

                    {/* Reconciliation */}
                    <div className="section mt-4">
                        <div className="px-2 py-1 border-b-2 border-gray-400">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">Reconciliation</h3>
                        </div>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td>Opening Cash Balance</td>
                                    <td className="text-right font-mono font-semibold w-32">{fmt(openingCash)}</td>
                                </tr>
                                {sections.map((section) => (
                                    <tr key={section.title}>
                                        <td className="pl-4">(+) {section.title}</td>
                                        <td className={`text-right font-mono font-semibold ${section.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(section.total)}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold" style={{ backgroundColor: '#f8fafc' }}>
                                    <td>Net Cash Change</td>
                                    <td className={`text-right font-mono ${netCashChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(netCashChange)}</td>
                                </tr>
                                <tr className="font-bold">
                                    <td>Closing Cash Balance</td>
                                    <td className="text-right font-mono">{fmt(closingCash)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-3 pt-2 border-t text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div><strong>Report Type:</strong> Cash Flow Statement</div>
                            <div className="text-right"><strong>Generated:</strong> {now}</div>
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
