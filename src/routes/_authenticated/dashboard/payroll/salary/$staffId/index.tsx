"use client";

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Trash, Wallet, Clock, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from '@/components/layout/app-header';

type Allowance = { name: string; amount: number };
type Deduction = { name: string; amount: number };
type BankDetails = { bank_name: string; account_name: string; account_number: string };
type Role = { id: string; display_name: string };
type Department = { id: string; name: string };

type Staff = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    thumb_url?: string;
    basic_salary?: number;
    salary?: number;
    department?: Department;
    position?: string;
    role?: Role;
    status: string;
    created_at: string;
    allowances?: Allowance[];
    deductions?: Deduction[];
    bank_details?: BankDetails;
};

// Dummy staff data (in a real app, this would come from API)
const getDummyStaff = (staffId: string): Staff => ({
    id: staffId,
    first_name: "Dr. Ahmed",
    last_name: "Rahman",
    email: "ahmed.rahman@hospital.com",
    thumb_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
    basic_salary: 50000,
    salary: 50000,
    department: { id: "1", name: "Cardiology" },
    position: "Senior Cardiologist",
    role: { id: "1", display_name: "Doctor" },
    status: "active",
    created_at: "2020-01-15",
    allowances: [
        { name: "Transport", amount: 5000 },
        { name: "Housing", amount: 10000 },
    ],
    deductions: [
        { name: "Tax", amount: 3000 },
        { name: "Insurance", amount: 2000 },
    ],
    bank_details: {
        bank_name: "Sonali Bank",
        account_name: "Dr. Ahmed Rahman",
        account_number: "1234567890",
    },
});

function SalaryPage() {
    const { staffId } = useParams({ from: '/_authenticated/dashboard/payroll/salary/$staffId/' });
    const navigate = useNavigate();

    // Local state (not using API for now)
    const [staff, setStaff] = useState<Staff>(() => getDummyStaff(staffId));

    // Salary Form State
    const [salaryForm, setSalaryForm] = useState({
        basic_salary: staff.basic_salary || 0,
        bank_name: staff.bank_details?.bank_name || "",
        account_name: staff.bank_details?.account_name || "",
        account_number: staff.bank_details?.account_number || "",
        allowances: staff.allowances || [],
        deductions: staff.deductions || [],
    });

    const [isUpdating, setIsUpdating] = useState(false);

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
        setIsUpdating(true);
        // Simulate API call
        setTimeout(() => {
            setStaff({
                ...staff,
                basic_salary: Number(salaryForm.basic_salary),
                allowances: salaryForm.allowances,
                deductions: salaryForm.deductions,
                bank_details: {
                    bank_name: salaryForm.bank_name,
                    account_name: salaryForm.account_name,
                    account_number: salaryForm.account_number,
                }
            });
            toast.success("Salary details updated!");
            setIsUpdating(false);
            navigate({ to: '/dashboard/payroll/overview' });
        }, 500);
    };

    const handleBack = () => {
        navigate({ to: '/dashboard/payroll/overview' });
    };

    // Calculations for Summary
    const totalAllowances = salaryForm.allowances.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalDeductions = salaryForm.deductions.reduce((sum, item) => sum + Number(item.amount), 0);
    const grossSalary = salaryForm.basic_salary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    return (
        <>
            <AppHeader fixed />
            <main className="p-6 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" onClick={handleBack}>
                            ← Back to Overview
                        </Button>
                        <h1 className="text-2xl font-bold">Payroll Setup: {staff.first_name} {staff.last_name}</h1>
                    </div>

                    {/* Staff Summary Card */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={staff.thumb_url} />
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold">{staff.first_name} {staff.last_name}</h2>
                                    <p className="text-gray-600">{staff.position} • {staff.department?.name}</p>
                                    <p className="text-sm text-gray-500">{staff.email}</p>
                                </div>
                                <Badge className={`${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} capitalize`}>
                                    {staff.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic & Bank */}
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-semibold mb-4 text-blue-700 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" /> Basic Info
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-right text-sm font-medium">Basic Salary</label>
                                        <Input
                                            type="number"
                                            value={salaryForm.basic_salary}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: Number(e.target.value) })}
                                            className="col-span-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-semibold mb-4 text-blue-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Bank Details
                                </h4>
                                <div className="space-y-3">
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
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="font-semibold mb-2 text-blue-800">Monthly Calculation Ref</h4>
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
                            </div>
                        </div>

                        {/* Right Column: Allowances & Deductions */}
                        <div className="space-y-6">
                            {/* Allowances */}
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-green-700">Allowances</h4>
                                    <Button size="sm" variant="outline" onClick={addAllowance} className="h-7">
                                        <PlusCircle className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
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
                            </div>

                            {/* Deductions */}
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-red-700">Deductions</h4>
                                    <Button size="sm" variant="outline" onClick={addDeduction} className="h-7">
                                        <PlusCircle className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
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
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <Button variant="outline" onClick={handleBack}>
                            Cancel
                        </Button>
                        <Button onClick={saveSalaryDetails} disabled={isUpdating} className="min-w-[150px]">
                            {isUpdating ? "Saving..." : "Save Salary Details"}
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
