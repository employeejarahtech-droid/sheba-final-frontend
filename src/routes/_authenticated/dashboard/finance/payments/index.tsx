"use client";

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, CheckCircle, Download, CreditCard, Calendar, Users, DollarSign, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useCurrency } from '@/hooks/use-currency';

type BankDetails = {
    bank_name?: string;
    account_name?: string;
    account_number?: string;
};

type PendingPayroll = {
    id: number;
    staff_id: number;
    staff?: {
        id: number;
        name: string;
        email: string;
        position?: string;
        bank_details?: BankDetails | string | null;
    };
    month: string;
    year: number;
    basic_salary: number;
    allowances: Record<string, number>;
    deductions: Record<string, number>;
    net_salary: number;
    status: 'pending' | 'paid' | 'cancelled';
    notes?: string;
};

// bank_details is a native JSON column so Sequelize normally hands back an
// object already, but the salary-edit page defensively re-parses it too —
// mirror that here in case a row was ever written as a raw JSON string.
const parseBankDetails = (value: BankDetails | string | null | undefined): BankDetails => {
    if (!value) return {};
    if (typeof value === 'string') {
        try { return JSON.parse(value) || {}; } catch { return {}; }
    }
    return value;
};

function PaymentsPage() {
    const token = getCookie('accessToken');
    const { currencySymbol, format } = useCurrency();

    const [pendingPayrolls, setPendingPayrolls] = useState<PendingPayroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
    const [processing, setProcessing] = useState(false);
    const [generatingFile, setGeneratingFile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    // Fetch pending payrolls
    const fetchPendingPayrolls = async () => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/payroll/pending?month=${selectedMonth}&year=${selectedYear}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch pending payrolls');

            const result = await res.json();
            setPendingPayrolls(result.data || []);
            setSelectedIds(new Set()); // Reset selection
        } catch (error: any) {
            toast.error(error.message || 'Error loading pending payrolls');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPayrolls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, selectedYear]);

    const filteredPayrolls = pendingPayrolls.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (p.staff?.name || '').toLowerCase().includes(q) || (p.staff?.email || '').toLowerCase().includes(q);
    });

    // Calculate totals
    const selectedPayrolls = pendingPayrolls.filter(p => selectedIds.has(p.id));
    const totalAmount = selectedPayrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const staffCount = selectedPayrolls.length;

    // Handle selection
    const handleSelectAll = () => {
        if (selectedIds.size === filteredPayrolls.length && filteredPayrolls.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredPayrolls.map(p => p.id)));
        }
    };

    const handleSelectOne = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Process payment
    const handleProcessPayment = async () => {
        if (selectedIds.size === 0) {
            toast.error('Please select at least one payroll');
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/bulk-mark-paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    payroll_ids: Array.from(selectedIds),
                    payment_date: paymentDate,
                    payment_method: paymentMethod,
                    notes: `Bulk payment via ${paymentMethod}`
                })
            });

            if (!res.ok) throw new Error('Failed to process payment');

            const result = await res.json();

            const successCount = result.data?.success?.length || 0;
            const alreadyPaidCount = result.data?.already_paid?.length || 0;
            const failedCount = result.data?.failed?.length || 0;

            toast.success(`Payment processed: ${successCount} successful, ${alreadyPaidCount} already paid, ${failedCount} failed`);

            // Refresh the list
            await fetchPendingPayrolls();
        } catch (error: any) {
            toast.error(error.message || 'Error processing payment');
        } finally {
            setProcessing(false);
        }
    };

    // Generate bank payment file
    const handleGenerateBankFile = async () => {
        if (selectedIds.size === 0) {
            toast.error('Please select at least one payroll');
            return;
        }

        setGeneratingFile(true);
        try {
            const selectedPayrollData = pendingPayrolls.filter(p => selectedIds.has(p.id));
            const missingBankDetails = selectedPayrollData.filter(p => !parseBankDetails(p.staff?.bank_details).account_number);

            // Generate CSV content for bank payment
            const headers = ['Account Number', 'Account Name', 'Bank Name', 'Amount', 'Reference', 'Payment Date'];
            const rows = selectedPayrollData.map(p => {
                const bank = parseBankDetails(p.staff?.bank_details);
                return [
                    bank.account_number || 'MISSING',
                    bank.account_name || p.staff?.name || 'Unknown',
                    bank.bank_name || '-',
                    p.net_salary.toFixed(2),
                    `PAYROLL-${selectedMonth.toUpperCase()}-${selectedYear}-STAFF${p.staff_id}`,
                    paymentDate
                ];
            });

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bank_payment_${selectedMonth}_${selectedYear}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (missingBankDetails.length > 0) {
                toast.warning(`Bank file generated, but ${missingBankDetails.length} staff have no bank account on file (marked MISSING) — add it under Payroll > Salary Structure`);
            } else {
                toast.success('Bank payment file generated');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error generating file');
        } finally {
            setGeneratingFile(false);
        }
    };

    const formatCurrency = (amount: number) => format(amount);

    const statCards = [
        { label: 'Pending Payments', value: String(pendingPayrolls.length), icon: Wallet, grad: 'from-blue-500 to-indigo-500' },
        { label: 'Selected', value: String(selectedIds.size), icon: Users, grad: 'from-emerald-500 to-teal-500' },
        { label: 'Total Amount', value: formatCurrency(totalAmount), icon: DollarSign, grad: 'from-purple-500 to-indigo-500' },
        { label: 'Staff Count', value: String(staffCount), icon: FileText, grad: 'from-orange-500 to-amber-500' },
    ];

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="space-y-3">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Processing</h1>
                        <p className="text-sm text-muted-foreground">Process and manage payroll payments</p>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search staff name or email…"
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Month</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => (
                                            <SelectItem key={month} value={month}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Year</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Payment Date</label>
                                <Input
                                    type="date"
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
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

                    {/* Payment Options */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <CreditCard className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Payment Configuration</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Choose how the selected payroll payments will be settled</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Payment Method</label>
                                    <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Payrolls List */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Pending Payrolls ({filteredPayrolls.length})</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedMonth} {selectedYear} — awaiting payment</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchPendingPayrolls}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading pending payrolls...</p>
                                </div>
                            ) : filteredPayrolls.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                    <p className="text-gray-500">
                                        {pendingPayrolls.length === 0 ? 'No pending payments found' : 'No staff match your search'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Bulk Actions */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-white/[0.03] border-b">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectedIds.size === filteredPayrolls.length && filteredPayrolls.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <label htmlFor="select-all" className="text-sm font-medium">
                                                Select All ({selectedIds.size}/{filteredPayrolls.length})
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleGenerateBankFile}
                                                disabled={selectedIds.size === 0 || generatingFile}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                {generatingFile ? 'Generating...' : 'Bank File'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={handleProcessPayment}
                                                disabled={selectedIds.size === 0 || processing}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                {processing ? 'Processing...' : 'Process Payment'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Payroll List */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-white/[0.03] border-b">
                                                <tr>
                                                    <th className="w-10 px-4 py-3 text-center">
                                                        <Checkbox
                                                            checked={selectedIds.size === filteredPayrolls.length && filteredPayrolls.length > 0}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Staff</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Period</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Bank Account</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Net Salary ({currencySymbol})</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {filteredPayrolls.map((payroll) => {
                                                    const bank = parseBankDetails(payroll.staff?.bank_details);
                                                    return (
                                                        <tr
                                                            key={payroll.id}
                                                            className={`hover:bg-gray-50 dark:hover:bg-white/[0.03] ${selectedIds.has(payroll.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                                                        >
                                                            <td className="px-4 py-3 text-center">
                                                                <Checkbox
                                                                    checked={selectedIds.has(payroll.id)}
                                                                    onCheckedChange={() => handleSelectOne(payroll.id)}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">{payroll.staff?.name || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-500">{payroll.staff?.email || ''}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm">
                                                                    <div className="font-medium">{payroll.month}</div>
                                                                    <div className="text-xs text-gray-500">{payroll.year}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {bank.account_number ? (
                                                                    <div className="text-xs">
                                                                        <div className="font-mono text-gray-700 dark:text-gray-300">{bank.account_number}</div>
                                                                        <div className="text-gray-500">{bank.bank_name || '-'}</div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Not on file</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(payroll.net_salary)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        window.open(
                                                                            `${import.meta.env.VITE_API_URL}/api/payroll/${payroll.id}/payslip/download`,
                                                                            '_blank'
                                                                        );
                                                                    }}
                                                                    title="View payslip"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/finance/payments/')({
    component: PaymentsPage,
});
