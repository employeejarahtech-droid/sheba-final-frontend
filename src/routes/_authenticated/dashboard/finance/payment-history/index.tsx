"use client";

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/cookies';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, FileText, Banknote, CreditCard, Landmark, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useCurrency } from '@/hooks/use-currency';
import { useDateFormat } from '@/hooks/use-date-format';
import { cn } from "@/lib/utils";

type PaidPayroll = {
    id: number;
    staff_id: number;
    staff?: { id: number; name: string; email: string; position?: string };
    month: string;
    year: number;
    net_salary: number | string;
    status: 'pending' | 'paid' | 'cancelled';
    payment_date?: string | null;
    payment_method?: 'bank_transfer' | 'cash' | 'cheque' | null;
    notes?: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const METHOD_ICON: Record<string, any> = {
    bank_transfer: Landmark,
    cash: Banknote,
    cheque: FileText,
};

const METHOD_LABEL: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
};

function PaymentHistoryPage() {
    const token = getCookie('accessToken');
    const { format } = useCurrency();
    const { formatDate } = useDateFormat();

    const [payrolls, setPayrolls] = useState<PaidPayroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedMethod, setSelectedMethod] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const fetchPaidPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ status: 'paid' });
            if (selectedMonth !== "all") params.append('month', selectedMonth);
            if (selectedYear !== "all") params.append('year', selectedYear);

            const url = `${import.meta.env.VITE_API_URL}/api/payroll?${params.toString()}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch payment history');
            const result = await res.json();
            setPayrolls(result.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Error loading payment history');
        } finally {
            setLoading(false);
        }
    }, [token, selectedMonth, selectedYear]);

    useEffect(() => {
        fetchPaidPayrolls();
    }, [fetchPaidPayrolls]);

    const staffName = (p: PaidPayroll) => p.staff?.name || `Staff #${p.staff_id}`;

    const filteredPayrolls = payrolls
        .filter((p) => selectedMethod === "all" || p.payment_method === selectedMethod)
        .filter((p) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return staffName(p).toLowerCase().includes(q) || (p.staff?.email || '').toLowerCase().includes(q);
        })
        // Most recently paid first.
        .sort((a, b) => new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime());

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMonth, selectedYear, selectedMethod]);

    const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
    const paginatedPayrolls = filteredPayrolls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalPaid = filteredPayrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
    const thisMonthCount = filteredPayrolls.filter((p) => {
        if (!p.payment_date) return false;
        const d = new Date(p.payment_date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const bankTransferCount = filteredPayrolls.filter((p) => p.payment_method === 'bank_transfer').length;

    const handleViewSlip = async (payroll: PaidPayroll) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${payroll.id}/payslip`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to generate payslip');
            const html = await res.text();
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (!win) toast.error('Popup blocked — please allow popups to view the payslip');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err: any) {
            toast.error(err.message || 'Error generating payslip');
        }
    };

    const statCards = [
        { label: "Total Payments", value: String(filteredPayrolls.length), icon: Receipt, grad: "from-blue-500 to-indigo-500" },
        { label: "Total Paid", value: format(totalPaid), icon: Banknote, grad: "from-emerald-500 to-teal-500" },
        { label: "Paid This Month", value: String(thisMonthCount), icon: CreditCard, grad: "from-purple-500 to-indigo-500" },
        { label: "Via Bank Transfer", value: String(bankTransferCount), icon: Landmark, grad: "from-orange-500 to-amber-500" },
    ];

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="space-y-3">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment History</h1>
                        <p className="text-sm text-muted-foreground">Record of all completed payroll payments</p>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by staff name or email…"
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="All Months" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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

                    {/* Payment History Table */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Receipt className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Payments ({filteredPayrolls.length})</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Completed payroll payments, most recent first</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading payment history…</p>
                                </div>
                            ) : filteredPayrolls.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">No completed payments found</p>
                                    <p className="text-sm text-gray-400">Try adjusting your filters, or process a pending payment first</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-white/[0.03] border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Period</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Net Salary</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Payment Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Method</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {paginatedPayrolls.map((payroll) => {
                                                const MethodIcon = payroll.payment_method ? METHOD_ICON[payroll.payment_method] : null;
                                                return (
                                                    <tr key={payroll.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900 dark:text-gray-100">{staffName(payroll)}</div>
                                                            <div className="text-xs text-gray-500">{payroll.staff?.email || ''}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-medium">{payroll.month}</div>
                                                            <div className="text-xs text-gray-500">{payroll.year}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                                                            {format(Number(payroll.net_salary) || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {payroll.payment_date ? formatDate(new Date(payroll.payment_date)) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {payroll.payment_method ? (
                                                                <Badge variant="outline" className="gap-1.5 font-normal">
                                                                    {MethodIcon && <MethodIcon className="w-3 h-3" />}
                                                                    {METHOD_LABEL[payroll.payment_method] || payroll.payment_method}
                                                                </Badge>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button size="sm" variant="ghost" onClick={() => handleViewSlip(payroll)} title="View payslip">
                                                                <FileText className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Pagination Controls */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 gap-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {filteredPayrolls.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredPayrolls.length)} of {filteredPayrolls.length} entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                            </Button>
                                            <div className="text-sm font-medium px-2">
                                                Page {currentPage} of {Math.max(totalPages, 1)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage >= totalPages}
                                            >
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/finance/payment-history/')({
    component: PaymentHistoryPage,
});
