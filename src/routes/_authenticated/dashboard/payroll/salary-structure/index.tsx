"use client";

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle, Banknote, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { AppHeader } from "@/components/layout/app-header";

type Item = { name?: string; amount: number };
type Staff = {
    id: string | number;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    thumb_url?: string;
    avatar?: string;
    image?: string;
    basic_salary?: number | string;
    salary?: number | string;
    department?: { name: string } | string;
    position?: string;
    allowances?: Item[] | string;
    deductions?: Item[] | string;
};

const parseArray = (val: any): Item[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
};

function SalaryStructurePage() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const [search, setSearch] = useState("");

    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["users-list-salary", 1, 1000],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/list?page=1&limit=1000`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch staff list");
            return res.json();
        },
        enabled: !!token,
    });

    const allStaff: Staff[] = useMemo(() => usersResponse?.data?.items || [], [usersResponse]);

    const enriched = useMemo(() => allStaff.map(s => {
        const basic = Number(s.basic_salary) || Number(s.salary) || 0;
        const allowances = parseArray(s.allowances);
        const deductions = parseArray(s.deductions);
        const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const net = basic + totalAllowances - totalDeductions;
        return { staff: s, basic, allowances, deductions, totalAllowances, totalDeductions, net };
    }), [allStaff]);

    const totals = useMemo(() => enriched.reduce((acc, e) => ({
        basic: acc.basic + e.basic,
        allowances: acc.allowances + e.totalAllowances,
        deductions: acc.deductions + e.totalDeductions,
        net: acc.net + e.net,
    }), { basic: 0, allowances: 0, deductions: 0, net: 0 }), [enriched]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return enriched;
        return enriched.filter(({ staff }) => {
            const name = (staff.name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim()).toLowerCase();
            return name.includes(q) || (staff.email || '').toLowerCase().includes(q);
        });
    }, [enriched, search]);

    const displayName = (s: Staff) => s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unnamed';
    const deptName = (s: Staff) => (typeof s.department === 'object' ? s.department?.name : s.department) || '-';
    const fmt = (n: number) => `৳ ${n.toLocaleString()}`;

    return (
        <>
            <AppHeader fixed />
            <main className="p-4 lg:p-6">
                <div className="w-full space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Salary Structure</h1>
                        <p className="text-sm text-muted-foreground">Basic salary, allowances and deductions for each employee</p>
                    </div>

                    {/* Org-wide summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: "Total Basic Salary", value: totals.basic, icon: Wallet, grad: "from-blue-500 to-indigo-500" },
                            { label: "Total Allowances", value: totals.allowances, icon: ArrowUpCircle, grad: "from-emerald-500 to-teal-500" },
                            { label: "Total Deductions", value: totals.deductions, icon: ArrowDownCircle, grad: "from-rose-500 to-red-500" },
                            { label: "Est. Net Payable", value: totals.net, icon: Banknote, grad: "from-purple-500 to-indigo-500" },
                        ].map(card => {
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
                                        <h3 className="text-2xl font-bold">{fmt(card.value)}</h3>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Staff salary table */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <DollarSign className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Employee Salary Structures</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Edit a structure to update basic salary, allowances, deductions & bank details</p>
                                    </div>
                                </div>
                                <div className="relative w-full max-w-xs">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Search by name or email…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">Loading salary structures…</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No employees found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900/20 text-slate-600 font-semibold border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Employee</th>
                                                <th className="px-4 py-3 text-right">Basic</th>
                                                <th className="px-4 py-3 text-left">Allowances</th>
                                                <th className="px-4 py-3 text-left">Deductions</th>
                                                <th className="px-4 py-3 text-right">Net Salary</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filtered.map(({ staff, basic, allowances, deductions, totalAllowances, totalDeductions, net }) => (
                                                <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-9 h-9">
                                                                <AvatarImage src={staff.avatar || staff.image || staff.thumb_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName(staff))}`} />
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{displayName(staff)}</div>
                                                                <div className="text-xs text-muted-foreground">{deptName(staff)}{staff.position ? ` · ${staff.position}` : ''}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">{fmt(basic)}</td>
                                                    <td className="px-4 py-3">
                                                        {allowances.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <div className="font-semibold text-emerald-600">+ {fmt(totalAllowances)}</div>
                                                                <div className="text-xs text-muted-foreground">{allowances.map(a => a.name).join(', ')}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {deductions.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <div className="font-semibold text-rose-600">- {fmt(totalDeductions)}</div>
                                                                <div className="text-xs text-muted-foreground">{deductions.map(d => d.name).join(', ')}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-purple-700 dark:text-purple-300">{fmt(net)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Button size="sm" variant="outline" onClick={() => navigate({ to: `/dashboard/payroll/salary/${staff.id}` })}>
                                                            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 dark:bg-slate-900/20 font-semibold border-t-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <td className="px-4 py-3" colSpan={2}>Total ({filtered.length})</td>
                                                <td className="px-4 py-3 text-emerald-600">+ {fmt(totals.allowances)}</td>
                                                <td className="px-4 py-3 text-rose-600">- {fmt(totals.deductions)}</td>
                                                <td className="px-4 py-3 text-right text-purple-700 dark:text-purple-300">{fmt(totals.net)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
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

export const Route = createFileRoute('/_authenticated/dashboard/payroll/salary-structure/')({
    component: SalaryStructurePage,
});
