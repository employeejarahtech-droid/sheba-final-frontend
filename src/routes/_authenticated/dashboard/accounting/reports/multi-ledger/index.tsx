"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Printer, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'

import { useRootAccounts, useMultiLedgerReport } from "@/features/accounting/api/queries";
import { useCurrency } from "@/hooks/use-currency";

const TYPE_COLORS: Record<string, string> = {
  Asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Liability: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Income: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Expense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const multiLedgerSearchSchema = z.object({
  account_ids: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/multi-ledger/')({
  validateSearch: (search) => multiLedgerSearchSchema.parse(search),
  component: MultiLedgerReport,
});

function MultiLedgerReport() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const goToPrint = useNavigate();

  const { data: rootAccounts = [], isLoading: isLoadingRoots } = useRootAccounts();

  const parsedIds = searchParams.account_ids
    ? searchParams.account_ids.split(',').map(Number).filter(n => !isNaN(n))
    : [];
  const fromDate = searchParams.from || format(new Date(), "yyyy-MM-dd");
  const toDate = searchParams.to || format(new Date(), "yyyy-MM-dd");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(parsedIds));
  const [localFrom, setLocalFrom] = useState<Date | undefined>(
    searchParams.from ? new Date(searchParams.from) : new Date()
  );
  const [localTo, setLocalTo] = useState<Date | undefined>(
    searchParams.to ? new Date(searchParams.to) : new Date()
  );

  const { data: reportData, isLoading: isLoadingReport } = useMultiLedgerReport({
    account_ids: parsedIds,
    from: fromDate,
    to: toDate,
  });

  const { currencySymbol } = useCurrency();

  const toggleAccount = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rootAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rootAccounts.map((a: any) => a.id)));
    }
  };

  const handleGenerateReport = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        account_ids: selectedIds.size > 0 ? Array.from(selectedIds).join(',') : undefined,
        from: localFrom ? format(localFrom, "yyyy-MM-dd") : undefined,
        to: localTo ? format(localTo, "yyyy-MM-dd") : undefined,
      })
    });
  };

  const grandSummary = reportData?.grand_summary;

  return (
    <div>
      <AppHeader fixed />
      <main className='p-4 space-y-4'>
        <PageHeader
          title="Multi-Account Ledger Report"
          description="View ledger for multiple accounts grouped together."
          actions={
            <Button variant="outline" className="gap-2" disabled={parsedIds.length === 0}
              onClick={() => goToPrint({
                to: '/dashboard/accounting/reports/multi-ledger/print' as any,
                search: { account_ids: parsedIds.join(','), from: fromDate, to: toDate } as any,
              })}>
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          }
          showBackButton={false}
        />

        {/* Filter Card */}
        <Card className="border-t-4 border-emerald-500 shadow-md py-0">
          <CardContent className="p-3">
            <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-4 items-start">
              {/* Account Checkbox List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Accounts
                  </label>
                  <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                    {selectedIds.size === rootAccounts.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {isLoadingRoots ? (
                    <div className="p-4 text-center text-sm text-gray-400">Loading accounts...</div>
                  ) : rootAccounts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No root accounts found</div>
                  ) : (
                    rootAccounts.map((acc: any) => (
                      <button
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
                          selectedIds.has(acc.id) && "bg-blue-50 dark:bg-blue-950/20"
                        )}
                      >
                        {selectedIds.has(acc.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span className="font-mono text-xs text-gray-500">{acc.code}</span>
                        <span className="truncate">{acc.name}</span>
                        <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", TYPE_COLORS[acc.type] || "bg-gray-100 text-gray-600")}>
                          {acc.type}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-400">{selectedIds.size} account(s) selected</p>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !localFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFrom ? format(localFrom, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={localFrom} onSelect={setLocalFrom} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !localTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localTo ? format(localTo, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={localTo} onSelect={setLocalTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <FileText className="mr-2 h-4 w-4" /> Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grand Summary */}
        {grandSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>Total Opening Balance</CardDescription>
                <CardTitle className="text-2xl">{currencySymbol} {(grandSummary.total_opening ?? 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>Total Debit</CardDescription>
                <CardTitle className="text-2xl text-emerald-600">{currencySymbol} {(grandSummary.total_debit ?? 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription>Total Credit</CardDescription>
                <CardTitle className="text-2xl text-red-600">{currencySymbol} {(grandSummary.total_credit ?? 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-700 dark:text-emerald-400">Total Closing Balance</CardDescription>
                <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">{currencySymbol} {(grandSummary.total_closing ?? 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Per-Account Sections */}
        {isLoadingReport && parsedIds.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {reportData?.accounts?.map((accountLedger: any) => {
          const txns = accountLedger.transactions || [];
          const totalDr = txns.reduce((s: number, t: any) => s + (t.debit || 0), 0);
          const totalCr = txns.reduce((s: number, t: any) => s + (t.credit || 0), 0);

          return (
            <Card key={accountLedger.account.id} className="overflow-hidden">
              <div className={cn(
                "px-4 py-2 flex items-center justify-between",
                "bg-gradient-to-r",
                ['ASSET'].includes(accountLedger.account.type) ? 'from-blue-600 to-cyan-500' :
                ['LIABILITY'].includes(accountLedger.account.type) ? 'from-orange-600 to-amber-500' :
                ['EQUITY'].includes(accountLedger.account.type) ? 'from-purple-600 to-violet-500' :
                ['INCOME'].includes(accountLedger.account.type) ? 'from-green-600 to-emerald-500' :
                "from-red-600 to-rose-500"
              )}>
                <h3 className="text-sm font-semibold text-white">
                  {accountLedger.account.code} — {accountLedger.account.name}
                </h3>
                <span className="text-xs text-white/80">
                  Opening: {currencySymbol} {(accountLedger.opening_balance ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3">
                <DataTable
                  tableTitle=""
                  columns={[
                    { data: "date", title: "Date", render: (data: any) => data ? format(new Date(data), "dd/MM/yyyy") : "-" },
                    { data: "narration", title: "Particulars" },
                    { data: "debit", title: "Debit (${currencySymbol})", className: "text-right", render: (data: any) => (Number(data) || 0).toFixed(2) },
                    { data: "credit", title: "Credit (${currencySymbol})", className: "text-right", render: (data: any) => (Number(data) || 0).toFixed(2) },
                    { data: "balance", title: "Balance (${currencySymbol})", className: "text-right font-bold", render: (data: any) => (Number(data) || 0).toFixed(2) },
                  ]}
                  data={txns}
                  isLoading={false}
                  search=""
                  onSearchChange={() => {}}
                />
                <div className="flex justify-end gap-6 mt-2 px-2 text-sm font-semibold">
                  <span>Total Debit: {currencySymbol} {totalDr.toFixed(2)}</span>
                  <span>Total Credit: {currencySymbol} {totalCr.toFixed(2)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400">Closing: {currencySymbol} {(accountLedger.closing_balance ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </main>
    </div>
  );
}

export default MultiLedgerReport;
