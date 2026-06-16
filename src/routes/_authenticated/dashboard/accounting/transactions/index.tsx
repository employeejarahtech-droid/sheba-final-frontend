
"use client";

import { useState, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search, Calendar as CalendarIcon, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRangePicker } from "@/components/ui/date-range-picker";

import { useAddTransactionMutation, useGetJournalReportQuery } from "@/features/accounting/accountingQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CreateTransactionInput } from "@/types/accounting.types";
import type { DateRange } from "react-day-picker";
import { AppHeader } from "@/components/layout/app-header";


export const Route = createFileRoute('/_authenticated/dashboard/accounting/transactions/')({
    component: Transactions,
})

function Transactions() {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Filter Query States
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("ALL");

    const { data: journalData, isLoading } = useGetJournalReportQuery({
        page: 1,
        limit: 10,
        search: searchQuery || undefined,
        from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    });

    const journalEntries = journalData?.data || [];
    const { mutateAsync: addTransaction, isPending: isAdding } = useAddTransactionMutation();

    const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateTransactionInput>({
        defaultValues: {
            type: undefined,
            amount: undefined,
            payment_mode: undefined,
            date: format(new Date(), "yyyy-MM-dd"),
            description: "",
        },
    });

    const onSubmit = async (data: CreateTransactionInput) => {
        try {
            await addTransaction(data);
            toast.success("Transaction created successfully");
            setIsOpen(false);
            reset({
                type: undefined,
                amount: undefined,
                payment_mode: undefined,
                date: format(new Date(), "yyyy-MM-dd"),
                description: "",
            });
        } catch (error) {
            toast.error("Failed to create transaction");
            console.error(error);
        }
    };

    const clearFilters = () => {
        setDateRange(undefined);
        setSearchQuery("");
        setFilterType("ALL");
    };

    const hasActiveFilters = dateRange || searchQuery || filterType !== "ALL";

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getEntryTotal = (entry: any, field: 'debit' | 'credit') => {
        return (entry.entries || []).reduce((sum: number, line: any) => sum + Number(line[field] || 0), 0);
    };

    const getReferenceTypeBadge = (refType?: string) => {
        switch (refType) {
            case 'TRANSACTION':
                return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Transaction</Badge>;
            case 'MANUAL':
                return <Badge variant="secondary">Manual</Badge>;
            case 'INVOICE':
                return <Badge variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-0">Invoice</Badge>;
            default:
                return <Badge variant="outline">{refType || "N/A"}</Badge>;
        }
    };

    return (
        <>
            <AppHeader fixed />

            <main className='p-4'>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
                        <p className="text-muted-foreground">View all double-entry journal records.</p>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="h-4 w-4" /> New Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Transaction</DialogTitle>
                                <DialogDescription>
                                    Enter the details of the transaction below.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Transaction Type <span className="text-red-500">*</span></Label>
                                            <Controller
                                                name="type"
                                                control={control}
                                                rules={{ required: "Type is required" }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger
                                                            className={cn("w-full", errors.type && "border-red-500")}
                                                        >
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SALES">Sales</SelectItem>
                                                            <SelectItem value="PURCHASE">Purchase</SelectItem>
                                                            <SelectItem value="EXPENSE">Expense</SelectItem>
                                                            <SelectItem value="INCOME">Income</SelectItem>
                                                            <SelectItem value="JOURNAL">Journal</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                                            <p className="text-[0.8rem] text-muted-foreground">
                                                Sales: Dr Cash / Cr Sales
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date <span className="text-red-500">*</span></Label>
                                            <Controller
                                                name="date"
                                                control={control}
                                                rules={{ required: "Date is required" }}
                                                render={({ field }) => (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !field.value && "text-muted-foreground",
                                                                    errors.date && "border-red-500"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <CalendarComponent
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                            {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Amount <span className="text-red-500">*</span></Label>
                                            <Controller
                                                name="amount"
                                                control={control}
                                                rules={{ required: "Amount is required", min: { value: 0.01, message: "Amount must be greater than 0" } }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder="0.00"
                                                        className={cn(errors.amount && "border-red-500")}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                    />
                                                )}
                                            />
                                            {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Mode <span className="text-red-500">*</span></Label>
                                            <Controller
                                                name="payment_mode"
                                                control={control}
                                                rules={{ required: "Mode is required" }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className={cn("w-full", errors.payment_mode && "border-red-500")}>
                                                            <SelectValue placeholder="Select mode" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CASH">Cash</SelectItem>
                                                            <SelectItem value="BANK">Bank</SelectItem>
                                                            <SelectItem value="DUE">Due</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.payment_mode && <p className="text-red-500 text-xs">{errors.payment_mode.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description <span className="text-red-500">*</span></Label>
                                        <Controller
                                            name="description"
                                            control={control}
                                            rules={{ required: "Description is required" }}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter transaction details..."
                                                    className={cn(errors.description && "border-red-500")}
                                                />
                                            )}
                                        />
                                        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)} type="button">Cancel</Button>
                                    <Button type="submit" disabled={isAdding}>
                                        {isAdding ? "Saving..." : "Save Transaction"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm mt-6">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search journal entries..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            placeholder="Pick a date range"
                            className="w-[240px]"
                            numberOfMonths={2}
                        />

                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg bg-card mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Narration</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : journalEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No journal entries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                journalEntries.map((entry) => {
                                    const totalDebit = getEntryTotal(entry, 'debit');
                                    const totalCredit = getEntryTotal(entry, 'credit');
                                    const isExpanded = expandedRows.has(entry.id);

                                    return (
                                        <Fragment key={entry.id}>
                                            <TableRow
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => toggleRow(entry.id)}
                                            >
                                                <TableCell>
                                                    {isExpanded ?
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" /> :
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {entry.date ? format(new Date(entry.date), "dd MMM yyyy") : "-"}
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate">
                                                    {entry.narration || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getReferenceTypeBadge(entry.reference_type)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {totalDebit.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {totalCredit.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow key={`${entry.id}-detail`}>
                                                    <TableCell colSpan={6} className="bg-muted/30 p-0">
                                                        <div className="p-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                                <div>
                                                                    <span className="text-muted-foreground">Journal ID</span>
                                                                    <p className="font-medium">#{entry.id}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Reference</span>
                                                                    <p className="font-medium">{entry.reference_type || "-"} {entry.reference_id ? "#${entry.reference_id}" : ""}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Created</span>
                                                                    <p className="font-medium">{entry.created_at ? format(new Date(entry.created_at), "dd MMM yyyy HH:mm") : "-"}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Balance Check</span>
                                                                    <p className={cn("font-medium", totalDebit === totalCredit ? "text-emerald-600" : "text-red-600")}>
                                                                        {totalDebit === totalCredit ? "Balanced" : "Unbalanced"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Journal Lines */}
                                                            <div className="border rounded-lg overflow-hidden">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Account</TableHead>
                                                                            <TableHead>Code</TableHead>
                                                                            <TableHead className="text-right">Debit</TableHead>
                                                                            <TableHead className="text-right">Credit</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {(entry.entries || []).map((line: any) => (
                                                                            <TableRow key={line.id}>
                                                                                <TableCell className="font-medium">{line.account?.name || "-"}</TableCell>
                                                                                <TableCell className="font-mono text-sm text-muted-foreground">{line.account?.code || "-"}</TableCell>
                                                                                <TableCell className="text-right">
                                                                                    {Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : '-'}
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    {Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : '-'}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                        <TableRow className="bg-muted/50 font-semibold">
                                                                            <TableCell colSpan={2}>Total</TableCell>
                                                                            <TableCell className="text-right">{totalDebit.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right">{totalCredit.toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </>
    );
}
