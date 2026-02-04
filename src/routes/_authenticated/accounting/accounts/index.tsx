
"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, ChevronsUpDown, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from '@tanstack/react-router';

// Helper Components
import CreateExpenseHeadForm from "./components/CreateExpenseHead";
import CreateIncomeHeadForm from "./components/CreateIncomeHead";

import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm, Controller } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    useGetAccountingAccountsQuery,
    useLazyGetAccountingAccountsQuery,
    useAddAccountingAccountMutation,
    useUpdateAccountingAccountMutation,
} from "@/features/accounting/accountingQueries";
import { ChartOfAccount } from "@/types/accounting.types";
import { toast } from "sonner";
import { TopNav } from "@/components/layout/top-nav";
import { topNav } from "@/data/data";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Header } from "@/components/layout/header";

export const Route = createFileRoute('/_authenticated/accounting/accounts/')({
    component: ChartOfAccounts,
})

type CreateAccountFormValues = {
    name: string;
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    parent_id?: string;
};

function ChartOfAccounts() {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(200);
    const [search, setSearch] = useState("");
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

    const { data: accountsData, isFetching } = useGetAccountingAccountsQuery({ page, limit, search });

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

    const accountColumns: ColumnDef<ChartOfAccount>[] = [
        { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span> },
        {
            accessorKey: "name",
            header: "Account Name",
            cell: ({ row }) => (
                <div className="flex items-center" style={{ paddingLeft: `${(row.original.level || 0) * 20}px` }}>
                    {(row.original.level || 0) > 0 && <span className="mr-2 text-muted-foreground">└─</span>}
                    <span className={(row.original.level || 0) === 0 ? "font-semibold" : ""}>{row.original.name}</span>
                </div>
            ),
        },
        { accessorKey: "type", header: "Type", cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge> },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Header fixed>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
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
                                    <Plus className="mr-2 h-4 w-4" />  Add Account
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
                            data={accountsData?.data || []}
                            pageIndex={page - 1}
                            pageSize={limit}
                            // @ts-ignore
                            totalCount={accountsData?.pagination?.total || 0}
                            onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                            onSearch={(value) => { setSearch(value); setPage(1); }}
                            isFetching={isFetching}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
