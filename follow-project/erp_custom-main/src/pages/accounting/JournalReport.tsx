"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown, CornerDownRight } from "lucide-react";
import { useAddJournalEntryMutation, useGetAccountingAccountsQuery, useGetJournalReportQuery } from "@/store/features/accounting/accoutntingApiService";
import { toast } from "sonner";

export default function JournalReport() {
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Last day of current month
    });
    const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

    // API Hooks
    const { data: accountsData } = useGetAccountingAccountsQuery({ limit: 1000 });
    const { data: reportData, isLoading: isReportLoading } = useGetJournalReportQuery({
        limit: 100,
        from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    });
    const [addJournalEntry, { isLoading }] = useAddJournalEntryMutation();

    // New Entry Form State
    const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
    const [narration, setNarration] = useState("");
    const [rows, setRows] = useState<{ account_id: string; debit: number; credit: number }[]>([
        { account_id: "", debit: 0, credit: 0 },
        { account_id: "", debit: 0, credit: 0 },
    ]);

    const handleAddRow = () => {
        setRows([...rows, { account_id: "", debit: 0, credit: 0 }]);
    };

    const handleRemoveRow = (index: number) => {
        if (rows.length > 2) {
            const newRows = [...rows];
            newRows.splice(index, 1);
            setRows(newRows);
        }
    };

    const handleRowChange = (index: number, field: string, value: any) => {
        const newRows = [...rows];
        // @ts-ignore
        newRows[index][field] = value;
        setRows(newRows);
    };

    const AccountCombobox = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
        const [open, setOpen] = useState(false);
        const accounts = accountsData?.data || [];

        // Sort or organize accounts if needed. Assuming API returns them in a way that respects hierarchy or we use level.
        // If sorting by code helps:
        // const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

        return (
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value
                            ? accounts.find((acc) => String(acc.id) === value)?.name
                            : "Select account..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search account..." />
                        <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                            <CommandEmpty>No account found.</CommandEmpty>
                            <CommandGroup>
                                {accounts.map((acc) => {
                                    // @ts-ignore
                                    const level = acc.level || 0;

                                    return (
                                        <CommandItem
                                            key={acc.id}
                                            value={acc.name}
                                            onSelect={() => {
                                                onChange(String(acc.id));
                                                setOpen(false);
                                            }}
                                            className="flex items-center gap-2"
                                            style={{ paddingLeft: `${level === 0 ? 12 : (level * 20) + 12}px` }}
                                        >
                                            <div className="flex items-center flex-1 gap-2">
                                                <div className="flex items-center gap-1">
                                                    {level > 0 && (
                                                        <CornerDownRight className="h-3 w-3 text-muted-foreground stroke-[1.5]" />
                                                    )}

                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            level === 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {acc.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/70">{acc.code}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    value === String(acc.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };

    const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit), 0);
    const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Journal Report</h2>
                    <p className="text-muted-foreground">Chronological record of all financial transactions.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Add New Entry Button */}
                    <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="mr-2 h-4 w-4" /> New Journal Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Create New Journal Entry</DialogTitle>
                                <DialogDescription>
                                    Record a manual journal entry. Ensure Total Debit equals Total Credit.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !entryDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={entryDate}
                                                    onSelect={setEntryDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Narration / Reference</Label>
                                        <Input
                                            placeholder="e.g. Adjustment for depreciation"
                                            value={narration}
                                            onChange={(e) => setNarration(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="border rounded-md p-4 bg-muted/20 space-y-4">
                                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground mb-2">
                                        <div className="col-span-5">Account</div>
                                        <div className="col-span-3 text-right">Debit</div>
                                        <div className="col-span-3 text-right">Credit</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {rows.map((row, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-5">
                                                <AccountCombobox
                                                    value={row.account_id}
                                                    onChange={(val) => handleRowChange(index, "account_id", val)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    className="text-right"
                                                    placeholder="0.00"
                                                    value={row.debit === 0 ? '' : row.debit}
                                                    onChange={(e) => handleRowChange(index, "debit", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    className="text-right"
                                                    placeholder="0.00"
                                                    value={row.credit === 0 ? '' : row.credit}
                                                    onChange={(e) => handleRowChange(index, "credit", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveRow(index)}
                                                    disabled={rows.length <= 2}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-2">
                                        <Plus className="mr-2 h-3.5 w-3.5" /> Add Row
                                    </Button>
                                </div>

                                <div className="flex justify-end gap-6 px-4 font-semibold text-sm">
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Total Debit:</span>
                                        <span>{totalDebit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Total Credit:</span>
                                        <span>{totalCredit.toFixed(2)}</span>
                                    </div>
                                    <div className={cn("flex gap-2", isBalanced ? "text-emerald-600" : "text-destructive")}>
                                        <span>Difference:</span>
                                        <span>{(totalDebit - totalCredit).toFixed(2)}</span>
                                    </div>
                                </div>

                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewEntryOpen(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={!isBalanced || isLoading}
                                    onClick={async () => {
                                        if (!entryDate || !isBalanced) return;

                                        try {
                                            const payload = {
                                                date: format(entryDate, 'yyyy-MM-dd'),
                                                narration,
                                                entries: rows.map(r => ({
                                                    account_id: Number(r.account_id),
                                                    debit: r.debit,
                                                    credit: r.credit
                                                }))
                                            };

                                            await addJournalEntry(payload).unwrap();
                                            toast.success("Journal entry created successfully");
                                            setIsNewEntryOpen(false);
                                            // Reset form
                                            setEntryDate(new Date());
                                            setNarration("");
                                            setRows([
                                                { account_id: "", debit: 0, credit: 0 },
                                                { account_id: "", debit: 0, credit: 0 },
                                            ]);
                                        } catch (error) {
                                            console.error("Failed to create entry:", error);
                                            toast.error("Failed to create journal entry");
                                        }
                                    }}
                                >
                                    {isLoading ? "Saving..." : "Save Entry"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[140px] justify-start text-left font-normal",
                                        !dateRange.from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? format(dateRange.from, "PP") : <span>From Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={dateRange.from}
                                    onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <span className="text-muted-foreground">-</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[140px] justify-start text-left font-normal",
                                        !dateRange.to && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.to ? format(dateRange.to, "PP") : <span>To Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={dateRange.to}
                                    onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {isReportLoading ? (
                    <div className="text-center py-10">Loading journal entries...</div>
                ) : (
                    reportData?.data?.map((entry) => (
                        <Card key={entry.id} className="overflow-hidden border-2 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-emerald-950/30 border-b-1 border-emerald-100 dark:border-emerald-900 py-3 px-6 gap-0">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{entry.date}</span>
                                        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{entry.narration || "No Narration"}</span>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1">
                                        {entry.reference_type} #{entry.id}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="w-[50%] py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Account Name</TableHead>
                                            <TableHead className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Debit</TableHead>
                                            <TableHead className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Credit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entry.entries.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-medium py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 dark:text-gray-100">{row.account?.name}</span>
                                                        <span className="text-xs text-muted-foreground mt-0.5">Code: {row.account?.code}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4 px-6 font-mono text-gray-800 dark:text-gray-200">
                                                    {Number(row.debit) > 0 ? (
                                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{Number(row.debit).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-4 px-6 font-mono text-gray-800 dark:text-gray-200">
                                                    {Number(row.credit) > 0 ? (
                                                        <span className="text-green-600 dark:text-green-400 font-semibold">{Number(row.credit).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Footer for Check */}
                                        <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-t-2 border-emerald-200 dark:border-emerald-800 font-bold">
                                            <TableCell className="py-4 px-6 text-gray-800 dark:text-gray-100">Total</TableCell>
                                            <TableCell className="text-right py-4 px-6 font-mono text-blue-700 dark:text-blue-300 text-base">
                                                {entry.entries.reduce((sum, item) => sum + Number(item.debit), 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right py-4 px-6 font-mono text-green-700 dark:text-green-300 text-base">
                                                {entry.entries.reduce((sum, item) => sum + Number(item.credit), 0).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
