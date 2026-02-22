"use client";

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wallet, CalendarCheck, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppHeader } from '@/components/layout/app-header';
import { Skeleton } from "@/components/ui/skeleton";

type Allowance = { name: string; amount: number };
type Deduction = { name: string; amount: number };
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
};

// Dummy attendance data
const dummyAttendanceRecords = [
    { date: '2025-01-24', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', workHours: '9h 0m' },
    { date: '2025-01-23', status: 'Present', checkIn: '09:15 AM', checkOut: '06:15 PM', workHours: '9h 0m' },
    { date: '2025-01-22', status: 'Late', checkIn: '10:30 AM', checkOut: '07:30 PM', workHours: '9h 0m' },
    { date: '2025-01-21', status: 'Absent', checkIn: '-', checkOut: '-', workHours: '0h 0m' },
    { date: '2025-01-20', status: 'Leave', checkIn: '-', checkOut: '-', workHours: '0h 0m' },
    { date: '2025-01-19', status: 'Present', checkIn: '08:45 AM', checkOut: '05:45 PM', workHours: '9h 0m' },
    { date: '2025-01-18', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', workHours: '9h 0m' },
];

function AttendancePage() {
    const { staffId } = useParams({ from: '/_authenticated/payroll/attendance/$staffId/' });
    const navigate = useNavigate();

    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [attendanceMonth, setAttendanceMonth] = useState("January");
    const [attendanceYear, setAttendanceYear] = useState("2025");
    const [customPayrollAmount, setCustomPayrollAmount] = useState("");

    // Fetch staff data
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                // Using dummy data for demo
                const dummyStaff: Staff = {
                    id: staffId || "1",
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
                };
                setStaff(dummyStaff);
            } catch (error) {
                console.error('Error fetching staff:', error);
                toast.error('Failed to load staff data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStaff();
    }, [staffId]);

    const handleBack = () => {
        navigate({ to: '/payroll/overview' });
    };

    const handleProcessPayroll = () => {
        toast.success('Payroll processed successfully!');
    };

    const handleViewSlip = () => {
        toast.info('Opening payslip...');
    };

    // Calculate salary summary
    const basicSalary = staff?.basic_salary || staff?.salary || 0;
    const totalAllowances = staff?.allowances?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalDeductions = staff?.deductions?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const grossSalary = basicSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    // Calculate stats from attendance
    const presentDays = dummyAttendanceRecords.filter(r => r.status === 'Present').length;
    const absentDays = dummyAttendanceRecords.filter(r => r.status === 'Absent').length;
    const lateDays = dummyAttendanceRecords.filter(r => r.status === 'Late').length;
    const leaveDays = dummyAttendanceRecords.filter(r => r.status === 'Leave').length;

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <main className="p-6 lg:p-10">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </>
        );
    }

    return (
        <>
            <AppHeader fixed />
            <main className="p-6 lg:p-10">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" onClick={handleBack}>
                            ← Back to Overview
                        </Button>
                        <h1 className="text-2xl font-bold">Attendance Record</h1>
                    </div>

                    {/* Staff Summary Card */}
                    {staff && (
                        <Card className="mb-6">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="w-16 h-16">
                                            <AvatarImage src={staff.thumb_url} />
                                        </Avatar>
                                        <div>
                                            <h2 className="text-xl font-bold">{staff.first_name} {staff.last_name}</h2>
                                            <p className="text-gray-600">{staff.position} • {staff.department?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Employee ID</p>
                                            <p className="font-semibold">{staff.id}</p>
                                        </div>
                                        <Badge className={`${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} capitalize`}>
                                            {staff.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Month/Year Selector */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Summary for {attendanceMonth} {attendanceYear}</h3>
                                    <p className="text-sm text-gray-500">View and manage attendance records</p>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={attendanceMonth} onValueChange={setAttendanceMonth}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="January">January</SelectItem>
                                            <SelectItem value="February">February</SelectItem>
                                            <SelectItem value="March">March</SelectItem>
                                            <SelectItem value="April">April</SelectItem>
                                            <SelectItem value="May">May</SelectItem>
                                            <SelectItem value="June">June</SelectItem>
                                            <SelectItem value="July">July</SelectItem>
                                            <SelectItem value="August">August</SelectItem>
                                            <SelectItem value="September">September</SelectItem>
                                            <SelectItem value="October">October</SelectItem>
                                            <SelectItem value="November">November</SelectItem>
                                            <SelectItem value="December">December</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={attendanceYear} onValueChange={setAttendanceYear}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2024">2024</SelectItem>
                                            <SelectItem value="2025">2025</SelectItem>
                                            <SelectItem value="2026">2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <Card className="bg-green-50 border-green-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-green-700">{presentDays}</span>
                                <span className="text-xs font-semibold text-green-600 uppercase">Present</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-red-700">{absentDays}</span>
                                <span className="text-xs font-semibold text-red-600 uppercase">Absent</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-orange-700">{lateDays}</span>
                                <span className="text-xs font-semibold text-orange-600 uppercase">Late</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-blue-700">{leaveDays}</span>
                                <span className="text-xs font-semibold text-blue-600 uppercase">Leaves</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Records Table */}
                    <Card className="mb-6">
                        <CardHeader className="pb-2">
                            <CardTitle>Attendance History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Check In</th>
                                            <th className="px-4 py-3">Check Out</th>
                                            <th className="px-4 py-3">Work Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dummyAttendanceRecords.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">{record.date}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={
                                                        record.status === 'Present' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                        record.status === 'Absent' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                        record.status === 'Late' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                                                        'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                                    }>
                                                        {record.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{record.checkIn}</td>
                                                <td className="px-4 py-3">{record.checkOut}</td>
                                                <td className="px-4 py-3">{record.workHours}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Salary Structure Reference */}
                    {staff && (
                        <Card className="mb-6 bg-slate-50 border-slate-200">
                            <CardHeader className="py-3 px-4 border-b border-slate-200">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                                    <Wallet className="w-4 h-4" /> Salary Structure Reference
                                </h4>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-8 text-sm">
                                    {/* Allowances */}
                                    <div>
                                        <h5 className="font-medium text-emerald-700 mb-2 border-b border-emerald-100 pb-1">Allowances (Additions)</h5>
                                        <ul className="space-y-1">
                                            <li className="flex justify-between">
                                                <span className="text-slate-600">Basic Salary</span>
                                                <span className="font-medium text-slate-800">{basicSalary.toLocaleString()}</span>
                                            </li>
                                            {staff.allowances?.map((item, idx) => (
                                                <li key={idx} className="flex justify-between">
                                                    <span className="text-slate-600">{item.name || "Allowance"}</span>
                                                    <span className="font-medium text-slate-800">{Number(item.amount).toLocaleString()}</span>
                                                </li>
                                            ))}
                                            {(!staff.allowances || staff.allowances.length === 0) && (
                                                <li className="text-xs text-slate-400 italic">No additional allowances</li>
                                            )}
                                        </ul>
                                    </div>
                                    {/* Deductions */}
                                    <div>
                                        <h5 className="font-medium text-rose-700 mb-2 border-b border-rose-100 pb-1">Deductions (Subtractions)</h5>
                                        <ul className="space-y-1">
                                            {staff.deductions?.map((item, idx) => (
                                                <li key={idx} className="flex justify-between">
                                                    <span className="text-slate-600">{item.name || "Deduction"}</span>
                                                    <span className="font-medium text-slate-800">{Number(item.amount).toLocaleString()}</span>
                                                </li>
                                            ))}
                                            {(!staff.deductions || staff.deductions.length === 0) && (
                                                <li className="text-xs text-slate-400 italic">No deductions defined</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                {/* Net Summary */}
                                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-6 text-sm font-semibold">
                                    <div className="text-emerald-700">Gross: {grossSalary.toLocaleString()}</div>
                                    <div className="text-slate-800">Net Payable: {netSalary.toLocaleString()}</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payable for Selected Month Card */}
                    <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-none">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <p className="text-emerald-100 font-medium mb-1">
                                        Estimated Payable for {attendanceMonth} {attendanceYear}
                                    </p>
                                    <h3 className="text-4xl font-bold flex items-baseline">
                                        <span className="text-xl mr-1 font-normal opacity-80">৳</span>
                                        {customPayrollAmount || netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 mb-4">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                                            Status: Pending
                                        </Badge>
                                        <span className="text-xs text-emerald-100 opacity-80">(Based on 30 working days)</span>
                                    </div>
                                    <div className="max-w-xs">
                                        <Label className="text-xs text-emerald-100 font-semibold uppercase tracking-wider mb-1 block">
                                            Override Amount
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-emerald-700 font-bold">৳</span>
                                        <Input
                                            type="number"
                                            placeholder="Enter custom amount..."
                                            className="pl-10 bg-white/90 border-none text-emerald-900 placeholder:text-emerald-900/50 focus-visible:ring-emerald-500"
                                            value={customPayrollAmount}
                                            onChange={(e) => setCustomPayrollAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[150px]">
                                <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-md" onClick={handleProcessPayroll}>
                                    <Wallet className="w-4 h-4 mr-2" /> Process Payroll
                                </Button>
                                <Button variant="outline" className="border-emerald-400 text-emerald-100 hover:bg-emerald-700 hover:text-white bg-transparent" onClick={handleViewSlip}>
                                    View Slip
                                </Button>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/payroll/attendance/$staffId/')({
    component: AttendancePage,
});
