"use client";

import { useEffect, useState } from "react";
import React from "react";
import { Plus, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createFileRoute } from '@tanstack/react-router';

import CreateExpenseHeadForm from "@/components/accounting/CreateExpenseHead";
import CreateIncomeHeadForm from "@/components/accounting/CreateIncomeHead";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";

import { DataTable } from "@/components/DataTable";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";

import {
    useGetAccountingAccountsQuery,
    useAddAccountingAccountMutation,
    useUpdateAccountingAccountMutation,
    useGetTrialBalanceQuery,
} from "@/features/accounting/accountingQueries";
import { accountingService } from "@/features/accounting/accountingService";
import { ChartOfAccount } from "@/types/accounting.types";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { AppHeader } from "@/components/layout/app-header";

const accountsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/accounting/accounts/')({
    validateSearch: (search) => accountsSearchSchema.parse(search),
    component: ChartOfAccounts,
})

type AccountFormValues = {
    name: string;
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    parent_id?: string;
    description?: string;
    is_active?: boolean;
};

const TYPE_CONFIG: Record<string, { label: string; color: string; hint: string }> = {
    ASSET: { label: "Asset", color: "text-blue-600", hint: "Resources owned: cash, bank, receivables, inventory, fixed assets" },
    LIABILITY: { label: "Liability", color: "text-orange-600", hint: "Obligations: payables, loans, tax dues, advance received" },
    EQUITY: { label: "Equity", color: "text-purple-600", hint: "Owner interest: capital, drawings, retained earnings" },
    INCOME: { label: "Income", color: "text-emerald-600", hint: "Revenue: service fees, outdoor/indoor collections, diagnostics" },
    EXPENSE: { label: "Expense", color: "text-red-600", hint: "Costs: salaries, utilities, supplies, professional fees" },
};

