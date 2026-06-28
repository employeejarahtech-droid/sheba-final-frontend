
"use client";

import { useState, Fragment, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search, Calendar as CalendarIcon, X, Plus, ChevronDown, ChevronUp, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

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

import { useAddTransactionMutation, useGetJournalReportQuery, useAddJournalEntryMutation } from "@/features/accounting/accountingQueries";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";
import { useDateFormat } from "@/hooks/use-date-format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CreateTransactionInput } from "@/types/accounting.types";
import type { DateRange } from "react-day-picker";
import { AppHeader } from "@/components/layout/app-header";


const transactionsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/transactions/')({
    validateSearch: (search) => transactionsSearchSchema.parse(search),
    component: Transactions,
})

function Transactions() {
    const { formatDate, toISODate } = useDateFormat();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasPage = urlParams.has('page');
        const hasLimit = urlParams.has('limit');
        const hasSearch = urlParams.has('search');
        const hasFrom = urlParams.has('from');
        const hasTo = urlParams.has('to');

        if (!hasPage || !hasLimit || !hasSearch || !hasFrom || !hasTo) {
            navigate({
                to: '.',
                replace: true,
                search: (prev: any) => ({
                    page: prev?.page ?? 1,
                    limit: prev?.limit ?? 10,
                    search: prev?.search ?? '',
                    from: prev?.from ?? '',
                    to: prev?.to ?? '',
                })
            });
        }
    }, [navigate]);

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };

    // Filter Query States driven by URL
    const dateRange = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
    };
    const setDateRange = (range: DateRange | undefined) => {
        navigate({
            to: '.',
            search: (prev: any) => ({
                ...prev,
                from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
                to: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
                page: 1
            })
        });
    };

    const [searchVal, setSearchVal] = useState(search);
    useEffect(() => {
        setSearchVal(search);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchVal !== search) {
                navigate({ to: '.', search: (prev: any) => ({ ...prev, search: searchVal, page: 1 }) });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchVal, search, navigate]);

    const { data: journalData, isLoading } = useGetJournalReportQuery({
        page,
        limit,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
    });

    const journalEntries = journalData?.data || [];
    const { mutateAsync: addJournalEntry, isPending: isAddingJournal } = useAddJournalEntryMutation();

    // Double Entry Form States
    const [narration, setNarration] = useState("");
    const [entryDate, setEntryDate] = useState<string>(toISODate(new Date()));
    const [journalLines, setJournalLines] = useState<Array<{ accountId: number | null; debit: number; credit: number }>>([
        { accountId: null, debit: 0, credit: 0 },
        { accountId: null, debit: 0, credit: 0 },
    ]);

    const addLine = () => {
        setJournalLines(prev => [...prev, { accountId: null, debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (journalLines.length <= 2) return;
        setJournalLines(prev => prev.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        setJournalLines(prev => prev.map((line, i) => {
            if (i === index) {
                const updated = { ...line, [field]: value };
                if (field === 'debit' && Number(value) > 0) {
                    updated.credit = 0;
                } else if (field === 'credit' && Number(value) > 0) {
                    updated.debit = 0;
                }
                return updated;
            }
            return line;
        }));
    };

    const totalDebit = journalLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleJournalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!narration.trim()) {
            toast.error("Narration is required");
            return;
        }
        if (!isBalanced) {
            toast.error("Debits and credits must balance and be greater than 0");
            return;
        }

        const formattedEntries = journalLines
            .filter(line => line.accountId !== null && (Number(line.debit) > 0 || Number(line.credit) > 0))
            .map(line => ({
                account_id: line.accountId!,
                debit: Number(line.debit) || 0,
                credit: Number(line.credit) || 0
            }));

        if (formattedEntries.length < 2) {
            toast.error("At least two valid journal lines are required");
            return;
        }

        try {
            await addJournalEntry({
                date: entryDate,
                narration,
                entries: formattedEntries
            });
            toast.success("Journal Entry created successfully");
            setIsOpen(false);
            // Reset state
            setNarration("");
            setEntryDate(toISODate(new Date()));
            setJournalLines([
                { accountId: null, debit: 0, credit: 0 },
                { accountId: null, debit: 0, credit: 0 },
            ]);
        } catch (error: any) {
            toast.error(error?.message || "Failed to create journal entry");
        }
    };

    const clearFilters = () => {
        navigate({
            to: '.',
            search: (prev: any) => ({
                ...prev,
                from: '',
                to: '',
                search: '',
                page: 1
            })
        });
    };

    const hasActiveFilters = !!(from || to || search);

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
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                <Plus className="h-4 w-4 mr-2" /> New Journal Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Journal Entry</DialogTitle>
                                <DialogDescription>
                                    Record a double-entry transaction. Debits and credits must balance.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleJournalSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 md:col-span-1">
                                        <Label>Date <span className="text-red-500">*</span></Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {entryDate ? formatDate(new Date(entryDate)) : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={entryDate ? new Date(entryDate) : undefined}
                                                    onSelect={(d) => setEntryDate(d ? toISODate(d) : "")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Narration / Description <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Enter entry description..."
                                            value={narration}
                                            onChange={(e) => setNarration(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">Journal Lines</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addLine}
                                            className="text-xs"
                                        >
                                            <Plus className="h-3 h-3 mr-1" /> Add Row
                                        </Button>
                                    </div>

                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[50%]">Account Head</TableHead>
                                                    <TableHead className="text-right w-[20%]">Debit</TableHead>
                                                    <TableHead className="text-right w-[20%]">Credit</TableHead>
                                                    <TableHead className="w-[10%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {journalLines.map((line, index) => (
                                                    <TableRow key={index} className="hover:bg-transparent">
                                                        <TableCell className="p-2">
                                                            <NestedAccountSelect
                                                                value={line.accountId}
                                                                onChange={(id) => updateLine(index, 'accountId', id)}
                                                                placeholder="Select account"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-right">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                className="text-right font-mono"
                                                                value={line.debit || ""}
                                                                onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-right">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                className="text-right font-mono"
                                                                value={line.credit || ""}
                                                                onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-700 disabled:opacity-30"
                                                                onClick={() => removeLine(index)}
                                                                disabled={journalLines.length <= 2}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                                {/* Totals Row */}
                                                <TableRow className="bg-muted/30 font-semibold">
                                                    <TableCell className="text-right pr-4">Total</TableCell>
                                                    <TableCell className="text-right font-mono pr-3">
                                                        {totalDebit.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono pr-3">
                                                        {totalCredit.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                    {isBalanced ? (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-3 py-1 font-medium">
                                            Balanced
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="px-3 py-1 font-medium">
                                            Unbalanced (Diff: {Math.abs(totalDebit - totalCredit).toFixed(2)})
                                        </Badge>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsOpen(false)} type="button">Cancel</Button>
                                    <Button type="submit" disabled={isAddingJournal || !isBalanced} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {isAddingJournal ? "Posting..." : "Post Journal Entry"}
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
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
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
                                                    {entry.date ? formatDate(new Date(entry.date)) : "-"}
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

                {/* Pagination Footer */}
                {journalData?.pagination && (
                    <div className="flex items-center justify-between mt-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rows per page:</span>
                            <Select
                                value={String(limit)}
                                onValueChange={(val) => setLimit(Number(val))}
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="ml-4">
                                Showing {journalData.pagination.total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, journalData.pagination.total)} of {journalData.pagination.total} entries
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {journalData.pagination.totalPage || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= (journalData.pagination.totalPage || 1)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
