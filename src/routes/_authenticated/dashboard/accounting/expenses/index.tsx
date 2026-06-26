
"use client";

import { useState, useMemo } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { Plus, DollarSign, TrendingDown, CreditCard } from "lucide-react";
import { AddExpenseModal } from "@/components/accounting/AddExpenseModal";

import { useGetExpensesQuery } from "@/features/accounting/accountingQueries";
import { Expense } from "@/types/accounting.types";
import { DataTable } from "@/components/DataTable";
import { useCurrency } from '@/hooks/use-currency'
import { DateField } from '@/components/date-field'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Layout

import { AppHeader } from '@/components/layout/app-header'




export const Route = createFileRoute('/_authenticated/dashboard/accounting/expenses/')({
    component: ExpensesPage,
})

function ExpensesPage() {
    const { currencySymbol } = useCurrency();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const limit = 10;

    // Date filter presets
    const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    const toYMD = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
    }
    const datePresets = useMemo(() => ({
        today: { from: toYMD(today()), to: toYMD(today()) },
        yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { from: toYMD(d), to: toYMD(d) }; })(),
        last7: (() => { const d = today(); d.setDate(d.getDate() - 6); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last15: (() => { const d = today(); d.setDate(d.getDate() - 14); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last30: (() => { const d = today(); d.setDate(d.getDate() - 29); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last45: (() => { const d = today(); d.setDate(d.getDate() - 44); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last60: (() => { const d = today(); d.setDate(d.getDate() - 59); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last90: (() => { const d = today(); d.setDate(d.getDate() - 89); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last180: (() => { const d = today(); d.setDate(d.getDate() - 179); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last365: (() => { const d = today(); d.setDate(d.getDate() - 364); return { from: toYMD(d), to: toYMD(today()) }; })(),
    }), [])
    const activePreset = useMemo(() => {
        if (!from || !to) return 'custom'
        const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
        return match ? match[0] : 'custom'
    }, [from, to, datePresets])
    const [presetOpen, setPresetOpen] = useState(false)
    const applyPreset = (key: string) => {
        const p = (datePresets as any)[key]
        if (p) { setFrom(p.from); setTo(p.to); setPage(1) }
        setPresetOpen(false)
    }

    const {
        data: fetchedData,
        isFetching,
        isError,
    } = useGetExpensesQuery({
        page,
        limit,
        search,
        start_date: from,
        end_date: to,
    });

    // @ts-ignore
    const expenses: Expense[] = fetchedData?.data || [];

    // Stats
    const { data: allExpensesData } = useGetExpensesQuery({ limit: 1000 });
    // @ts-ignore
    const allExpenses = allExpensesData?.data || [];

    const totalExpense = allExpenses.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const totalTransactions = allExpenses.length;
    const avgTransaction = totalTransactions > 0 ? totalExpense / totalTransactions : 0;

    const stats = [
        {
            label: "Total Expenses",
            value: `${currencySymbol} ${totalExpense.toLocaleString()}`,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <DollarSign className="w-6 h-6 text-white" />,
        },
        {
            label: "Total Transactions",
            value: totalTransactions,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <TrendingDown className="w-6 h-6 text-white" />,
        },
        {
            label: "Avg. Transaction",
            value: `${currencySymbol} ${avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            gradient: "from-violet-600 to-violet-400",
            shadow: "shadow-violet-500/30",
            icon: <CreditCard className="w-6 h-6 text-white" />,
        },
    ];

    const expenseColumns = [
        {
            data: "id",
            title: "ID",
            orderable: true,
            responsivePriority: 1,
        },
        {
            data: "title",
            title: "Title",
            orderable: true,
            responsivePriority: 2,
        },
        {
            data: "description",
            title: "Description",
            orderable: false,
            responsivePriority: 5,
        },
        {
            data: null,
            title: "Category",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: Expense) => {
                const debitHead = row?.debitHead?.name;
                return debitHead || '<span class="text-red-500 font-semibold">N/A</span>';
            },
        },
        {
            data: "amount",
            title: `Amount (${currencySymbol})`,
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => Number(data || 0).toFixed(2),
        },
        {
            data: "expense_date",
            title: "Date",
            orderable: true,
            responsivePriority: 4,
        },
        {
            data: "payment_method",
            title: "Payment Method",
            orderable: true,
            responsivePriority: 4,
        },
        {
            data: "reference_number",
            title: "Reference",
            orderable: true,
            responsivePriority: 5,
        },
        {
            data: "status",
            title: "Status",
            orderable: true,
            responsivePriority: 3,
            render: (data: any) => {
                const status = data || "pending";
                let className = "capitalize inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ";
                if (status.toLowerCase() === "paid") {
                    className += "bg-emerald-100 text-emerald-700 border-emerald-200";
                } else if (status.toLowerCase() === "pending") {
                    className += "bg-amber-100 text-amber-700 border-amber-200";
                } else {
                    className += "bg-rose-100 text-rose-700 border-rose-200";
                }
                return `<span class="${className}">${status}</span>`;
            },
        },
    ];

    if (isError) return <div className="p-8 text-center text-red-500">Error loading expenses</div>;

    return (
        <div className="">
            <AppHeader fixed />
            <main className=''>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <h2 className="text-2xl font-bold">All Expenses</h2>
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        <AddExpenseModal>
                            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none whitespace-nowrap">
                                <Plus size={18} /> Add Expense
                            </button>
                        </AddExpenseModal>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                                        {item.value}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    {item.icon}
                                </div>
                            </div>

                            {/* Progress/Indicator line (optional visual flair) */}
                            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                                <div className="h-full w-2/3 rounded-full bg-white/40" />
                            </div>
                        </div>
                    ))}
                </div>

                <DataTable
                    columns={expenseColumns}
                    data={expenses}
                    meta={{
                        page,
                        limit,
                        total: fetchedData?.pagination?.total || 0,
                    }}
                    onPageChange={(newPage) => setPage(newPage)}
                    onLimitChange={() => {
                        // Keep limit fixed at 10 for now
                        setPage(1);
                    }}
                    search={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    isLoading={isFetching}
                    filterSlot={
                        <div className="flex items-center gap-1.5">
                            <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                                    <SelectValue placeholder="Filter by" />
                                </SelectTrigger>
                                <SelectContent>
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
                                    <SelectItem value="custom">Custom range</SelectItem>
                                </SelectContent>
                            </Select>
                            <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false); setPage(1) }} placeholder="From" />
                            <span className="text-xs text-muted-foreground">to</span>
                            <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false); setPage(1) }} placeholder="To" />
                            {(from || to) && (
                                <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setPage(1) }}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    }
                />
            </main>
        </div>
    );
}
