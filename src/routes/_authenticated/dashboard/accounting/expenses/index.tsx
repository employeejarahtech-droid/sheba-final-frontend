
"use client";

import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
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




const expensesSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/expenses/')({
    validateSearch: (search) => expensesSearchSchema.parse(search),
    component: ExpensesPage,
})

function ExpensesPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();
    const { currencySymbol } = useCurrency();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };

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
        if (p) { setFrom(p.from); setTo(p.to) }
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
            render: (data: any, _type: string, row: Expense) => {
                const esc = (s: any) => String(s ?? '-').replace(/"/g, '&quot;');
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${data}"
                                data-title="${esc(row.title)}"
                                data-description="${esc(row.description)}"
                                data-category="${esc(row?.debitHead?.name)}"
                                data-amount="${Number(row.amount || 0).toFixed(2)}"
                                data-date="${esc(row.expense_date)}"
                                data-payment-method="${esc(row.payment_method)}"
                                data-reference="${esc(row.reference_number)}"
                                data-status="${esc(row.status || 'pending')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data}</span>
                    </div>
                `;
            },
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
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: Expense) => {
                return `
                    <div class="flex gap-2">
                        <button
                            onclick="window.printExpense(${row.id})"
                            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                            title="Print Voucher"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                        </button>
                    </div>
                `;
            },
        },
    ];

    // Handle expand button clicks using event delegation — mirrors the
    // Income page's expand-row detail pattern.
    useEffect(() => {
        const handleExpandClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.expand-btn');
            if (!button) return;

            const btn = button as HTMLButtonElement;
            const row = btn.closest('tr');
            if (!row) return;

            const isExpanded = row.classList.contains('expanded');
            const nextRow = row.nextElementSibling;

            // Toggle collapse
            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove();
                row.classList.remove('expanded');
                btn.textContent = '+';
                btn.style.backgroundColor = '#10B981';
                return;
            }

            if (isExpanded) return;

            const id = btn.dataset.id || '';
            const title = btn.dataset.title || '-';
            const description = btn.dataset.description || '-';
            const category = btn.dataset.category || '-';
            const amount = btn.dataset.amount || '0.00';
            const date = btn.dataset.date || '-';
            const paymentMethod = btn.dataset.paymentMethod || '-';
            const reference = btn.dataset.reference || '-';
            const status = btn.dataset.status || 'pending';

            const statusBadgeClass = status.toLowerCase() === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : status.toLowerCase() === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700';

            const details = document.createElement('div');
            details.className = 'max-w-3xl mx-auto my-4';
            details.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div class="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Expense Details</h2>
                        <p class="text-orange-100 text-sm">${title}</p>
                    </div>
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">
                            <li class="flex flex-col">
                                <span class="text-gray-500">Expense ID</span>
                                <span class="font-mono text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit">#${id}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Title</span>
                                <span class="font-semibold text-gray-800 dark:text-gray-100 text-base">${title}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Category</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-purple-100 text-purple-700">${category}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Amount</span>
                                <span class="font-bold text-lg text-red-600">${currencySymbol} ${amount}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Date</span>
                                <span class="font-medium text-gray-700 dark:text-gray-300">${date}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Payment Method</span>
                                <span class="font-medium text-gray-700 dark:text-gray-300">${paymentMethod}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Reference</span>
                                <span class="font-medium text-gray-700 dark:text-gray-300">${reference}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Status</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full capitalize ${statusBadgeClass}">${status}</span>
                            </li>
                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Description</span>
                                <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">${description || 'No description provided'}</span>
                            </li>
                        </ul>
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <button onclick="window.printExpense(${id})"
                                class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                Print Voucher
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 10;
            cell.appendChild(details);
            newRow.appendChild(cell);

            row.parentNode?.insertBefore(newRow, row.nextSibling);
            row.classList.add('expanded');
            btn.textContent = '−';
            btn.style.backgroundColor = '#dc2626';
        };

        document.addEventListener('click', handleExpandClick);
        return () => {
            document.removeEventListener('click', handleExpandClick);
        };
    }, [currencySymbol]);

    // Expose print handler for the Actions column's onclick (DataTable renders columns as HTML strings)
    if (typeof window !== 'undefined') {
        (window as any).printExpense = (id: number) => {
            navigate({ to: '/dashboard/accounting/expenses/$expenseId/print', params: { expenseId: String(id) } });
        };
    }

    if (isError) return <div className="p-8 text-center text-red-500">Error loading expenses</div>;

    return (
        <div className="">
            <AppHeader fixed />
            <main className=''>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <h2 className="text-2xl font-bold">All Expenses</h2>
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        <AddExpenseModal>
                            <Button>
                                <Plus className="h-4 w-4" />
                                Add Expense
                            </Button>
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
                    }}
                    search={search}
                    onSearchChange={(value) => setSearch(value)}
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
                            <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
                            <span className="text-xs text-muted-foreground">to</span>
                            <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
                            {(from || to) && (
                                <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>
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
