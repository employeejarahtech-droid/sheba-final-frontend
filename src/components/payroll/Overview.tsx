
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Banknote,
    Building2,
    CalendarX2,
    Clock,
    PieChart,
    PlusCircle,
    Users,
    XCircle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "../layout/app-header";

// Dummy types
type Department = {
    id: string;
    name: string;
};

type Role = {
    id: string;
    display_name: string;
};

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
    allowances?: { name: string; amount: number }[];
    deductions?: { name: string; amount: number }[];
    bank_details?: {
        bank_name: string;
        account_name: string;
        account_number: string;
    };
};

// Dummy data
const DUMMY_STAFF_DATA: Staff[] = [
    {
        id: "1",
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
    },
    {
        id: "2",
        first_name: "Dr. Fatima",
        last_name: "Khan",
        email: "fatima.khan@hospital.com",
        thumb_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
        basic_salary: 45000,
        salary: 45000,
        department: { id: "2", name: "Pediatrics" },
        position: "Pediatrician",
        role: { id: "1", display_name: "Doctor" },
        status: "active",
        created_at: "2021-03-20",
        allowances: [
            { name: "Transport", amount: 4000 },
            { name: "Medical", amount: 3000 },
        ],
        deductions: [
            { name: "Tax", amount: 2500 },
        ],
        bank_details: {
            bank_name: "DBBL",
            account_name: "Dr. Fatima Khan",
            account_number: "0987654321",
        },
    },
    {
        id: "3",
        first_name: "Nurse Sadia",
        last_name: "Islam",
        email: "sadia.islam@hospital.com",
        thumb_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sadia",
        basic_salary: 25000,
        salary: 25000,
        department: { id: "3", name: "Emergency" },
        position: "Head Nurse",
        role: { id: "2", display_name: "Nurse" },
        status: "active",
        created_at: "2019-06-10",
        allowances: [
            { name: "Night Shift", amount: 3000 },
        ],
        deductions: [
            { name: "Tax", amount: 1500 },
        ],
        bank_details: {
            bank_name: "BRAC Bank",
            account_name: "Sadia Islam",
            account_number: "5555666677",
        },
    },
    {
        id: "4",
        first_name: "Admin Karim",
        last_name: "Hossain",
        email: "karim.hossain@hospital.com",
        thumb_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim",
        basic_salary: 30000,
        salary: 30000,
        department: { id: "4", name: "Administration" },
        position: "Admin Officer",
        role: { id: "3", display_name: "Admin" },
        status: "on leave",
        created_at: "2020-08-01",
        allowances: [],
        deductions: [
            { name: "Tax", amount: 2000 },
        ],
        bank_details: {
            bank_name: "City Bank",
            account_name: "Karim Hossain",
            account_number: "9999888877",
        },
    },
    {
        id: "5",
        first_name: "Dr. Nasrin",
        last_name: "Akter",
        email: "nasrin.akter@hospital.com",
        thumb_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nasrin",
        basic_salary: 48000,
        salary: 48000,
        department: { id: "5", name: "Gynecology" },
        position: "Gynecologist",
        role: { id: "1", display_name: "Doctor" },
        status: "inactive",
        created_at: "2018-02-14",
        allowances: [
            { name: "Transport", amount: 5000 },
        ],
        deductions: [
            { name: "Tax", amount: 3000 },
        ],
        bank_details: {
            bank_name: "Islami Bank",
            account_name: "Dr. Nasrin Akter",
            account_number: "1111222233",
        },
    },
];

