"use client";

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/cookies';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Banknote, Clock, XCircle, Landmark, CreditCard, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useCurrency } from '@/hooks/use-currency';
import { cn } from "@/lib/utils";

type PayrollRecord = {
    id: number;
    staff_id: number;
    staff?: { id: number; name: string; email: string };
    month: string;
    year: number;
    net_salary: number | string;
    status: 'pending' | 'paid' | 'cancelled';
    payment_date?: string | null;
    payment_method?: 'bank_transfer' | 'cash' | 'cheque' | null;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const METHOD_LABEL: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
};

const METHOD_ICON: Record<string, any> = {
    bank_transfer: Landmark,
    cash: Banknote,
    cheque: FileText,
};

function ReconciliationPage() {
    const token = getCookie('accessToken');
    const { format } = useCurrency();

    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const fetchPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
            const url = `${import.meta.env.VITE_API_URL}/api/payroll?${params.toString()}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch payroll records');
            const result = await res.json();
            setPayrolls(result.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Error loading reconciliation data');
        } finally {
            setLoading(false);
        }
    }, [token, selectedMonth, selectedYear]);

    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    const staffName = (p: PayrollRecord) => p.staff?.name || `Staff #${p.staff_id}`;
    const amountOf = (p: PayrollRecord) => Number(p.net_salary) || 0;

    const paid = payrolls.filter(p => p.status === 'paid');
    const pending = payrolls.filter(p => p.status === 'pending');
    const cancelled = payrolls.filter(p => p.status === 'cancelled');

    const totalExpected = payrolls.reduce((s, p) => s + amountOf(p), 0);
    const totalPaid = paid.reduce((s, p) => s + amountOf(p), 0);
    const totalPending = pending.reduce((s, p) => s + amountOf(p), 0);
    const totalCancelled = cancelled.reduce((s, p) => s + amountOf(p), 0);

    // Balance check: every payroll for the period must be exactly one of
    // paid/pending/cancelled, so their amounts must sum back to the total.
    const isBalanced = Math.abs(totalExpected - (totalPaid + totalPending + totalCancelled)) < 0.01;

    const methodTotals = (['bank_transfer', 'cash', 'cheque'] as const).map((method) => ({
        method,
        label: METHOD_LABEL[method],
        icon: METHOD_ICON[method],
        total: paid.filter(p => p.payment_method === method).reduce((s, p) => s + amountOf(p), 0),
        count: paid.filter(p => p.payment_method === method).length,
    }));

    // Data-quality flags: a payroll marked "paid" should always have a
    // payment_date and payment_method recorded — anything missing either is
    // a genuine reconciliation discrepancy (paid with no evidence of how/when).
    const flaggedPaid = paid.filter(p => !p.payment_date || !p.payment_method);

    const statCards = [
        { label: 'Total Payroll', value: format(totalExpected), icon: Scale, grad: 'from-blue-500 to-indigo-500' },
        { label: 'Paid', value: format(totalPaid), icon: CheckCircle2, grad: 'from-emerald-500 to-teal-500' },
        { label: 'Pending', value: format(totalPending), icon: Clock, grad: 'from-amber-500 to-orange-500' },
        { label: 'Cancelled', value: format(totalCancelled), icon: XCircle, grad: 'from-rose-500 to-red-500' },
    ];

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="space-y-3">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Reconciliation</h1>
                        <p className="text-sm text-muted-foreground">Verify recorded payroll payments balance against what's expected</p>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading reconciliation data…</p>
                        </div>
                    ) : payrolls.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No payroll records found for {selectedMonth} {selectedYear}</p>
                        </div>
                    ) : (
                        <>
                            {/* Balance banner */}
                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border text-sm font-medium",
                                isBalanced
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400"
                                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
                            )}>
                                {isBalanced ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                {isBalanced
                                    ? `Balanced — Paid + Pending + Cancelled matches Total Payroll for ${selectedMonth} ${selectedYear}`
                                    : `Out of balance — Paid + Pending + Cancelled (${format(totalPaid + totalPending + totalCancelled)}) does not match Total Payroll (${format(totalExpected)})`}
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {statCards.map((card) => {
                                    const Icon = card.icon;
                                    return (
                                        <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-2 bg-gradient-to-br ${card.grad} rounded-lg shadow-lg`}>
                                                        <Icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <h3 className="text-2xl font-bold">{card.value}</h3>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Payment Method Breakdown */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                            <CreditCard className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Paid Amount by Method</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Should sum to the total Paid amount above</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {methodTotals.map(({ method, label, icon: Icon, total, count }) => (
                                            <div key={method} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground">{label} ({count})</div>
                                                    <div className="font-bold">{format(total)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Discrepancies */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 bg-gradient-to-br ${flaggedPaid.length > 0 ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500'} rounded-lg shadow-lg`}>
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Discrepancies ({flaggedPaid.length})</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Payrolls marked paid but missing a payment date or method</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {flaggedPaid.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-gray-500">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                            No discrepancies found — every paid record has a date and method on file
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Staff</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Period</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Net Salary</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Issue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {flaggedPaid.map((p) => (
                                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">{staffName(p)}</div>
                                                                <div className="text-xs text-gray-500">{p.staff?.email || ''}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">{p.month} {p.year}</td>
                                                            <td className="px-4 py-3 text-right font-medium">{format(amountOf(p))}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex gap-1.5 flex-wrap">
                                                                    {!p.payment_date && <Badge variant="outline" className="text-amber-600 border-amber-300">No payment date</Badge>}
                                                                    {!p.payment_method && <Badge variant="outline" className="text-amber-600 border-amber-300">No payment method</Badge>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/finance/reconciliation/')({
    component: ReconciliationPage,
});
