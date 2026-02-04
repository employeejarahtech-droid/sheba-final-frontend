/* eslint-disable @typescript-eslint/no-explicit-any */

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

import CreateExpenseHeadForm from "./CreateExpenseHead";
import CreateIncomeHeadForm from "./CreateIncomeHead";

import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm, Controller } from "react-hook-form";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    type ChartOfAccount,
    useGetAccountingAccountsQuery,
    useLazyGetAccountingAccountsQuery,
    useAddAccountingAccountMutation,
    useUpdateAccountingAccountMutation,
    // useDeleteAccountingAccountMutation
} from "@/store/features/accounting/accoutntingApiService";
import { toast } from "sonner";

type CreateAccountFormValues = {
    name: string;
    code: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    parent_id?: string;
};

export default function ChartOfAccounts() {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(200);
    const [search, setSearch] = useState("");
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

    const { data, isFetching, refetch } = useGetAccountingAccountsQuery({ page, limit, search });

    const [addAccountingAccount, { isLoading }] = useAddAccountingAccountMutation();
    const [updateAccountingAccount] = useUpdateAccountingAccountMutation();
    // const [deleteAccountingAccount] = useDeleteAccountingAccountMutation();

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateAccountFormValues>({
        defaultValues: { name: "", code: "", type: undefined, parent_id: undefined },
    });

    const onSubmit = async (values: CreateAccountFormValues) => {
        const payload: any = { name: values.name, code: values.code, type: values.type };
        if (values.parent_id) payload.parent_id = Number(values.parent_id);

        try {
            if (editingAccount) {
                const res = await updateAccountingAccount({ id: editingAccount.id, body: payload }).unwrap();
                if (res.status) {
                    toast.success(res.message || "Account updated successfully");
                }
            } else {
                const res = await addAccountingAccount(payload).unwrap();
                if (res.status) {
                    toast.success(res.message || "Account created successfully");
                }
            }
            reset();
            setEditingAccount(null);
            setIsOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Account operation failed");
            console.error("Account operation failed", error);
        }
    };

    const onEdit = (account: ChartOfAccount) => {
        setEditingAccount(account);
        setValue("name", account.name);
        setValue("code", account.code);
        setValue("type", account.type.toUpperCase() as any);
        setValue("parent_id", account.parent ? String(account.parent) : undefined);
        setIsOpen(true);
    };

    // const onDelete = async (id: number) => {
    //     if (confirm("Are you sure you want to delete this account?")) {
    //         await deleteAccountingAccount(id).unwrap();
    //         refetch();
    //     }
    // };

    const ParentAccountSelect = ({ control }: { control: any }) => {
        const [query, setQuery] = useState("");
        const [searchAccounts, setSearchAccounts] = useState<any[]>([]);
        const [open, setOpen] = useState(false); // control Popover open state
        // RTK Query lazy fetch
        const [fetchAccounts, { isFetching }] = useLazyGetAccountingAccountsQuery();

        useEffect(() => {
            const timeout = setTimeout(() => {
                fetchAccounts({ page: 1, limit: 10, search: query })
                    .unwrap()
                    .then(res => setSearchAccounts(res?.data || []));
            }, 300);
            return () => clearTimeout(timeout);
        }, [query, fetchAccounts]);

        return (
            <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? searchAccounts.find(acc => String(acc.id) === field.value)?.name : "Root account"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search parent account..." value={query} onValueChange={setQuery} />
                                <CommandEmpty>No account found.</CommandEmpty>
                                <CommandGroup>
                                    {isFetching ? <CommandItem disabled>Loading...</CommandItem> :
                                        searchAccounts.map(acc => (
                                            <CommandItem
                                                key={acc.id}
                                                value={`${acc.code} ${acc.name}`}
                                                onSelect={() => { setOpen(false); field.onChange(String(acc.id)); }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", field.value === String(acc.id) ? "opacity-100" : "opacity-0")} />
                                                {acc.code} — {acc.name}
                                            </CommandItem>
                                        ))
                                    }
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
                <div className="flex items-center" style={{ paddingLeft: `${row.original.level * 20}px` }}>
                    {row.original.level > 0 && <span className="mr-2 text-muted-foreground">└─</span>}
                    <span className={row.original.level === 0 ? "font-semibold" : ""}>{row.original.name}</span>
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
                    {/* <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button> */}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
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
                            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-violet-500/40 active:translate-y-0 active:shadow-none">
                                <Plus className="mr-2 h-4 w-4" />  Add Account
                            </button>
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
                        data={data?.data || []}
                        pageIndex={page - 1}
                        pageSize={limit}
                        totalCount={data?.pagination?.total || 0}
                        onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                        onSearch={(value) => { setSearch(value); setPage(1); }}
                        isFetching={isFetching}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
