
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/date-field";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Banknote,
    Building2,
    CalendarX2,
    Clock,
    LayoutDashboard,
    PieChart,
    PlusCircle,
    Users,
    XCircle,
    Plus,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "../layout/app-header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useCurrency } from "@/hooks/use-currency";

function toYMD(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

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
    id: string | number;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    thumb_url?: string;
    avatar?: string;
    image?: string;
    is_active?: boolean;
    role_id?: number;
    basic_salary?: number;
    salary?: number;
    department?: Department | string;
    position?: string;
    role?: Role;
    status?: string;
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

// ===== Summary Card Component =====
function SummaryCard({
    title,
    value,
    subtitle,
    subtitleClassName,
    icon: Icon,
    gradientClass,
}: {
    title: string;
    value: string;
    subtitle?: string;
    subtitleClassName?: string;
    icon: React.ElementType;
    gradientClass: string;
}) {
    return (
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                    <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-lg shadow-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{value}</div>
                {subtitle ? (
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs font-medium ${subtitleClassName ?? 'text-muted-foreground'}`}>{subtitle}</span>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

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

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const { currencySymbol } = useCurrency();

    // Hire Date range filter — same preset-dropdown convention used across the
    // other dashboard pages, filtering by this list's own date column.
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [customSelected, setCustomSelected] = useState(false);
    const [presetOpen, setPresetOpen] = useState(false);

    const datePresets = useMemo(() => {
        const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
        const shift = (n: number) => { const d = today(); d.setDate(d.getDate() - n); return d }
        return ({
            today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
            yesterday: { label: 'Yesterday', from: toYMD(shift(1)), to: toYMD(shift(1)) },
            last7: { label: 'Last 7 days', from: toYMD(shift(6)), to: toYMD(today()) },
            last15: { label: 'Last 15 days', from: toYMD(shift(14)), to: toYMD(today()) },
            last30: { label: 'Last 30 days', from: toYMD(shift(29)), to: toYMD(today()) },
            last45: { label: 'Last 45 days', from: toYMD(shift(44)), to: toYMD(today()) },
            last60: { label: 'Last 60 days', from: toYMD(shift(59)), to: toYMD(today()) },
            last90: { label: 'Last 90 days', from: toYMD(shift(89)), to: toYMD(today()) },
            last180: { label: 'Last 180 days', from: toYMD(shift(179)), to: toYMD(today()) },
            last365: { label: 'Last 365 days', from: toYMD(shift(364)), to: toYMD(today()) },
            thisMonth: { label: 'This Month', from: toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toYMD(today()) },
        } as const)
    }, [])

    const activePreset = useMemo(() => {
        if (!from || !to) return 'allTime'
        const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
        return match ? match[0] : 'custom'
    }, [from, to, datePresets])

    const showCustomFields = customSelected || activePreset === 'custom'

    const applyPreset = (key: string) => {
        if (key === 'custom') {
            setCustomSelected(true)
        } else {
            setCustomSelected(false)
            if (key === 'allTime') {
                setFrom(''); setTo('')
            } else {
                const p = (datePresets as any)[key]
                if (p) { setFrom(p.from); setTo(p.to) }
            }
            setPage(1)
        }
        setPresetOpen(false)
    }

    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["users-list", page, limit, search, from, to],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search })
            if (from) params.set('from', from)
            if (to) params.set('to', to)
            const url = `${import.meta.env.VITE_API_URL}/api/users/list?${params}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch user list");
            return res.json();
        },
        enabled: !!token,
    });

    const staffsList = useMemo<Staff[]>(() => {
        return usersResponse?.data?.items || [];
    }, [usersResponse]);

    const totalCount = useMemo(() => {
        return usersResponse?.data?.meta?.total || staffsList.length || 0;
    }, [usersResponse, staffsList]);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    // -----------------------------------------
    //  DYNAMIC STATS BASED ON API RESPONSE
    // -----------------------------------------
    const totalStaff = staffsList?.length || 0;

    const activeStaff = staffsList?.filter(
        (s: Staff) => {
            const statusStr = s.status || (s.is_active ? "active" : "inactive");
            return statusStr.toLowerCase() === "active";
        }
    ).length || 0;

    const inactiveStaff = staffsList?.filter(
        (s: Staff) => {
            const statusStr = s.status || (s.is_active ? "active" : "inactive");
            return statusStr.toLowerCase() === "inactive";
        }
    ).length || 0;

    const onLeaveStaff = staffsList?.filter(
        (s: Staff) => {
            const statusStr = s.status || (s.is_active ? "active" : "inactive");
            return statusStr.toLowerCase() === "on leave";
        }
    ).length || 0;

    const stats = [
        {
            label: "Total Staffs",
            value: totalStaff,
            gradientClass: "from-blue-500 to-indigo-500 shadow-blue-500/20",
            icon: Users,
        },
        {
            label: "Active Staffs",
            value: activeStaff,
            gradientClass: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
            icon: Clock,
        },
        {
            label: "On Leave",
            value: onLeaveStaff,
            gradientClass: "from-amber-500 to-orange-500 shadow-amber-500/20",
            icon: CalendarX2,
        },
        {
            label: "Inactive Staffs",
            value: inactiveStaff,
            gradientClass: "from-rose-500 to-red-500 shadow-rose-500/20",
            icon: XCircle,
        },
    ];

    // -----------------------
    // DELETE HANDLER
    // -----------------------
    const handleDeleteClick = (staff: Staff) => {
        setSelectedStaff(staff);
        setModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedStaff) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/delete/${selectedStaff.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.message || "Failed to delete user");
            }
            toast.success("User deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["users-list"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete user");
        } finally {
            setModalOpen(false);
            setSelectedStaff(null);
        }
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

        staffsList.forEach((staff) => {
            const salary = Number(staff.basic_salary) || Number(staff.salary) || 0;
            basic += salary;

            const allowances = parseJSONArray(staff.allowances);
            const deductions = parseJSONArray(staff.deductions);

            allowances.forEach((a: any) => {
                const amt = Number(a.amount) || 0;
                totalAllowances += amt;
                allowanceBreakdown[a.name] = (allowanceBreakdown[a.name] || 0) + amt;
            });

            deductions.forEach((d: any) => {
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
                if (row.name) return row.name;
                const fname = row.first_name || '';
                const lname = row.last_name || '';
                return `${fname} ${lname}`.trim() || 'Unnamed';
            },
        },
        {
            data: "thumb_url",
            title: "Image",
            render: (data: string, _type: string, row: any) => {
                const avatarUrl = data || row.avatar || row.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.name || row.email || 'avatar')}`;
                return `<div class="flex items-center gap-2"><img src="${avatarUrl}" class="w-8 h-8 rounded-full object-cover" /></div>`;
            },
        },
        {
            data: "email",
            title: "Email",
        },
        {
            data: "salary",
            title: `Basic Salary (${currencySymbol})`,
            render: (_data: any, _type: string, row: Staff) => {
                const salary = row.basic_salary || row.salary || 0;
                return `<span>${salary.toLocaleString()}</span>`;
            },
        },
        {
            data: "department",
            title: "Department",
            render: (data: any, _type: string, row: any) => {
                if (typeof data === 'object' && data?.name) return data.name;
                if (typeof data === 'string') return data;
                if (typeof row.department === 'string') return row.department;
                return '-';
            },
        },
        {
            data: "position",
            title: "Position",
            render: (data: string) => data || '-',
        },
        {
            data: "role",
            title: "Role",
            render: (data: any, _type: string, row: any) => {
                if (data?.display_name) return data.display_name;
                if (typeof data === 'string') return data;
                if (row.role_id === 1) return 'Admin';
                if (row.role_id === 2) return 'Doctor';
                if (row.role_id === 3) return 'Staff';
                return '-';
            },
        },
        {
            data: "status",
            title: "Status",
            render: (data: string, _type: string, row: any) => {
                const statusStr = data || (row.is_active ? 'active' : 'inactive');
                const color = statusStr.toLowerCase() === "active" ? "bg-green-600" : statusStr.toLowerCase() === "inactive" ? "bg-red-500" : "bg-gray-500";
                return `<span class="${color} text-white capitalize px-2 py-1 rounded text-xs">${statusStr}</span>`;
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
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleSalaryClick(staff);
        };
        (window as any).handleAttendanceClick = (id: string) => {
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleAttendanceClick(staff);
        };
        (window as any).handleDeleteClick = (id: string) => {
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleDeleteClick(staff);
        };
    }, [staffsList]);

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="w-full">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Payroll Dashboard</h1>
                                <p className="text-sm text-muted-foreground">Employee roster & payroll summary — filtered by Hire Date</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                                <SelectTrigger className="w-[160px] h-9">
                                    <SelectValue placeholder="Filter by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="allTime">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7">Last 7 days</SelectItem>
                                    <SelectItem value="last15">Last 15 days</SelectItem>
                                    <SelectItem value="last30">Last 30 days</SelectItem>
                                    <SelectItem value="last45">Last 45 days</SelectItem>
                                    <SelectItem value="last60">Last 60 days</SelectItem>
                                    <SelectItem value="last90">Last 90 days</SelectItem>
                                    <SelectItem value="last180">Last 180 days</SelectItem>
                                    <SelectItem value="last365">Last 365 days</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="custom">Custom range</SelectItem>
                                </SelectContent>
                            </Select>
                            {showCustomFields && (
                                <>
                                    <DateField value={from} onChange={(v: string) => { setFrom(v); setPage(1) }} placeholder="From" />
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <DateField value={to} onChange={(v: string) => { setTo(v); setPage(1) }} placeholder="To" />
                                </>
                            )}
                            <button onClick={() => toast.info('Add Employee functionality')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                                <Plus size={16} />
                                Add Employee
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {stats.map((item) => (
                            <SummaryCard
                                key={item.label}
                                title={item.label}
                                value={String(item.value || 0)}
                                icon={item.icon}
                                gradientClass={item.gradientClass}
                            />
                        ))}
                    </div>

                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">All Employees</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">List of all registered hospital staff and details</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            {isLoading ? (
                                <p>Loading...</p>
                            ) : (
                                <DataTable
                                    columns={staffColumns}
                                    data={staffsList ?? []}
                                    meta={{
                                        page: page,
                                        limit: limit,
                                        total: totalCount
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
                                <SummaryCard
                                    title="Total Basic Salary"
                                    value={(payrollAggregates?.basic ?? 0).toLocaleString()}
                                    subtitle="Fixed Component"
                                    subtitleClassName="text-blue-500"
                                    icon={Building2}
                                    gradientClass="from-blue-500 to-indigo-500 shadow-blue-500/20"
                                />
                                <SummaryCard
                                    title="Total Allowances"
                                    value={(payrollAggregates?.totalAllowances ?? 0).toLocaleString()}
                                    subtitle="+ Additions"
                                    subtitleClassName="text-emerald-500"
                                    icon={ArrowUpCircle}
                                    gradientClass="from-emerald-500 to-teal-500 shadow-emerald-500/20"
                                />
                                <SummaryCard
                                    title="Total Deductions"
                                    value={(payrollAggregates?.totalDeductions ?? 0).toLocaleString()}
                                    subtitle="- Subtractions"
                                    subtitleClassName="text-rose-500"
                                    icon={ArrowDownCircle}
                                    gradientClass="from-rose-500 to-red-500 shadow-rose-500/20"
                                />
                                <SummaryCard
                                    title="Est. Net Payable"
                                    value={(payrollAggregates?.net ?? 0).toLocaleString()}
                                    subtitle="= Final Payout"
                                    subtitleClassName="text-purple-500"
                                    icon={Banknote}
                                    gradientClass="from-purple-500 to-indigo-500 shadow-purple-500/20"
                                />
                            </div>

                            {/* Breakdown Charts/Lists */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Allowances Breakdown */}
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                                                <PieChart className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][0] }} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Allowance Breakdown</CardTitle>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Detailed list of employee allowances</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg shadow-lg">
                                                <PieChart className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][0] }} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-rose-800 dark:text-rose-300">Deduction Breakdown</CardTitle>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Detailed list of employee deductions</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
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
                        message={`Are you sure you want to delete ${selectedStaff?.name || `${selectedStaff?.first_name} ${selectedStaff?.last_name}`.trim() || 'this staff member'}?`}
                    />
                </div>
            </main>
        </>
    );
}
