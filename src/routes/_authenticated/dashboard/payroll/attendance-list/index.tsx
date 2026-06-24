"use client";

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, ChevronRight, CheckCircle, XCircle, Clock, CalendarX2, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { AppHeader } from "@/components/layout/app-header";

type Staff = {
    id: string | number;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    thumb_url?: string;
    avatar?: string;
    image?: string;
    department?: { name: string } | string;
    position?: string;
};

type Summary = { present: number; absent: number; late: number; leave: number; notSet: number; total: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_TO_NUM: Record<string, number> = MONTHS.reduce((acc, m, i) => { acc[m] = i + 1; return acc; }, {} as Record<string, number>);

const emptySummary: Summary = { present: 0, absent: 0, late: 0, leave: 0, notSet: 0, total: 0 };

function summarize(records: any[]): Summary {
    const s = { ...emptySummary };
    records.forEach(r => {
        const status = (r.status || '').toLowerCase();
        if (status === 'present' || status === 'half_day') s.present += 1;
        else if (status === 'absent') s.absent += 1;
        else if (status === 'late') s.late += 1;
        else if (status === 'on_leave') s.leave += 1;
        else s.notSet += 1;
        s.total += 1;
    });
    return s;
}

function AttendanceListPage() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');

    const [month, setMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
    const [year, setYear] = useState(() => String(new Date().getFullYear()));

    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["users-list-attendance", 1, 1000],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/list?page=1&limit=1000`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch staff list");
            return res.json();
        },
        enabled: !!token,
    });

    const staffList: Staff[] = useMemo(() => usersResponse?.data?.items || [], [usersResponse]);

    // For the selected month/year, fetch each staff's attendance records and summarize.
    const { data: summaries, isLoading: isSummaryLoading } = useQuery({
        queryKey: ["attendance-summaries", month, year, staffList.map(s => s.id).join(',')],
        queryFn: async () => {
            const mNum = MONTH_TO_NUM[month] || 1;
            const yearNum = parseInt(year);
            const lastDay = new Date(yearNum, mNum, 0).getDate();
            const from_date = `${yearNum}-${String(mNum).padStart(2, '0')}-01`;
            const to_date = `${yearNum}-${String(mNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const entries = await Promise.all(
                staffList.map(async (staff) => {
                    try {
                        const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/api/attendance?staff_id=${staff.id}&from_date=${from_date}&to_date=${to_date}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (!res.ok) return { staffId: String(staff.id), summary: emptySummary };
                        const json = await res.json();
                        return { staffId: String(staff.id), summary: summarize(json.data || []) };
                    } catch {
                        return { staffId: String(staff.id), summary: emptySummary };
                    }
                })
            );
            const map: Record<string, Summary> = {};
            entries.forEach(e => { map[e.staffId] = e.summary; });
            return map;
        },
        enabled: !!token && staffList.length > 0,
    });

    const grandTotal = useMemo(() => {
        if (!summaries) return emptySummary;
        return Object.values(summaries).reduce((acc, s) => ({
            present: acc.present + s.present,
            absent: acc.absent + s.absent,
            late: acc.late + s.late,
            leave: acc.leave + s.leave,
            notSet: acc.notSet + s.notSet,
            total: acc.total + s.total,
        }), { ...emptySummary });
    }, [summaries]);

    const displayName = (s: Staff) => s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unnamed';
    const deptName = (s: Staff) => (typeof s.department === 'object' ? s.department?.name : s.department) || '-';

    const loading = isLoading || isSummaryLoading;

    return (
        <>
            <AppHeader fixed />
            <main className="p-4 lg:p-6">
                <div className="w-full space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
                            <p className="text-sm text-muted-foreground">Monthly attendance summary for all staff</p>
                        </div>
                        <div className="flex gap-2">
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Month" /></SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-[100px] h-9"><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => String(2024 + i)).map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Grand totals */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {[
                            { label: "Present", value: grandTotal.present, icon: CheckCircle, grad: "from-emerald-500 to-teal-500" },
                            { label: "Absent", value: grandTotal.absent, icon: XCircle, grad: "from-rose-500 to-red-500" },
                            { label: "Late", value: grandTotal.late, icon: Clock, grad: "from-amber-500 to-orange-500" },
                            { label: "Leave", value: grandTotal.leave, icon: CalendarX2, grad: "from-sky-500 to-blue-500" },
                            { label: "Not Set", value: grandTotal.notSet, icon: HelpCircle, grad: "from-slate-400 to-slate-500" },
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

                    {/* Staff table */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Staff Attendance — {month} {year}</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Click “Manage” to edit a staff member's daily attendance</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">Loading attendance…</div>
                            ) : staffList.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-muted-foreground">No staff found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900/20 text-slate-600 font-semibold border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Employee</th>
                                                <th className="px-4 py-3 text-left">Department</th>
                                                <th className="px-4 py-3 text-center text-emerald-600">Present</th>
                                                <th className="px-4 py-3 text-center text-rose-600">Absent</th>
                                                <th className="px-4 py-3 text-center text-amber-600">Late</th>
                                                <th className="px-4 py-3 text-center text-sky-600">Leave</th>
                                                <th className="px-4 py-3 text-center text-slate-500">Not Set</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {staffList.map(staff => {
                                                const s = summaries?.[String(staff.id)] || emptySummary;
                                                return (
                                                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-9 h-9">
                                                                    <AvatarImage src={staff.avatar || staff.image || staff.thumb_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName(staff))}`} />
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium">{displayName(staff)}</div>
                                                                    <div className="text-xs text-muted-foreground">{staff.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">{deptName(staff)}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-emerald-600">{s.present}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-rose-600">{s.absent}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-amber-600">{s.late}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-sky-600">{s.leave}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-slate-500">{s.notSet}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button size="sm" variant="outline" onClick={() => navigate({ to: `/dashboard/payroll/attendance/${staff.id}` })}>
                                                                Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                                            </Button>
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
                </div>
            </main>
        </>
    );
}

export const Route = createFileRoute('/_authenticated/dashboard/payroll/attendance-list/')({
    component: AttendanceListPage,
});