// Simple modal
function ConfirmModal({
    open,
    onClose,
    onConfirm,
    message,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96">
                <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function HrPayrollOverview() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [limit] = useState(10);

    // Use dummy data instead of API
    const [staffsList, setStaffsList] = useState<Staff[]>(DUMMY_STAFF_DATA);
    const isLoading = false;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    // -----------------------------------------
    //  DYNAMIC STATS BASED ON API RESPONSE
    // -----------------------------------------
    const totalStaff = staffsList?.length;

    const activeStaff = staffsList?.filter(
        (s: Staff) => s.status.toLowerCase() === "active"
    ).length;

    const inactiveStaff = staffsList?.filter(
        (s: Staff) => s.status.toLowerCase() === "inactive"
    ).length;

    const onLeaveStaff = staffsList?.filter(
        (s) => s.status.toLowerCase() === "on leave"
    ).length;

    const stats = [
        {
            label: "Total Staffs",
            value: totalStaff,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <Users className="w-6 h-6 text-white" />,
        },
        {
            label: "Active Staffs",
            value: activeStaff,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <Clock className="w-6 h-6 text-white" />,
        },
        {
            label: "On Leave",
            value: onLeaveStaff,
            gradient: "from-amber-600 to-amber-400",
            shadow: "shadow-amber-500/30",
            icon: <CalendarX2 className="w-6 h-6 text-white" />,
        },
        {
            label: "Inactive Staffs",
            value: inactiveStaff,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <XCircle className="w-6 h-6 text-white" />,
        },
    ];

    // -----------------------
    // DELETE HANDLER
    // -----------------------
    const handleDeleteClick = (staff: Staff) => {
        setSelectedStaff(staff);
        setModalOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedStaff) return;
        // Remove from local state
        setStaffsList(prev => prev.filter(s => s.id !== selectedStaff.id));
        toast.success("Staff deleted successfully!");
        setModalOpen(false);
        setSelectedStaff(null);
    };

    // -----------------------
    // ATTENDANCE HANDLER - Navigate to attendance page
    // -----------------------
    const handleAttendanceClick = (staff: Staff) => {
        navigate({ to: `/dashboard/payroll/attendance/${staff.id}` });
    };

    // -----------------------
    // SALARY MANAGE HANDLER - Navigate to salary page
    // -----------------------
    const handleSalaryClick = (staff: Staff) => {
        navigate({ to: `/dashboard/payroll/salary/${staff.id}` });
    };

    // -----------------------
    // PAYROLL AGGREGATION
    // -----------------------
    const payrollAggregates = useMemo(() => {
        if (!staffsList) return null;

        let basic = 0;
        let totalAllowances = 0;
        let totalDeductions = 0;
        const allowanceBreakdown: Record<string, number> = {};
        const deductionBreakdown: Record<string, number> = {};

        staffsList.forEach((staff) => {
            const salary = Number(staff.basic_salary) || Number(staff.salary) || 0;
            basic += salary;

            staff.allowances?.forEach((a) => {
                const amt = Number(a.amount) || 0;
                totalAllowances += amt;
                allowanceBreakdown[a.name] = (allowanceBreakdown[a.name] || 0) + amt;
            });

            staff.deductions?.forEach((d) => {
                const amt = Number(d.amount) || 0;
                totalDeductions += amt;
                deductionBreakdown[d.name] = (deductionBreakdown[d.name] || 0) + amt;
            });
        });

        return {
            basic,
            totalAllowances,
            totalDeductions,
            net: basic + totalAllowances - totalDeductions,
            allowanceBreakdown,
            deductionBreakdown,
        };
    }, [staffsList]);

    const staffColumns = [
        {
            data: "id",
            title: "Employee ID #",
            className: "font-medium",
        },
        {
            data: null,
            title: "Name",
            className: "font-semibold",
            render: (_data: any, _type: string, row: Staff) => {
                return `${row.first_name} ${row.last_name}`;
            },
        },
        {
            data: "thumb_url",
            title: "Image",
            render: (data: string) => {
                return `<div class="flex items-center gap-2"><img src="${data}" class="w-8 h-8 rounded-full" /></div>`;
            },
        },
        {
            data: "email",
            title: "Email",
        },
        {
            data: "salary",
            title: "Basic Salary",
            render: (_data: any, _type: string, row: Staff) => {
                const salary = row.basic_salary || row.salary || 0;
                return `<span>${salary.toLocaleString()}</span>`;
            },
        },
        {
            data: "department",
            title: "Department",
            render: (data: Department) => {
                return data?.name || '-';
            },
        },
        {
            data: "position",
            title: "Position",
        },
        {
            data: "role",
            title: "Role",
            render: (data: Role) => {
                return data?.display_name || '-';
            },
        },
        {
            data: "status",
            title: "Status",
            render: (data: string) => {
                const color = data?.toLowerCase() === "active" ? "bg-green-600" : data?.toLowerCase() === "inactive" ? "bg-red-500" : "bg-gray-500";
                return `<span class="${color} text-white capitalize px-2 py-1 rounded text-xs">${data}</span>`;
            },
        },
        {
            data: "created_at",
            title: "Hire Date",
            render: (data: string) => {
                if (!data) return '-';
                const date = new Date(data);
                return date.toLocaleDateString();
            },
        },
        {
            data: null,
            title: "Actions",
            render: (_data: any, _type: string, row: Staff) => {
                return `
                    <div class="flex gap-2 flex-wrap">
                        <button onclick="window.handleSalaryClick('${row.id}')" class="bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1 text-xs">
                            Salary
                        </button>
                        <button onclick="window.handleAttendanceClick('${row.id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1 text-xs">
                            Attendance
                        </button>
                        <button onclick="window.handleDeleteClick('${row.id}')" class="bg-destructive hover:bg-red-700 text-white rounded px-2 py-1 text-xs">
                            Delete
                        </button>
                    </div>
                `;
            },
        },
    ];

    // Expose handlers to window for onclick
    useEffect(() => {
        (window as any).handleSalaryClick = (id: string) => {
            const staff = staffsList.find(s => s.id === id);
            if (staff) handleSalaryClick(staff);
        };
        (window as any).handleAttendanceClick = (id: string) => {
            const staff = staffsList.find(s => s.id === id);
            if (staff) handleAttendanceClick(staff);
        };
        (window as any).handleDeleteClick = (id: string) => {
            const staff = staffsList.find(s => s.id === id);
            if (staff) handleDeleteClick(staff);
        };
    }, [staffsList]);

    return (
        <>
            <AppHeader fixed />
            <main className="p-6 lg:p-10">
                <div className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">Employee & Payroll Overview</h1>

                        <button onClick={() => toast.info('Add Employee functionality')} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
                            <PlusCircle size={18} />
                            Add Employee
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {stats.map((item, idx) => (
                            <div
                                key={idx}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                            >
                                {/* Background Pattern */}
                                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                                <div className="relative flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white/90">{item.label}</p>
                                        <h3 className="mt-2 text-3xl font-bold text-white">
                                            {item.value || 0}
                                        </h3>
                                    </div>
                                    <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                        {item.icon}
                                    </div>
                                </div>

                                {/* Progress/Indicator line */}
                                <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                                    <div className="h-full w-2/3 rounded-full bg-white/40" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="pt-6 pb-2">
                        <CardHeader>
                            <CardTitle>All Employees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p>Loading...</p>
                            ) : (
                                <DataTable
                                    columns={staffColumns}
                                    data={staffsList ?? []}
                                    meta={{
                                        page: page,
                                        limit: limit,
                                        total: staffsList.length
                                    }}
                                    onPageChange={(newPage) => setPage(newPage)}
                                    search={search}
                                    onSearchChange={(value) => {
                                        setSearch(value);
                                        setPage(1);
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* PAYROLL FINANCIAL SUMMARY */}
                    {staffsList && staffsList.length > 0 && (
                        <div className="mt-8 space-y-6">
                            <div className="flex items-center gap-2">
                                <Banknote className="w-6 h-6 text-emerald-600" />
                                <h2 className="text-xl font-bold tracking-tight text-gray-800">Monthly Payroll Estimation (Current View)</h2>
                            </div>

                            {/* 4 Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-medium text-gray-500">Total Basic Salary</p>
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <Building2 className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800">
                                            {payrollAggregates?.basic.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-blue-500 mt-1 font-medium">Fixed Component</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-medium text-gray-500">Total Allowances</p>
                                            <div className="p-2 bg-emerald-100 rounded-full">
                                                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800">
                                            {payrollAggregates?.totalAllowances.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-emerald-500 mt-1 font-medium">+ Additions</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-medium text-gray-500">Total Deductions</p>
                                            <div className="p-2 bg-rose-100 rounded-full">
                                                <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800">
                                            {payrollAggregates?.totalDeductions.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-rose-500 mt-1 font-medium">- Subtractions</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-medium text-gray-500">Est. Net Payable</p>
                                            <div className="p-2 bg-purple-100 rounded-full">
                                                <Banknote className="w-4 h-4 text-purple-600" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-purple-700">
                                            {payrollAggregates?.net.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-purple-500 mt-1 font-medium">= Final Payout</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Breakdown Charts/Lists */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Allowances Breakdown */}
                                <Card>
                                    <CardHeader className="pb-2 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                                            <PieChart className="w-5 h-5" /> Allowance Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            {Object.entries(payrollAggregates?.allowanceBreakdown || {}).map(([name, amount], idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 font-medium">{name || "Other"}</span>
                                                    <span className="font-bold text-emerald-600">{Number(amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {Object.keys(payrollAggregates?.allowanceBreakdown || {}).length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4">No specific allowances defined.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Deductions Breakdown */}
                                <Card>
                                    <CardHeader className="pb-2 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2 text-rose-800">
                                            <PieChart className="w-5 h-5" /> Deduction Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            {Object.entries(payrollAggregates?.deductionBreakdown || {}).map(([name, amount], idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 font-medium">{name || "Other"}</span>
                                                    <span className="font-bold text-rose-600">{Number(amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {Object.keys(payrollAggregates?.deductionBreakdown || {}).length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4">No specific deductions defined.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* CONFIRM MODAL */}
                    <ConfirmModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onConfirm={confirmDelete}
                        message={`Are you sure you want to delete ${selectedStaff?.first_name} ${selectedStaff?.last_name}?`}
                    />
                </div>
            </main>
        </>
    );
}
