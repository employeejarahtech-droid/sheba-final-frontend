
"use client";

import { useState, Fragment, useMemo } from "react";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Search, Eye, EyeOff, BookOpen, ArrowUpRight, ArrowDownLeft, Scale, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";

import { useAddJournalEntryMutation, useGetJournalReportQuery } from "@/features/accounting/accountingQueries";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrency } from "@/hooks/use-currency";
import { useDebounce } from "@/hooks/useDebounce";
import { getPageNumbers } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

const journalSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(20),
  search: z.string().catch(''),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/journal/')({
  validateSearch: (search) => journalSearchSchema.parse(search),
  component: JournalReport,
})

type FormRow = {
  id: string;
  account_id: number | null;
  account_name: string;
  debit: string;
  credit: string;
};

function JournalReport() {
  // Modal
  const [isOpen, setIsOpen] = useState(false);

  // URL search params
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 20;
  const search = searchParams?.search || "";
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const [searchInput, setSearchInput] = useState(search);

  // Helper functions to update URL params
  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFromDate = (newDate: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newDate, page: 1 }) });
  };
  const setToDate = (newDate: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newDate, page: 1 }) });
  };
  const clearFilters = () => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: '', to: '', search: '', page: 1 }) });
    setSearchInput("");
  };

  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync search input with URL param when it changes from outside
  useEffect(() => {
    if (search !== undefined && search !== searchInput) {
      setSearchInput(search);
    }
  }, [search]);

  // Handle debounced search change - push to URL
  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState("");
  const [rows, setRows] = useState<FormRow[]>([
    { id: '1', account_id: null, account_name: '', debit: '', credit: '' },
    { id: '2', account_id: null, account_name: '', debit: '', credit: '' },
  ]);

  // Queries
  const { data: journalData, isLoading } = useGetJournalReportQuery({ page, limit, search, from: fromDate, to: toDate });
  const { mutateAsync: addJournalEntry, isPending: isAdding } = useAddJournalEntryMutation();

  const totalPages = journalData?.pagination?.totalPage || 1;
  const totalItems = journalData?.pagination?.total || 0;

  const { currencySymbol } = useCurrency();

  const stats = useMemo(() => {
    const list = journalData?.data || [];
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    list.forEach((entry: any) => {
      (entry.entries || []).forEach((line: any) => {
        totalDebitSum += parseFloat(line.debit) || 0;
        totalCreditSum += parseFloat(line.credit) || 0;
      });
    });

    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;

    return [
      {
        label: "Total Journal Entries",
        value: totalItems.toLocaleString(),
        icon: BookOpen,
        grad: "from-blue-500 to-indigo-500",
        sub: "Total entries in this period",
      },
      {
        label: "Total Debits",
        value: `${currencySymbol} ${totalDebitSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: ArrowUpRight,
        grad: "from-emerald-500 to-teal-500",
        sub: "Sum of debits in loaded page",
      },
      {
        label: "Total Credits",
        value: `${currencySymbol} ${totalCreditSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: ArrowDownLeft,
        grad: "from-rose-500 to-red-500",
        sub: "Sum of credits in loaded page",
      },
      {
        label: "Ledger Status",
        value: isBalanced ? "Balanced" : "Unbalanced",
        icon: Scale,
        grad: isBalanced ? "from-violet-500 to-purple-500" : "from-amber-500 to-red-500",
        sub: "Debits vs Credits check",
      },
    ];
  }, [journalData, totalItems, currencySymbol]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Form helpers
  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), account_id: null, account_name: '', debit: '', credit: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof FormRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const calcTotals = () => {
    const td = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
    const tc = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);
    return { totalDebit: td, totalCredit: tc };
  };

  const { totalDebit, totalCredit } = calcTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("Debit and Credit must be equal!");
      return;
    }

    const validEntries = rows.filter(r => r.account_id !== null);
    if (validEntries.length < 2) {
      toast.error("At least 2 account entries are required");
      return;
    }

    try {
      await addJournalEntry({
        date: formDate,
        narration,
        entries: validEntries.map(r => ({
          account_id: Number(r.account_id),
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
        })),
      });
      toast.success("Journal Entry added successfully");
      setIsOpen(false);
      setNarration("");
      setRows([
        { id: '1', account_id: null, account_name: '', debit: '', credit: '' },
        { id: '2', account_id: null, account_name: '', debit: '', credit: '' },
      ]);
    } catch (error) {
      toast.error("Failed to add journal entry");
      console.error(error);
    }
  };

  const refTypeBadge: Record<string, { label: string; color: string }> = {
    TRANSACTION: { label: "Transaction", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" },
    MANUAL: { label: "Manual", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" },
    PROVIDER_PAYMENT: { label: "Provider Pay", color: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300" },
    ADMISSION_PAYMENT: { label: "Admission Pay", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300" },
    OUTDOOR_PAYMENT: { label: "Outdoor Pay", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300" },
  };

  const expandAll = () => {
    const allIds = new Set((journalData?.data || []).map((e: any) => e.id));
    setExpandedRows(allIds);
  };

  const collapseAll = () => setExpandedRows(new Set());

  return (
    <>
      <AppHeader fixed />
      <main className="p-4">
        <div className="space-y-3">
          <PageHeader
            title="Journal Entries"
            description="Record and review double-entry bookkeeping records."
            showBackButton={false}
            actions={
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-1" /> New Journal Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[750px] max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>New Journal Entry</DialogTitle>
                    <DialogDescription>Enter debit and credit entries for your transaction</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto px-1">
                      {/* Date & Narration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Narration</Label>
                          <Textarea placeholder="Brief description..." value={narration} onChange={(e) => setNarration(e.target.value)} required />
                        </div>
                      </div>

                      <Separator />

                      {/* Entry Rows */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Transaction Details</Label>
                          <Button type="button" onClick={addRow} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Add Row
                          </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[280px]">Account</TableHead>
                                <TableHead className="w-[120px] text-right">Debit</TableHead>
                                <TableHead className="w-[120px] text-right">Credit</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell>
                                    <NestedAccountSelect
                                      value={row.account_id}
                                      onChange={(id: number | null, account: any) => {
                                        updateRow(row.id, 'account_id', id);
                                        updateRow(row.id, 'account_name', account?.name || '');
                                      }}
                                      placeholder="Select account"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      className="text-right h-9"
                                      value={row.debit}
                                      onChange={(e) => updateRow(row.id, 'debit', e.target.value)}
                                      step="0.01"
                                      min="0"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      className="text-right h-9"
                                      value={row.credit}
                                      onChange={(e) => updateRow(row.id, 'credit', e.target.value)}
                                      step="0.01"
                                      min="0"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeRow(row.id)}
                                      disabled={rows.length <= 2}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-muted/50">
                                <TableCell className="text-right">Total</TableCell>
                                <TableCell className="text-right font-mono">{totalDebit.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{totalCredit.toFixed(2)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {/* Balance Indicator */}
                        {totalDebit !== totalCredit && (totalDebit > 0 || totalCredit > 0) && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive font-medium">
                              Entry is not balanced. Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {isBalanced && (
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Entry is balanced
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isAdding || !isBalanced}>
                        {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Entry
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 bg-gradient-to-br ${card.grad} rounded-lg shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <h3 className="text-2xl font-bold">{card.value}</h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters + Recent Entries */}
          <Card className="overflow-hidden shadow-lg border-none bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/10 hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800/30 py-5 px-6 gap-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Journal Entries</CardTitle>
                  </div>
                  <CardDescription className="text-xs ml-8 pl-0.5 text-gray-500 dark:text-gray-400">View and manage your journal entries</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0">From:</Label>
                    <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); }} className="w-32 h-8 text-xs border-0 p-0 focus-visible:ring-0" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0">To:</Label>
                    <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); }} className="w-32 h-8 text-xs border-0 p-0 focus-visible:ring-0" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search entries..."
                      className="w-36 h-8 text-xs border-0 p-0 focus-visible:ring-0 placeholder:text-gray-400"
                    />
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  {(fromDate || toDate || search) && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Expand/Collapse All */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  {totalItems} entries found
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={expandAll}>
                    <Eye className="h-3 w-3" /> Expand All
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={collapseAll}>
                    <EyeOff className="h-3 w-3" /> Collapse All
                  </Button>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-950/30">
                    <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="w-8 font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider"></TableHead>
                      <TableHead className="w-28 font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Narration</TableHead>
                      <TableHead className="w-32 font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="w-[130px] text-right font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Debit</TableHead>
                      <TableHead className="w-[130px] text-right font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40">
                          <div className="flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-sm font-medium">Loading journal entries...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (journalData?.data || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40">
                          <div className="flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                              <BookOpen className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm font-medium">No journal entries found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting your filters or add a new entry</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (journalData?.data || []).map((entry: any) => {
                        const isExpanded = expandedRows.has(entry.id);
                        const entryTotalDebit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.debit) || 0), 0);
                        const entryTotalCredit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.credit) || 0), 0);
                        const badge = refTypeBadge[entry.reference_type] || { label: entry.reference_type || '-', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };

                        return (
                           <Fragment key={entry.id}>
                            <TableRow
                              key={entry.id}
                              className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-200"
                              onClick={() => toggleRow(entry.id)}
                            >
                              <TableCell className="px-3">
                                {isExpanded
                                  ? <ChevronDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                  : <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                }
                              </TableCell>
                              <TableCell className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </TableCell>
                              <TableCell className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {entry.narration}
                              </TableCell>
                              <TableCell>
                                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow-sm", badge.color)}>
                                  {badge.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {entryTotalDebit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">
                                {entryTotalCredit.toFixed(2)}
                              </TableCell>
                            </TableRow>

                            {/* Expanded detail lines */}
                            {isExpanded && (
                              <TableRow key={`${entry.id}-detail`} className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-50/70 hover:to-indigo-50/70 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30">
                                <TableCell></TableCell>
                                <TableCell colSpan={5} className="p-0">
                                  <div className="px-4 py-4">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-blue-200/50 dark:border-blue-800/50">
                                          <TableHead className="w-[300px] text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider h-8">Account</TableHead>
                                          <TableHead className="w-[130px] text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider h-8">Debit</TableHead>
                                          <TableHead className="w-[130px] text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider h-8">Credit</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(entry.entries || []).map((line: any, i: number) => (
                                          <TableRow key={i} className="hover:bg-transparent border-0">
                                            <TableCell className="py-2 text-sm">
                                              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-mono font-medium mr-2">
                                                {line.account?.code}
                                              </span>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">{line.account?.name}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                              {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell className="py-2 text-right font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">
                                              {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow className="hover:bg-transparent border-t-2 border-blue-200 dark:border-blue-800 bg-blue-100/30 dark:bg-blue-900/20">
                                          <TableCell className="py-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Total</TableCell>
                                          <TableCell className="py-2 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{entryTotalDebit.toFixed(2)}</TableCell>
                                          <TableCell className="py-2 text-right font-mono text-xs font-bold text-rose-700 dark:text-rose-400">{entryTotalCredit.toFixed(2)}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 mt-6 px-1 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} of {totalItems} results
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Limit Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs whitespace-nowrap text-muted-foreground font-medium">Rows per page</span>
                      <Select
                        value={String(limit)}
                        onValueChange={(val) => setLimit(Number(val))}
                      >
                        <SelectTrigger size="sm" className="h-8 w-[70px]">
                          <SelectValue placeholder={limit} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 25, 50, 100].map((val) => (
                            <SelectItem key={val} value={String(val)}>
                              {val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* First Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden lg:flex h-8 w-8 p-0 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First Page</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      {/* Page Buttons */}
                      <div className="hidden md:flex items-center space-x-1">
                        {getPageNumbers(page, totalPages).map((p, idx) => (
                          <div key={idx}>
                            {p === '...' ? (
                              <span className="px-2">...</span>
                            ) : (
                              <Button
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                className={`h-8 w-8 p-0 ${page === p ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30'}`}
                                onClick={() => setPage(Number(p))}
                              >
                                {p}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </Button>

                      {/* Last Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden lg:flex h-8 w-8 p-0 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last Page</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
