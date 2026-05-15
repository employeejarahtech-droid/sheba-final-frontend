
"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Search, Eye, EyeOff } from "lucide-react";
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

export const Route = createFileRoute('/_authenticated/accounting/reports/journal/')({
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

  // Filters
  const [page, setPage] = useState(1);
  const limit = 20;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

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
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
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
      <Main className="p-6 lg:p-10">
        <div className="space-y-6">
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
                <DialogContent className="sm:max-w-[750px]">
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

          {/* Filters + Recent Entries */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent Journal Entries</CardTitle>
                  <CardDescription>View and manage your journal entries</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-36 h-8 text-xs" />
                  <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-36 h-8 text-xs" />
                  <div className="flex gap-1">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                      placeholder="Search..."
                      className="w-40 h-8 text-xs"
                    />
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => { setSearch(searchInput); setPage(1); }}>
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(fromDate || toDate || search) && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setSearchInput(""); setPage(1); }}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Expand/Collapse All */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{totalItems} entries</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={expandAll}>
                    <Eye className="h-3 w-3" /> Expand All
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={collapseAll}>
                    <EyeOff className="h-3 w-3" /> Collapse All
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="w-28">Date</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead className="w-[130px] text-right">Debit</TableHead>
                      <TableHead className="w-[130px] text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : (journalData?.data || []).length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No journal entries found.</TableCell></TableRow>
                    ) : (
                      (journalData?.data || []).map((entry: any) => {
                        const isExpanded = expandedRows.has(entry.id);
                        const entryTotalDebit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.debit) || 0), 0);
                        const entryTotalCredit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.credit) || 0), 0);
                        const badge = refTypeBadge[entry.reference_type] || { label: entry.reference_type || '-', color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };

                        return (
                          <>
                            <TableRow
                              key={entry.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleRow(entry.id)}
                            >
                              <TableCell className="px-2">
                                {isExpanded
                                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                              </TableCell>
                              <TableCell className="text-sm">
                                {entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {entry.narration}
                              </TableCell>
                              <TableCell>
                                <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-medium", badge.color)}>
                                  {badge.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {entryTotalDebit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {entryTotalCredit.toFixed(2)}
                              </TableCell>
                            </TableRow>

                            {/* Expanded detail lines */}
                            {isExpanded && (
                              <TableRow key={`${entry.id}-detail`} className="bg-muted/20 hover:bg-muted/20">
                                <TableCell></TableCell>
                                <TableCell colSpan={5} className="p-0">
                                  <div className="px-4 py-3">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead className="w-[300px] text-xs h-8">Account</TableHead>
                                          <TableHead className="w-[130px] text-right text-xs h-8">Debit</TableHead>
                                          <TableHead className="w-[130px] text-right text-xs h-8">Credit</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(entry.entries || []).map((line: any, i: number) => (
                                          <TableRow key={i} className="hover:bg-transparent border-0">
                                            <TableCell className="py-1 text-sm">
                                              <span className="font-mono text-xs text-muted-foreground mr-2">{line.account?.code}</span>
                                              {line.account?.name}
                                            </TableCell>
                                            <TableCell className="py-1 text-right font-mono text-sm">
                                              {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell className="py-1 text-right font-mono text-sm">
                                              {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow className="hover:bg-transparent border-t">
                                          <TableCell className="py-1 text-xs font-bold">Total</TableCell>
                                          <TableCell className="py-1 text-right font-mono text-xs font-bold">{entryTotalDebit.toFixed(2)}</TableCell>
                                          <TableCell className="py-1 text-right font-mono text-xs font-bold">{entryTotalCredit.toFixed(2)}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
