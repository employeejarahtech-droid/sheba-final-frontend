"use client";

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, CheckCircle, Download, Upload, CreditCard, Calendar, Users, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";

type PendingPayroll = {
    id: number;
    staff_id: number;
    staff?: {
        id: number;
        name: string;
        email: string;
        position?: string;
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

function PaymentsPage() {
    const token = getCookie('accessToken');

    const [pendingPayrolls, setPendingPayrolls] = useState<PendingPayroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
    const [processing, setProcessing] = useState(false);
    const [generatingFile, setGeneratingFile] = useState(false);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    // Fetch pending payrolls
    const fetchPendingPayrolls = async () => {
        setLoading(true);
        try {
            const monthsMap: Record<string, number> = {
                January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
                July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
            };
            const mNum = monthsMap[selectedMonth] || 1;

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
    }, [selectedMonth, selectedYear]);

    // Calculate totals
    const selectedPayrolls = pendingPayrolls.filter(p => selectedIds.has(p.id));
    const totalAmount = selectedPayrolls.reduce((sum, p) => sum + p.net_salary, 0);
    const staffCount = selectedPayrolls.length;

    // Handle selection
    const handleSelectAll = () => {
        if (selectedIds.size === pendingPayrolls.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingPayrolls.map(p => p.id)));
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

            // Generate CSV content for bank payment
            const headers = ['Account Number', 'Account Name', 'Amount', 'Reference', 'Payment Date'];
            const rows = selectedPayrollData.map(p => [
                '1234567890', // Would come from staff.bank_account
                p.staff?.name || 'Unknown',
                p.net_salary.toFixed(2),
                `PAYROLL-${selectedMonth.toUpperCase()}-${selectedYear}-STAFF${p.staff_id}`,
                paymentDate
            ]);

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

            toast.success('Bank payment file generated');
        } catch (error: any) {
            toast.error(error.message || 'Error generating file');
        } finally {
            setGeneratingFile(false);
        }
    };

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
                        <p className="text-gray-500">Process and manage payroll payments</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2">Select Month</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger>
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
                                <label className="text-sm font-medium text-gray-700 mb-2">Select Year</label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger>
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
                                <label className="text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                <Input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Pending Payments</div>
                                    <div className="text-2xl font-bold text-blue-900">{pendingPayrolls.length}</div>
                                </div>
                                <Wallet className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Selected</div>
                                    <div className="text-2xl font-bold text-green-900">{selectedIds.size}</div>
                                </div>
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Total Amount</div>
                                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalAmount)}</div>
                                </div>
                                <DollarSign className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Staff Count</div>
                                    <div className="text-2xl font-bold text-orange-900">{staffCount}</div>
                                </div>
                                <FileText className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Options */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2">Payment Method</label>
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
                <Card className="shadow-sm">
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Pending Payrolls ({pendingPayrolls.length})
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchPendingPayrolls}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading pending payrolls...</p>
                            </div>
                        ) : pendingPayrolls.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                <p className="text-gray-500">No pending payments found</p>
                            </div>
                        ) : (
                            <>
                                {/* Bulk Actions */}
                                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Checkbox
                                            id="select-all"
                                            checked={selectedIds.size === pendingPayrolls.length && pendingPayrolls.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <label htmlFor="select-all" className="text-sm font-medium">
                                            Select All ({selectedIds.size}/{pendingPayrolls.length})
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
                                            Bank File
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
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="w-10 px-4 py-3 text-center">
                                                    <Checkbox
                                                        checked={selectedIds.size === pendingPayrolls.length}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Net Salary</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {pendingPayrolls.map((payroll) => (
                                                <tr
                                                    key={payroll.id}
                                                    className={`hover:bg-gray-50 ${selectedIds.has(payroll.id) ? 'bg-blue-50' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-center">
                                                        <Checkbox
                                                            checked={selectedIds.has(payroll.id)}
                                                            onCheckedChange={() => handleSelectOne(payroll.id)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{payroll.staff?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{payroll.staff?.email || ''}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">
                                                            <div className="font-medium">{payroll.month}</div>
                                                            <div className="text-xs text-gray-500">{payroll.year}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/finance/payments/')({
    component: PaymentsPage,
});
