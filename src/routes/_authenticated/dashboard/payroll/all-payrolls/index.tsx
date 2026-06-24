"use client";

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/cookies';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Eye, Trash2, CheckCircle, Filter, Search, FileText, Clock, Banknote } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

type PayrollRecord = {
    id: number;
    staff_id: number;
    staff?: { id: number; first_name?: string; last_name?: string; name?: string; email: string; position?: string };
    month: string;
    year: number;
    basic_salary: number | string;
    allowances: Record<string, number>;
    deductions: Record<string, number>;
    net_salary: number | string;
    status: 'pending' | 'paid' | 'cancelled';
    payment_date?: string;
    payment_method?: 'bank_transfer' | 'cash' | 'cheque';
    notes?: string;
    created_at: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function AllPayrollsPage() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');

    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Mark-paid modal state
    const [markPaidTarget, setMarkPaidTarget] = useState<PayrollRecord | null>(null);
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
    const [markPaidSaving, setMarkPaidSaving] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const fetchPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedMonth !== "all") params.append('month', selectedMonth);
            if (selectedYear !== "all") params.append('year', selectedYear);
            if (selectedStatus !== "all") params.append('status', selectedStatus);

            const url = `${import.meta.env.VITE_API_URL}/api/payroll?${params.toString()}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch payrolls');
            const result = await res.json();
            setPayrolls(result.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Error loading payrolls');
        } finally {
            setLoading(false);
        }
    }, [token, selectedMonth, selectedYear, selectedStatus]);

    // Initial load + refetch whenever a filter changes (replaces the broken useState(() => …))
    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    const handleDelete = async (id: number, staffName: string) => {
        if (!window.confirm(`Delete payroll for ${staffName}?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete payroll');
            toast.success('Payroll deleted successfully');
            fetchPayrolls();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting payroll');
        }
    };

    const openMarkPaid = (payroll: PayrollRecord) => {
        setMarkPaidTarget(payroll);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('bank_transfer');
    };

    const confirmMarkPaid = async () => {
        if (!markPaidTarget) return;
        setMarkPaidSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${markPaidTarget.id}/mark-paid`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ payment_date: paymentDate, payment_method: paymentMethod })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.message || 'Failed to mark as paid');
            toast.success(`Payroll for ${staffName(markPaidTarget)} marked as paid`);
            setMarkPaidTarget(null);
            fetchPayrolls();
        } catch (error: any) {
            toast.error(error.message || 'Error marking as paid');
        } finally {
            setMarkPaidSaving(false);
        }
    };

    const handleViewSlip = async (payroll: PayrollRecord) => {
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

    const handleView = (payroll: PayrollRecord) => {
        navigate({ to: `/dashboard/payroll/attendance/${payroll.staff_id}` });
    };

    const filteredPayrolls = payrolls.filter(payroll => {
        const q = searchQuery.toLowerCase();
        return (
            staffName(payroll).toLowerCase().includes(q) ||
            (payroll.staff?.email || '').toLowerCase().includes(q) ||
            payroll.month.toLowerCase().includes(q)
        );
    });

    const totalNetSalary = filteredPayrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
    const pendingCount = filteredPayrolls.filter(p => p.status === 'pending').length;
    const paidCount = filteredPayrolls.filter(p => p.status === 'paid').length;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    return (
        <>
            <AppHeader fixed />
            <main className="p-4 lg:p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Payrolls</h1>
                        <p className="text-sm text-muted-foreground">View and manage all payroll records</p>
                    </div>

                    {/* Filters Card */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, email, month…"
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger><SelectValue placeholder="All Months" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={fetchPayrolls} className="md:col-span-1">
                                    <Filter className="w-4 h-4 mr-2" /> Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: "Total Records", value: String(filteredPayrolls.length), icon: FileText, grad: "from-blue-500 to-indigo-500" },
                            { label: "Pending Payment", value: String(pendingCount), icon: Clock, grad: "from-amber-500 to-orange-500" },
                            { label: "Paid", value: String(paidCount), icon: CheckCircle, grad: "from-emerald-500 to-teal-500" },
                            { label: "Total Amount", value: formatCurrency(totalNetSalary), icon: Banknote, grad: "from-purple-500 to-indigo-500" },
                        ].map((card) => {
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

                    {/* Payrolls Table */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Payroll Records ({filteredPayrolls.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading payrolls…</p>
                                </div>
                            ) : filteredPayrolls.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">No payroll records found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Basic</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Allow.</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Deduct.</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Net Salary</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredPayrolls.map((payroll) => {
                                                const totalAllowances = Object.values(payroll.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
                                                const totalDeductions = Object.values(payroll.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
                                                return (
                                                    <tr key={payroll.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900">{staffName(payroll)}</div>
                                                            <div className="text-xs text-gray-500">{payroll.staff?.email || ''}</div>
                                                        </td>
                                                        <td className="px-4 py-3"><div className="text-sm font-medium">{payroll.month}</div><div className="text-xs text-gray-500">{payroll.year}</div></td>
                                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(payroll.basic_salary) || 0)}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(totalAllowances)}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(totalDeductions)}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(Number(payroll.net_salary) || 0)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge className={cn(payroll.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200')}>
                                                                {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                                                            </Badge>
                                                            {payroll.payment_date && <div className="text-xs text-gray-500 mt-1">{new Date(payroll.payment_date).toLocaleDateString()}</div>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button size="sm" variant="ghost" onClick={() => handleViewSlip(payroll)} title="View payslip"><FileText className="w-4 h-4" /></Button>
                                                                <Button size="sm" variant="ghost" onClick={() => handleView(payroll)} title="View attendance"><Eye className="w-4 h-4" /></Button>
                                                                {payroll.status === 'pending' && (
                                                                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => openMarkPaid(payroll)} title="Mark as paid"><CheckCircle className="w-4 h-4" /></Button>
                                                                )}
                                                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(payroll.id, staffName(payroll))} title="Delete payroll"><Trash2 className="w-4 h-4" /></Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mark-Paid Modal */}
                    {markPaidTarget && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[420px] max-w-[92vw]">
                                <h3 className="text-lg font-semibold mb-1">Mark as Paid</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {staffName(markPaidTarget)} · {markPaidTarget.month} {markPaidTarget.year} · {formatCurrency(Number(markPaidTarget.net_salary) || 0)}
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Date</Label>
                                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Method</Label>
                                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button variant="outline" onClick={() => setMarkPaidTarget(null)}>Cancel</Button>
                                    <Button onClick={confirmMarkPaid} disabled={markPaidSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {markPaidSaving ? 'Saving…' : 'Confirm Paid'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

function staffName(p: PayrollRecord): string {
    if (p.staff?.name) return p.staff.name;
    if (p.staff?.first_name || p.staff?.last_name) return `${p.staff.first_name || ''} ${p.staff.last_name || ''}`.trim();
    return `Staff #${p.staff_id}`;
}

export const Route = createFileRoute('/_authenticated/dashboard/payroll/all-payrolls/')({
    component: AllPayrollsPage,
});
