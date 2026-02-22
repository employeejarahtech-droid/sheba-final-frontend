
"use client";

import { useEffect, useState } from "react";
import React from "react";
import { Plus, ChevronsUpDown, Check } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from '@tanstack/react-router';

// Helper Components
import CreateExpenseHeadForm from "./components/CreateExpenseHead";
import CreateIncomeHeadForm from "./components/CreateIncomeHead";

import { DataTable } from "@/components/DataTable";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    useGetAccountingAccountsQuery,
    useLazyGetAccountingAccountsQuery,
    useAddAccountingAccountMutation,
    useUpdateAccountingAccountMutation,
    useGetTrialBalanceQuery,
} from "@/features/accounting/accountingQueries";
import { ChartOfAccount } from "@/types/accounting.types";
import { toast } from "sonner";
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

type CreateAccountFormValues = {
    name: string;
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    parent_id?: string;
};

function ChartOfAccounts() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

    const setPage = (newPage: number) => {
        navigate({
            to: '.',
            search: (prev: any) => ({ ...prev, page: newPage }),
        });
    };

    const setLimit = (newLimit: number) => {
        navigate({
            to: '.',
            search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }),
        });
    };

    const setSearch = (newSearch: string) => {
        navigate({
            to: '.',
            search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }),
        });
    };

    const { data: accountsData, isFetching } = useGetAccountingAccountsQuery({ page, limit, search });
    const { data: trialBalanceData } = useGetTrialBalanceQuery();

    // Create a map of account balances from trial balance
    const balanceMap = React.useMemo(() => {
        const map = new Map<string, { debit: number; credit: number; balance: number }>();
        const items = trialBalanceData?.data;
        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const debit = parseFloat(item.debit) || 0;
                const credit = parseFloat(item.credit) || 0;
                map.set(item.account, {
                    debit,
                    credit,
                    balance: debit - credit,
                });
            });
        }
        return map;
    }, [trialBalanceData]);

    // Merge accounts with their balances
    const accountsWithBalances = React.useMemo(() => {
        return accountsData?.data?.map((account) => {
            const balance = balanceMap.get(account.name);
            return {
                ...account,
                debit: balance?.debit,
                credit: balance?.credit,
                balance: balance?.balance,
            };
        }) || [];
    }, [accountsData, balanceMap]);

    const { mutateAsync: addAccountingAccount, isPending: isAdding } = useAddAccountingAccountMutation();
    const { mutateAsync: updateAccountingAccount, isPending: isUpdating } = useUpdateAccountingAccountMutation();

    const isLoading = isAdding || isUpdating;

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateAccountFormValues>({
        defaultValues: { name: "", code: "", type: undefined, parent_id: undefined },
    });

    const onSubmit = async (values: CreateAccountFormValues) => {
        const payload: any = { name: values.name, code: values.code, type: values.type };
        if (values.parent_id) payload.parent_id = Number(values.parent_id);

        try {
            if (editingAccount) {
                const res = await updateAccountingAccount({ id: editingAccount.id, body: payload });
                // We assume the API returns the standard ListResponse or similar structure
                // Adjust per actual API response if needed. Assuming res.status exists.
                if ((res as any).status) {
                    toast.success((res as any).message || "Account updated successfully");
                }
            } else {
                const res = await addAccountingAccount(payload);
                if ((res as any).status) {
                    toast.success((res as any).message || "Account created successfully");
                }
            }
            reset();
            setEditingAccount(null);
            setIsOpen(false);
            // refetch is not strictly needed if invalidation works, but good for safety
            // refetch(); 
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Account operation failed");
            console.error("Account operation failed", error);
        }
    };

    const onEdit = (account: ChartOfAccount) => {
        setEditingAccount(account);
        setValue("name", account.name);
        setValue("code", account.code);
        // @ts-ignore
        setValue("type", account.type.toUpperCase() as any);
        setValue("parent_id", account.parent ? String(account.parent) : undefined);
        setIsOpen(true);
    };


    const ParentAccountSelect = ({ control }: { control: any }) => {
        const [query, setQuery] = useState("");
        const [searchAccounts, setSearchAccounts] = useState<ChartOfAccount[]>([]);
        const [open, setOpen] = useState(false);

        // This simulates the lazy query usage. 
        // In TanStack Query we called useLazy... which returns [trigger, result]
        const [fetchAccounts] = useLazyGetAccountingAccountsQuery();

        useEffect(() => {
            const timeout = setTimeout(() => {
                fetchAccounts({ page: 1, limit: 10, search: query })
                    .then((res: any) => setSearchAccounts(res?.data || []));
            }, 300);
            return () => clearTimeout(timeout);
        }, [query]);

        return (
            <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? searchAccounts.find(acc => String(acc.id) === field.value)?.name : (field.value || "Root account")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search parent account..." value={query} onValueChange={setQuery} />
                                <CommandEmpty>No account found.</CommandEmpty>
                                <CommandGroup>
                                    {searchAccounts.map(acc => (
                                        <CommandItem
                                            key={acc.id}
                                            value={`${acc.code} ${acc.name}`}
                                            onSelect={() => { setOpen(false); field.onChange(String(acc.id)); }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", field.value === String(acc.id) ? "opacity-100" : "opacity-0")} />
                                            {acc.code} — {acc.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            />
        );
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
                return `
                    <div class="flex items-center" style="padding-left: ${padding}px">
                        ${prefix}
                        <span class="${fontClass}">${row.name}</span>
                    </div>
                `;
            },
        },
        {
            data: "type",
            title: "Type",
            render: (_data: any) => `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">${_data || ''}</span>`
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
                const balanceClass = balance > 0
                    ? "text-emerald-600"
                    : balance < 0
                        ? "text-red-600"
                        : "text-muted-foreground";
                return `<div class="font-semibold ${balanceClass}">${balance.toFixed(2)}</div>`;
            },
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            className: "text-right",
            render: (_data: any, _type: string, row: ChartOfAccount) => {
                return `
                    <div class="flex justify-end gap-2">
                        <button class="edit-account-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9" data-id="${row.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                    </div>
                `;
            },
        },
    ];

    // Effect to handle jQuery delegated clicks for edit button
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

    return (
        <div className="space-y-6">
            <AppHeader fixed />
              
            <main className='p-6 lg:p-10'>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
                        <p className="text-muted-foreground">Manage your financial head hierarchy.</p>
                    </div>
                    <div className="flex gap-2">
                        <CreateIncomeHeadForm />
                        <CreateExpenseHeadForm />

                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger onClick={() => {
                                reset();
                                setEditingAccount(null);
                            }} asChild>
                                <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-violet-500/40 active:translate-y-0 active:shadow-none">
                                    <Plus className="h-4 w-4" />  Add Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
                                    <DialogDescription>Create or update an account head.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Account Name</Label>
                                        <Controller name="name" control={control} rules={{ required: "Account name is required" }} render={({ field }) => <Input {...field} />} />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Code</Label>
                                            <Controller name="code" control={control} rules={{ required: "Code is required" }} render={({ field }) => <Input {...field} />} />
                                            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Type</Label>
                                            <Controller name="type" control={control} rules={{ required: "Type is required" }} render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ASSET">Asset</SelectItem>
                                                        <SelectItem value="LIABILITY">Liability</SelectItem>
                                                        <SelectItem value="EQUITY">Equity</SelectItem>
                                                        <SelectItem value="INCOME">Income</SelectItem>
                                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                                        </div>

                                        {/* PARENT ACCOUNT */}
                                        <div className="grid gap-2">
                                            <Label>Parent Account (Optional)</Label>
                                            <ParentAccountSelect control={control} />
                                        </div>


                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditingAccount(null); }}>Cancel</Button>
                                        <Button type="submit" disabled={isLoading}>{editingAccount ? "Update" : "Create"}</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="py-6">
                    <CardHeader><CardTitle>Accounts List</CardTitle></CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
