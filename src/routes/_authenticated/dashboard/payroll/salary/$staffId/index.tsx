"use client";

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Trash, Wallet, Clock, PlusCircle, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppHeader } from '@/components/layout/app-header';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";

type Allowance = { name: string; amount: number };
type Deduction = { name: string; amount: number };
type BankDetails = { bank_name: string; account_name: string; account_number: string };
type Role = { id: string; display_name: string };
type Department = { id: string; name: string };

type Staff = {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    thumb_url?: string;
    avatar?: string;
    image?: string;
    basic_salary?: number;
    salary?: number;
    department?: Department | string;
    position?: string;
    role?: Role;
    status?: string;
    is_active?: boolean;
    created_at: string;
    allowances?: Allowance[];
    deductions?: Deduction[];
    bank_details?: BankDetails;
};

function SalaryPage() {
    const { staffId } = useParams({ from: '/_authenticated/dashboard/payroll/salary/$staffId/' });
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    // Fetch user details from the backend
    const { data: userResponse, isLoading, error } = useQuery({
        queryKey: ["user-details", staffId],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/get/${staffId}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch user details");
            return res.json();
        },
        enabled: !!token && !!staffId,
    });

    const staffData = userResponse?.data;

    // Salary Form State
    const [salaryForm, setSalaryForm] = useState({
        basic_salary: 0,
        bank_name: "",
        account_name: "",
        account_number: "",
        allowances: [] as Allowance[],
        deductions: [] as Deduction[],
    });

    // Sync form state when query data is loaded
    useEffect(() => {
        if (staffData) {
            const parseJSONArray = (val: any) => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') {
                    try {
                        const parsed = JSON.parse(val);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (_) {
                        return [];
                    }
                }
                return [];
            };

            const parseJSONObject = (val: any) => {
                if (typeof val === 'object' && val !== null) return val;
                if (typeof val === 'string') {
                    try {
                        const parsed = JSON.parse(val);
                        return typeof parsed === 'object' && parsed !== null ? parsed : {};
                    } catch (_) {
                        return {};
                    }
                }
                return {};
            };

            const bankDetails = parseJSONObject(staffData.bank_details);
            const allowances = parseJSONArray(staffData.allowances);
            const deductions = parseJSONArray(staffData.deductions);

            setSalaryForm({
                basic_salary: Number(staffData.basic_salary) || Number(staffData.salary) || 0,
                bank_name: bankDetails.bank_name || "",
                account_name: bankDetails.account_name || "",
                account_number: bankDetails.account_number || "",
                allowances: allowances,
                deductions: deductions,
            });
        }
    }, [staffData]);

    // Mutation to save salary details
    const mutation = useMutation({
        mutationFn: async (updatedData: any) => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/update/${staffId}`;
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedData),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.message || "Failed to update salary details");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Salary details updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["users-list"] });
            queryClient.invalidateQueries({ queryKey: ["user-details", staffId] });
            navigate({ to: '/dashboard/payroll/overview' });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update salary details");
        }
    });

    const addAllowance = () => {
        setSalaryForm(prev => ({
            ...prev,
            allowances: [...prev.allowances, { name: "", amount: 0 }]
        }));
    };

    const removeAllowance = (index: number) => {
        setSalaryForm(prev => ({
            ...prev,
            allowances: prev.allowances.filter((_, i) => i !== index)
        }));
    };

    const updateAllowance = (index: number, field: "name" | "amount", value: string | number) => {
        setSalaryForm(prev => {
            const newAllowances = [...prev.allowances];
            newAllowances[index] = { ...newAllowances[index], [field]: value };
            return { ...prev, allowances: newAllowances };
        });
    };

    const addDeduction = () => {
        setSalaryForm(prev => ({
            ...prev,
            deductions: [...prev.deductions, { name: "", amount: 0 }]
        }));
    };

    const removeDeduction = (index: number) => {
        setSalaryForm(prev => ({
            ...prev,
            deductions: prev.deductions.filter((_, i) => i !== index)
        }));
    };

    const updateDeduction = (index: number, field: "name" | "amount", value: string | number) => {
        setSalaryForm(prev => {
            const newDeductions = [...prev.deductions];
            newDeductions[index] = { ...newDeductions[index], [field]: value };
            return { ...prev, deductions: newDeductions };
        });
    };

    const saveSalaryDetails = () => {
        mutation.mutate({
            basic_salary: Number(salaryForm.basic_salary),
            salary: Number(salaryForm.basic_salary),
            bank_details: {
                bank_name: salaryForm.bank_name,
                account_name: salaryForm.account_name,
                account_number: salaryForm.account_number,
            },
            allowances: salaryForm.allowances,
            deductions: salaryForm.deductions,
        });
    };

    const handleBack = () => {
        navigate({ to: '/dashboard/payroll/overview' });
    };

    // Calculations for Summary
    const totalAllowances = salaryForm.allowances.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalDeductions = salaryForm.deductions.reduce((sum, item) => sum + Number(item.amount), 0);
    const grossSalary = salaryForm.basic_salary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <main className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-sm text-gray-500">Loading salary details...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <AppHeader fixed />
                <main className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                        <p className="text-red-500 font-semibold">Error loading user details</p>
                        <p className="text-sm text-gray-500">{(error as any)?.message || "Something went wrong"}</p>
                        <Button onClick={handleBack}>Go Back</Button>
                    </div>
                </main>
            </>
        );
    }

    const staffDisplayName = staffData?.name || `${staffData?.first_name || ''} ${staffData?.last_name || ''}`.trim() || 'Unnamed';
    const staffAvatarUrl = staffData?.avatar || staffData?.image || staffData?.thumb_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffDisplayName)}`;
    const staffStatus = staffData?.status || (staffData?.is_active ? 'active' : 'inactive');

    return (
        <>
            <AppHeader fixed />
            <main className="p-6 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" onClick={handleBack}>
                            ← Back to Overview
                        </Button>
                        <h1 className="text-2xl font-bold">Payroll Setup: {staffDisplayName}</h1>
                    </div>

                    {/* Staff Summary Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border mb-6">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">Staff Member Information</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-6">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={staffAvatarUrl} />
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold">{staffDisplayName}</h2>
                                    <p className="text-gray-600">{staffData?.position || 'Staff'} • {typeof staffData?.department === 'object' ? staffData?.department?.name : (staffData?.department || '-')}</p>
                                    <p className="text-sm text-gray-500">{staffData?.email}</p>
                                </div>
                                <Badge className={`${staffStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} capitalize`}>
                                    {staffStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic & Bank */}
                        <div className="space-y-6">
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                            <Wallet className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">Basic Info</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-right text-sm font-medium">Basic Salary</label>
                                        <Input
                                            type="number"
                                            value={salaryForm.basic_salary}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: Number(e.target.value) })}
                                            className="col-span-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                                            <Clock className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">Bank Details</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <Input
                                        placeholder="Bank Name"
                                        value={salaryForm.bank_name}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, bank_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Account Name"
                                        value={salaryForm.account_name}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, account_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Account Number"
                                        value={salaryForm.account_number}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, account_number: e.target.value })}
                                    />
                                </CardContent>
                            </Card>

                            {/* Summary Card */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border bg-blue-50/50 dark:from-gray-900 dark:to-blue-950/10">
                                <CardHeader className="bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-950/45 dark:to-indigo-950/45 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                            <Wallet className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200">Monthly Calculation Ref</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Basic Salary:</span>
                                        <span>{salaryForm.basic_salary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1 text-green-600">
                                        <span>+ Allowances:</span>
                                        <span>{totalAllowances.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2 text-red-600">
                                        <span>- Deductions:</span>
                                        <span>{totalDeductions.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Net Salary:</span>
                                        <span>{netSalary.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Allowances & Deductions */}
                        <div className="space-y-6">
                            {/* Allowances */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                                                <PlusCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Allowances</CardTitle>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={addAllowance} className="h-7 px-2">
                                            <PlusCircle className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {salaryForm.allowances.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Name (e.g. Transport)"
                                                    value={item.name}
                                                    onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={item.amount}
                                                    onChange={(e) => updateAllowance(index, 'amount', Number(e.target.value))}
                                                    className="w-24 h-8 text-xs"
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeAllowance(index)}>
                                                    <Trash className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        {salaryForm.allowances.length === 0 && <p className="text-xs text-gray-400 italic">No allowances added.</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deductions */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg shadow-lg">
                                                <PlusCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">Deductions</CardTitle>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={addDeduction} className="h-7 px-2">
                                            <PlusCircle className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {salaryForm.deductions.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Name (e.g. EPF)"
                                                    value={item.name}
                                                    onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={item.amount}
                                                    onChange={(e) => updateDeduction(index, 'amount', Number(e.target.value))}
                                                    className="w-24 h-8 text-xs"
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeDeduction(index)}>
                                                    <Trash className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        {salaryForm.deductions.length === 0 && <p className="text-xs text-gray-400 italic">No deductions added.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <Button variant="outline" onClick={handleBack}>
                            Cancel
                        </Button>
                        <Button onClick={saveSalaryDetails} disabled={mutation.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[150px]">
                            {mutation.isPending ? "Saving..." : "Save Salary Details"}
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/payroll/salary/$staffId/')({
    component: SalaryPage,
});