function ChartOfAccounts() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { currencySymbol } = useCurrency();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
    const [autoCode, setAutoCode] = useState<string | null>(null);
    const [autoType, setAutoType] = useState<string | null>(null);
    const [selectedParent, setSelectedParent] = useState<ChartOfAccount | null>(null);

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };

    const { data: accountsData, isFetching } = useGetAccountingAccountsQuery({ page, limit, search });
    const { data: trialBalanceData } = useGetTrialBalanceQuery();

    const balanceMap = React.useMemo(() => {
        const map = new Map<string, { debit: number; credit: number; balance: number }>();
        const items = trialBalanceData?.data?.trial_balance;
        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const debit = parseFloat(item.debit) || 0;
                const credit = parseFloat(item.credit) || 0;
                const isDebitNature = ['ASSET', 'EXPENSE'].includes(item.type);
                const balance = isDebitNature ? (debit - credit) : (credit - debit);
                map.set(item.account, { debit, credit, balance });
            });
        }
        return map;
    }, [trialBalanceData]);

    const accountsWithBalances = React.useMemo(() => {
        return accountsData?.data?.map((account) => {
            const balance = balanceMap.get(account.name);
            return { ...account, debit: balance?.debit, credit: balance?.credit, balance: balance?.balance };
        }) || [];
    }, [accountsData, balanceMap]);

    const { mutateAsync: addAccountingAccount, isPending: isAdding } = useAddAccountingAccountMutation();
    const { mutateAsync: updateAccountingAccount, isPending: isUpdating } = useUpdateAccountingAccountMutation();
    const isLoading = isAdding || isUpdating;

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AccountFormValues>({
        defaultValues: { name: "", code: "", type: undefined, parent_id: undefined, description: "", is_active: true },
    });

    const watchedType = watch("type");
    const typeConfig = watchedType ? TYPE_CONFIG[watchedType] : null;

    const onSubmit = async (values: AccountFormValues) => {
        const payload: any = {
            name: values.name,
            code: values.code,
            type: values.type,
            description: values.description || null,
            is_active: values.is_active !== false,
        };
        if (values.parent_id) payload.parent_id = Number(values.parent_id);

        try {
            if (editingAccount) {
                const res = await updateAccountingAccount({ id: editingAccount.id, body: payload });
                if ((res as any).status) toast.success((res as any).message || "Account updated successfully");
            } else {
                const res = await addAccountingAccount(payload);
                if ((res as any).status) toast.success((res as any).message || "Account created successfully");
            }
            reset();
            setEditingAccount(null);
            setSelectedParent(null);
            setAutoCode(null);
            setAutoType(null);
            setIsOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Account operation failed");
        }
    };

    const onEdit = (account: ChartOfAccount) => {
        setEditingAccount(account);
        setAutoCode(null);
        setAutoType(null);
        setSelectedParent(null);
        setValue("name", account.name);
        setValue("code", account.code);
        // @ts-ignore
        setValue("type", account.type.toUpperCase() as any);
        setValue("parent_id", account.parent ? String(account.parent) : undefined);
        setValue("description", (account as any).description || "");
        setValue("is_active", (account as any).is_active !== false);
        setIsOpen(true);
    };

    const fetchNextCode = async (parentId?: number, type?: string) => {
        try {
            const params: { parent_id?: number; type?: string } = {};
            if (parentId) params.parent_id = parentId;
            else if (type) params.type = type;
            else return;
            const res = await accountingService.getNextAccountCode(params);
            const code = res?.data?.code || "";
            setAutoCode(code);
            setValue("code", code);
        } catch {
            setAutoCode(null);
        }
    };

    const handleParentSelect = async (id: number | null, account: ChartOfAccount | null) => {
        if (!id || !account) {
            setValue("parent_id", undefined);
            setSelectedParent(null);
            setAutoType(null);
            setAutoCode(null);
            // Re-generate root code if type is set
            const currentType = watch("type");
            if (currentType) fetchNextCode(undefined, currentType);
            return;
        }
        setValue("parent_id", String(id));
        setSelectedParent(account);
        setAutoType(account.type);
        setValue("type", account.type.toUpperCase() as any);
        fetchNextCode(id);
    };

    const handleTypeChange = (type: string) => {
        setAutoType(null);
        // If parent is selected, clear it when user manually changes type
        if (selectedParent) {
            setValue("parent_id", undefined);
            setSelectedParent(null);
        }
        fetchNextCode(undefined, type);
    };

    const openNew = () => {
        reset();
        setEditingAccount(null);
        setSelectedParent(null);
        setAutoCode(null);
        setAutoType(null);
    };

    const accountColumns = [
        {
            data: "code",
            title: "Code",
            render: (_data: any) => `<span class="font-mono text-xs text-muted-foreground">${_data || ''}</span>`
        },
        {
            data: "name",
            title: "Account Name",
            render: (_data: any, _type: string, row: ChartOfAccount) => {
                const padding = (row.level || 0) * 20;
                const prefix = (row.level || 0) > 0 ? `<span class="mr-2 text-muted-foreground">└─</span>` : '';
                const fontClass = (row.level || 0) === 0 ? "font-semibold" : "";
                return `<div class="flex items-center" style="padding-left: ${padding}px">${prefix}<span class="${fontClass}">${row.name}</span></div>`;
            },
        },
        {
            data: "type",
            title: "Type",
            render: (_data: any) => `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">${_data || ''}</span>`
        },
        {
            data: "debit",
            title: "Debit",
            className: "text-right",
            render: (_data: any) => {
                const val = parseFloat(_data) || 0;
                return `<div class="font-medium text-emerald-600">${val.toFixed(2)}</div>`;
            },
        },
        {
            data: "credit",
            title: "Credit",
            className: "text-right",
            render: (_data: any) => {
                const val = parseFloat(_data) || 0;
                return `<div class="font-medium text-red-600">${val.toFixed(2)}</div>`;
            },
        },
        {
            data: "balance",
            title: "Balance",
            className: "text-right",
            render: (_data: any, _type: string, row: ChartOfAccount) => {
                const balance = row.balance || 0;
                const balanceClass = balance > 0 ? "text-emerald-600" : balance < 0 ? "text-red-600" : "text-muted-foreground";
                return `<div class="font-semibold ${balanceClass}">${balance.toFixed(2)}</div>`;
            },
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            className: "text-right",
            render: (_data: any, _type: string, row: ChartOfAccount) => {
                return `<div class="flex justify-end gap-2"><button class="edit-account-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9" data-id="${row.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button></div>`;
            },
        },
    ];

    useEffect(() => {
        const handleEdit = (e: any) => {
            const btn = (e.target as HTMLElement).closest('.edit-account-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const account = accountsWithBalances.find(a => String(a.id) === id);
                if (account) onEdit(account);
            }
        };
        document.addEventListener('click', handleEdit);
        return () => document.removeEventListener('click', handleEdit);
    }, [accountsWithBalances]);

    // Determine if selected parent is bank-related (code starts with 11)
    const isBankParent = selectedParent?.code?.startsWith("11") && selectedParent?.type?.toUpperCase() === "ASSET";

    return (
        <>
            <AppHeader fixed />

            <main className='p-4'>
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
                        <p className="text-muted-foreground">Manage your financial head hierarchy.</p>
                    </div>
                    <div className="flex gap-2">
                        <CreateIncomeHeadForm />
                        <CreateExpenseHeadForm />

                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger onClick={openNew} asChild>
                                <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-xs">
                                    <Plus className="h-4 w-4" /> Add Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
                                    <DialogDescription>
                                        {editingAccount ? "Update account details." : "Create a new account in your chart of accounts."}
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                                    {/* ── Basic Information ── */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Basic Information</h4>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label>Account Name *</Label>
                                                <Controller
                                                    name="name"
                                                    control={control}
                                                    rules={{ required: "Account name is required" }}
                                                    render={({ field }) => (
                                                        <Input {...field} placeholder="e.g., Dutch Bangla Bank — Main Branch" />
                                                    )}
                                                />
                                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Code <span className="text-muted-foreground font-normal">(auto)</span></Label>
                                                    <Controller
                                                        name="code"
                                                        control={control}
                                                        rules={{ required: "Code is required" }}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                readOnly
                                                                className="bg-muted cursor-not-allowed font-mono"
                                                                placeholder="Select type or parent..."
                                                            />
                                                        )}
                                                    />
                                                    {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Type {autoType && <span className="text-muted-foreground font-normal">(inherited)</span>}</Label>
                                                    <Controller
                                                        name="type"
                                                        control={control}
                                                        rules={{ required: "Type is required" }}
                                                        render={({ field }) => (
                                                            <Select
                                                                onValueChange={(val) => {
                                                                    field.onChange(val);
                                                                    handleTypeChange(val);
                                                                }}
                                                                value={field.value}
                                                                disabled={!!autoType}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ASSET">Asset</SelectItem>
                                                                    <SelectItem value="LIABILITY">Liability</SelectItem>
                                                                    <SelectItem value="EQUITY">Equity</SelectItem>
                                                                    <SelectItem value="INCOME">Income</SelectItem>
                                                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                                                </div>
                                            </div>

                                            {typeConfig && (
                                                <p className={`text-xs ${typeConfig.color} bg-muted/50 rounded-md px-3 py-2`}>
                                                    {typeConfig.hint}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* ── Hierarchy ── */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Hierarchy</h4>
                                        <div className="grid gap-2">
                                            <Label>Parent Account</Label>
                                            <NestedAccountSelect
                                                value={watch("parent_id") ? Number(watch("parent_id")) : null}
                                                onChange={handleParentSelect}
                                                placeholder="Select parent account (leave empty for root)..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Selecting a parent auto-fills code &amp; type. Root accounts use 1000/2000/3000/4000/5000 series.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Bank Account Section (conditional) ── */}
                                    {isBankParent && !editingAccount && (
                                        <>
                                            <Separator />
                                            <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-3">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                                    Bank Account Details
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    This account will be under a bank group. You can register the bank account details from the <span className="font-medium">Bank Module</span> after creation.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <Separator />

                                    {/* ── Additional Details ── */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Additional Details</h4>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label>Description</Label>
                                                <Controller
                                                    name="description"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Optional notes about this account..."
                                                            rows={2}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <Controller
                                                    name="is_active"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={(val) => field.onChange(val === "active")}
                                                            value={field.value !== false ? "active" : "inactive"}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-2">
                                        <Button type="button" variant="ghost" onClick={openNew}>
                                            Reset
                                        </Button>
                                        <div className="flex-1" />
                                        <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditingAccount(null); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Debit */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Debit</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {currencySymbol} {(trialBalanceData?.data?.total_debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>Sum of all</span>
                            <span className="font-semibold">Debit Balances</span>
                        </div>
                    </div>

                    {/* Total Credit */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-400 p-6 shadow-lg shadow-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Credit</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {currencySymbol} {(trialBalanceData?.data?.total_credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <TrendingDown className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>Sum of all</span>
                            <span className="font-semibold">Credit Balances</span>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 p-6 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                        <div className="relative flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Net Balance</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">
                                    {currencySymbol} {((trialBalanceData?.data?.total_debit ?? 0) - (trialBalanceData?.data?.total_credit ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <Scale className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative flex justify-between text-white/90 text-sm">
                            <span>Debit - Credit</span>
                            <span className="font-semibold">Balance</span>
                        </div>
                    </div>
                </div>

                <div className="">
                        <DataTable
                            columns={accountColumns}
                            data={accountsWithBalances}
                            meta={{
                                page,
                                limit,
                                total: accountsData?.pagination?.total || 0
                            }}
                            onPageChange={setPage}
                            onLimitChange={setLimit}
                            onSearchChange={setSearch}
                            search={search}
                            isLoading={isFetching}
                        />
                </div>
            </main>
        </>
    );
}
