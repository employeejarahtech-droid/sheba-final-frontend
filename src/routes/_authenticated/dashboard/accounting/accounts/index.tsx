"use client";

import { useEffect, useState } from "react";
import React from "react";
import { Plus, TrendingUp, TrendingDown, Scale, ChevronDown, ChevronRight, Folder, FolderOpen, FileText, Lock, Edit, Trash2, Search, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createFileRoute, Link } from '@tanstack/react-router';

import CreateExpenseHeadForm from "@/components/accounting/CreateExpenseHead";
import CreateIncomeHeadForm from "@/components/accounting/CreateIncomeHead";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";

import { DataTable } from "@/components/DataTable";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";

import {
    useAddAccountingAccountMutation,
    useUpdateAccountingAccountMutation,
    useDeleteAccountingAccountMutation,
    useGetTrialBalanceQuery,
} from "@/features/accounting/accountingQueries";
import { accountingService } from "@/features/accounting/accountingService";
import { useChartOfAccountsTree } from "@/features/accounting/useChartOfAccountsTree";
import { ChartOfAccount } from "@/types/accounting.types";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { AppHeader } from "@/components/layout/app-header";

const accountsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/accounts/')({
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

    // Fetch all accounts to build visual hierarchy tree (limit: 1000)
    const { isFetching, treeData } = useChartOfAccountsTree();
    const { data: trialBalanceData } = useGetTrialBalanceQuery();

    const filteredTreeData = React.useMemo(() => {
        if (!search) return treeData;
        const q = search.toLowerCase();

        const checkMatch = (node: any): boolean => {
            const nameMatch = node.name.toLowerCase().includes(q);
            const codeMatch = node.code.toLowerCase().includes(q);
            const childMatch = node.children.some((child: any) => checkMatch(child));
            return nameMatch || codeMatch || childMatch;
        };

        const filterNodes = (nodes: any[]): any[] => {
            return nodes
                .filter(node => checkMatch(node))
                .map(node => ({
                    ...node,
                    children: filterNodes(node.children),
                }));
        };

        return filterNodes(treeData);
    }, [treeData, search]);

    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    const toggleNode = (nodeId: number) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set<number>();
        const collectIds = (nodes: any[]) => {
            nodes.forEach((n) => {
                if (n.children.length > 0) {
                    allIds.add(n.id);
                    collectIds(n.children);
                }
            });
        };
        collectIds(treeData);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // Auto-expand matches on search
    useEffect(() => {
        if (search) {
            const matchIds = new Set<number>();
            const collectExpanded = (nodes: any[]) => {
                nodes.forEach(node => {
                    if (node.children.length > 0) {
                        matchIds.add(node.id);
                        collectExpanded(node.children);
                    }
                });
            };
            collectExpanded(filteredTreeData);
            setExpandedNodes(matchIds);
        }
    }, [search, filteredTreeData]);

    const assetsTree = React.useMemo(() => filteredTreeData.filter(n => n.type.toUpperCase() === "ASSET"), [filteredTreeData]);
    const liabilitiesTree = React.useMemo(() => filteredTreeData.filter(n => n.type.toUpperCase() === "LIABILITY"), [filteredTreeData]);
    const equityTree = React.useMemo(() => filteredTreeData.filter(n => n.type.toUpperCase() === "EQUITY"), [filteredTreeData]);
    const incomeTree = React.useMemo(() => filteredTreeData.filter(n => n.type.toUpperCase() === "INCOME"), [filteredTreeData]);
    const expenseTree = React.useMemo(() => filteredTreeData.filter(n => n.type.toUpperCase() === "EXPENSE"), [filteredTreeData]);

    const getVisibleNodes = (nodes: any[], list: any[] = []): any[] => {
        nodes.forEach((node) => {
            list.push(node);
            if (expandedNodes.has(node.id) && node.children.length > 0) {
                getVisibleNodes(node.children, list);
            }
        });
        return list;
    };

    const { mutateAsync: addAccountingAccount, isPending: isAdding } = useAddAccountingAccountMutation();
    const { mutateAsync: updateAccountingAccount, isPending: isUpdating } = useUpdateAccountingAccountMutation();
    const { mutateAsync: deleteAccountingAccount } = useDeleteAccountingAccountMutation();
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

    const onDelete = async (account: ChartOfAccount) => {
        if (account.is_protected) {
            toast.error("This account head is protected and cannot be deleted");
            return;
        }
        if (!confirm(`Delete "${account.name}"?\n\nIf it has transactions it will be deactivated (kept for history) instead of removed.`)) return;
        try {
            const res: any = await deleteAccountingAccount(account.id);
            if (res?.status) toast.success(res?.message || "Account deleted successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete account");
        }
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



    // Determine if selected parent is bank-related (code starts with 11)
    const isBankParent = selectedParent?.code?.startsWith("11") && selectedParent?.type?.toUpperCase() === "ASSET";

    const renderCategorySection = (title: string, roots: any[], type: string) => {
        const visibleNodes = getVisibleNodes(roots);
        const totalCategoryDebit = roots.reduce((sum, root) => sum + root.debit, 0);
        const totalCategoryCredit = roots.reduce((sum, root) => sum + root.credit, 0);
        const totalCategoryBalance = roots.reduce((sum, root) => sum + root.balance, 0);
        const cfg = TYPE_CONFIG[type.toUpperCase()] || { label: title, color: "text-gray-600", hint: "" };
        const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return (
            <Card className="border shadow-none overflow-hidden p-0 gap-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 py-2.5 px-4 flex flex-row items-center justify-between border-b gap-0">
                    <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold uppercase tracking-wider", cfg.color)}>
                            {title}
                        </span>
                        <span className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full font-medium">
                            {roots.length} Head{roots.length !== 1 && "s"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                        <div>
                            <span className="text-xs text-muted-foreground mr-1">Dr:</span>
                            <span className="font-semibold text-sm text-emerald-600">{currencySymbol} {fmt(totalCategoryDebit)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground mr-1">Cr:</span>
                            <span className="font-semibold text-sm text-red-600">{currencySymbol} {fmt(totalCategoryCredit)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground mr-1">Bal:</span>
                            <span className="font-semibold text-sm">{currencySymbol} {fmt(totalCategoryBalance)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {visibleNodes.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No accounts found in this category.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <th className="py-2 px-4 text-left w-24">Code</th>
                                        <th className="py-2 px-4 text-left">Account Name</th>
                                        <th className="py-2 px-4 text-right w-32">Debit</th>
                                        <th className="py-2 px-4 text-right w-32">Credit</th>
                                        <th className="py-2 px-4 text-right w-32">Balance</th>
                                        <th className="py-2 px-4 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {visibleNodes.map((node) => {
                                        const hasChildren = node.children.length > 0;
                                        const isExpanded = expandedNodes.has(node.id);
                                        const paddingLeft = node.level * 24 + 16;
                                        const isInactive = node.is_active === false;

                                        return (
                                            <tr
                                                key={node.id}
                                                className={cn(
                                                    "hover:bg-muted/40 transition-colors",
                                                    node.level === 0 ? "font-semibold bg-muted/5 text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <td className="py-2 px-4 font-mono text-xs text-muted-foreground align-middle">
                                                    {node.code}
                                                </td>
                                                <td className="py-2 px-4 align-middle" style={{ paddingLeft: `${paddingLeft}px` }}>
                                                    <div className="flex items-center gap-1.5">
                                                        {hasChildren ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleNode(node.id)}
                                                                className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground shrink-0"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="w-4.5 shrink-0" />
                                                        )}
                                                        
                                                        {hasChildren ? (
                                                            isExpanded ? (
                                                                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                                                            ) : (
                                                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                                            )
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                                        )}

                                                        <span className={cn("truncate", isInactive && "line-through opacity-50")}>
                                                            {node.name}
                                                        </span>

                                                        {node.is_protected && (
                                                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 shrink-0">
                                                                🔒 Protected
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono align-middle">
                                                    {node.debit > 0 ? (
                                                        <span className="text-emerald-600">{currencySymbol} {node.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono align-middle">
                                                    {node.credit > 0 ? (
                                                        <span className="text-red-600">{currencySymbol} {node.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono font-semibold align-middle">
                                                    <span className={node.balance > 0 ? "text-emerald-600" : node.balance < 0 ? "text-red-600" : "text-muted-foreground"}>
                                                        {currencySymbol} {node.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 text-right align-middle">
                                                    <div className="flex justify-end gap-1">
                                                        {node.is_protected ? (
                                                            <span className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground" title="Protected account">
                                                                <Lock className="w-3.5 h-3.5" />
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => onEdit(node)}
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => onDelete(node)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
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
        );
    };

    return (
        <>
            <AppHeader fixed />

            <main className="space-y-6">
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
                    {[
                        {
                            label: "Total Debit",
                            value: (trialBalanceData?.total_debit ?? 0),
                            icon: TrendingUp,
                            grad: "from-emerald-500 to-teal-500",
                            sub: "Sum of all debit balances"
                        },
                        {
                            label: "Total Credit",
                            value: (trialBalanceData?.total_credit ?? 0),
                            icon: TrendingDown,
                            grad: "from-rose-500 to-red-500",
                            sub: "Sum of all credit balances"
                        },
                        {
                            label: "Net Balance",
                            value: ((trialBalanceData?.total_debit ?? 0) - (trialBalanceData?.total_credit ?? 0)),
                            icon: Scale,
                            grad: "from-violet-500 to-purple-500",
                            sub: "Debit - Credit balance"
                        }
                    ].map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("p-2 bg-gradient-to-br rounded-lg shadow-lg", card.grad)}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="text-2xl font-bold">
                                        {currencySymbol} {card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-3 rounded-lg border">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-background"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={expandAll} className="h-9">
                            Expand All
                        </Button>
                        <Button variant="outline" size="sm" onClick={collapseAll} className="h-9">
                            Collapse All
                        </Button>
                        <Link to="/dashboard/accounting/accounts/print">
                            <Button variant="outline" size="sm" className="h-9">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Categories Trees */}
                {isFetching ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
                        Loading Chart of Accounts...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {renderCategorySection("Assets", assetsTree, "ASSET")}
                        {renderCategorySection("Liabilities", liabilitiesTree, "LIABILITY")}
                        {renderCategorySection("Equity", equityTree, "EQUITY")}
                        {renderCategorySection("Income", incomeTree, "INCOME")}
                        {renderCategorySection("Expenses", expenseTree, "EXPENSE")}
                    </div>
                )}
            </main>
        </>
    );
}
