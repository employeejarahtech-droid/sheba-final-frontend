"use client";

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarX2, XCircle, Plus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { AppHeader } from "@/components/layout/app-header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";

type Department = { id: string; name: string };
type Role = { id: string; display_name: string };

type Staff = {
    id: string | number;
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
    role_id?: number;
    status?: string;
    is_active?: boolean;
    created_at: string;
};

function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm}>Delete</Button>
                </div>
            </div>
        </div>
    );
}

function EmployeesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [limit] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["users-list", page, limit, search],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch user list");
            return res.json();
        },
        enabled: !!token,
    });

    const staffsList = useMemo<Staff[]>(() => usersResponse?.data?.items || [], [usersResponse]);
    const totalCount = usersResponse?.data?.meta?.total || staffsList.length || 0;

    const statusOf = (s: Staff) => (s.status || (s.is_active ? "active" : "inactive") || "active").toLowerCase();

    const activeStaff = staffsList.filter(s => statusOf(s) === "active").length;
    const onLeaveStaff = staffsList.filter(s => statusOf(s) === "on leave").length;
    const inactiveStaff = staffsList.filter(s => statusOf(s) === "inactive").length;

    const stats = [
        { label: "Total Staffs", value: staffsList.length, gradientClass: "from-blue-500 to-indigo-500", icon: Users },
        { label: "Active Staffs", value: activeStaff, gradientClass: "from-emerald-500 to-teal-500", icon: Clock },
        { label: "On Leave", value: onLeaveStaff, gradientClass: "from-amber-500 to-orange-500", icon: CalendarX2 },
        { label: "Inactive Staffs", value: inactiveStaff, gradientClass: "from-rose-500 to-red-500", icon: XCircle },
    ];

    const handleSalaryClick = (staff: Staff) => navigate({ to: `/dashboard/payroll/salary/${staff.id}` });
    const handleAttendanceClick = (staff: Staff) => navigate({ to: `/dashboard/payroll/attendance/${staff.id}` });

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
            toast.success("Employee deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["users-list"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete employee");
        } finally {
            setModalOpen(false);
            setSelectedStaff(null);
        }
    };

    const staffDisplayName = (row: Staff) =>
        row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unnamed';

    const staffColumns = [
        { data: "id", title: "Employee ID #", className: "font-medium" },
        {
            data: null, title: "Name", className: "font-semibold",
            render: (_data: any, _type: string, row: Staff) => staffDisplayName(row),
        },
        {
            data: "thumb_url", title: "Image",
            render: (data: string, _type: string, row: any) => {
                const avatarUrl = data || row.avatar || row.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffDisplayName(row))}`;
                return `<div class="flex items-center gap-2"><img src="${avatarUrl}" class="w-8 h-8 rounded-full object-cover" /></div>`;
            },
        },
        { data: "email", title: "Email" },
        {
            data: "department", title: "Department",
            render: (data: any, _type: string, row: any) => {
                if (typeof data === 'object' && data?.name) return data.name;
                if (typeof data === 'string') return data;
                return '-';
            },
        },
        { data: "position", title: "Position", render: (data: string) => data || '-' },
        {
            data: "salary", title: "Basic Salary",
            render: (_data: any, _type: string, row: Staff) => `<span>${(Number(row.basic_salary) || Number(row.salary) || 0).toLocaleString()}</span>`,
        },
        {
            data: "status", title: "Status",
            render: (data: string, _type: string, row: any) => {
                const statusStr = data || (row.is_active ? 'active' : 'inactive');
                const color = statusStr.toLowerCase() === "active" ? "bg-green-600" : statusStr.toLowerCase() === "inactive" ? "bg-red-500" : "bg-gray-500";
                return `<span class="${color} text-white capitalize px-2 py-1 rounded text-xs">${statusStr}</span>`;
            },
        },
        {
            data: null, title: "Actions",
            render: (_data: any, _type: string, row: Staff) => `
                <div class="flex gap-2 flex-wrap">
                    <button onclick="window.empSalary('${row.id}')" class="bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1 text-xs">Salary</button>
                    <button onclick="window.empAttendance('${row.id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1 text-xs">Attendance</button>
                    <button onclick="window.empDelete('${row.id}')" class="bg-destructive hover:bg-red-700 text-white rounded px-2 py-1 text-xs">Delete</button>
                </div>
            `,
        },
    ];

    // Expose handlers to window for DataTable onclick cells
    useEffect(() => {
        (window as any).empSalary = (id: string) => {
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleSalaryClick(staff);
        };
        (window as any).empAttendance = (id: string) => {
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleAttendanceClick(staff);
        };
        (window as any).empDelete = (id: string) => {
            const staff = staffsList.find(s => String(s.id) === String(id));
            if (staff) handleDeleteClick(staff);
        };
        return () => {
            delete (window as any).empSalary;
            delete (window as any).empAttendance;
            delete (window as any).empDelete;
        };
    }, [staffsList]);

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                            <p className="text-sm text-muted-foreground">Manage hospital staff, salary structures and attendance</p>
                        </div>
                        <Button onClick={() => toast.info('Add Employee — use the Users page to create a new staff account')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus size={16} /> Add Employee
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {stats.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <Card key={idx} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 bg-gradient-to-br ${item.gradientClass} rounded-lg shadow-lg`}>
                                                <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                                            </div>
                                            <CardTitle className="text-sm font-semibold">{item.label}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="text-2xl font-bold">{item.value || 0}</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Users className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">All Employees</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">List of all registered hospital staff</p>
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
                                    meta={{ page, limit, total: totalCount }}
                                    onPageChange={(newPage) => setPage(newPage)}
                                    search={search}
                                    onSearchChange={(value) => { setSearch(value); setPage(1); }}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <ConfirmModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Delete Employee"
                        message={`Are you sure you want to delete ${selectedStaff ? staffDisplayName(selectedStaff) : 'this employee'}? This action cannot be undone.`}
                    />
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/payroll/employees/')({
    component: EmployeesPage,
});
