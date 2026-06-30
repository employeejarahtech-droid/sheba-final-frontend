"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BookOpen, Printer, CheckSquare, Square, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateField } from "@/components/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Layout
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'

// Data
import { useMultiLedgerReport } from "@/features/accounting/api/queries";
import { useGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import type { ChartOfAccount } from "@/types/accounting.types";
import { useCurrency } from "@/hooks/use-currency";

const TYPE_COLORS: Record<string, string> = {
  Asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Liability: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Income: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Expense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// Normalise raw enum ("ASSET") to the capitalized form used by TYPE_COLORS.
const normType = (t?: string) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';

// Same URL-driven search shape as the Ledger report (from/to are always-on
// string params, empty string = unset).
const multiLedgerSearchSchema = z.object({
  account_ids: z.string().optional(),
  from: z.string().catch(''),
  to: z.string().catch(''),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/multi-ledger/')({
  validateSearch: (search) => multiLedgerSearchSchema.parse(search),
  component: MultiLedgerReport,
});

// ── Account tree helpers (mirrors NestedAccountSelect) ───────────────────────
interface TreeNode { account: ChartOfAccount; children: TreeNode[]; }

function buildAccountTree(accounts: ChartOfAccount[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  accounts.forEach((acc) => map.set(acc.id, { account: acc, children: [] }));
  accounts.forEach((acc) => {
    const node = map.get(acc.id)!;
    if (acc.parent_id && map.has(acc.parent_id)) {
      map.get(acc.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function flattenAccountTree(nodes: TreeNode[], depth = 0): { account: ChartOfAccount; depth: number }[] {
  const result: { account: ChartOfAccount; depth: number }[] = [];
  nodes.forEach((node) => {
    result.push({ account: node.account, depth });
    result.push(...flattenAccountTree(node.children, depth + 1));
  });
  return result;
}

// ── Date preset helpers ──────────────────────────────────────────────────────
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DATE_PRESETS: Record<string, { label: string; from: string; to: string }> = {
  today:     { label: 'Today',         from: toYMD(today()),                                            to: toYMD(today()) },
  yesterday: { label: 'Yesterday',     from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 1);   return d; })()), to: toYMD((() => { const d = today(); d.setDate(d.getDate() - 1); return d; })()) },
  last7:     { label: 'Last 7 days',   from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6);   return d; })()), to: toYMD(today()) },
  last15:    { label: 'Last 15 days',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14);  return d; })()), to: toYMD(today()) },
  last30:    { label: 'Last 30 days',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29);  return d; })()), to: toYMD(today()) },
  last60:    { label: 'Last 60 days',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59);  return d; })()), to: toYMD(today()) },
  last90:    { label: 'Last 90 days',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89);  return d; })()), to: toYMD(today()) },
  last180:   { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
  last365:   { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
};

function MultiLedgerReport() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const { currencySymbol } = useCurrency();

  // Full chart of accounts (all levels — roots, sub-heads, leaves) so users can
  // pick the exact accounts that actually hold journal postings.
  const { data: accountsData, isLoading: isLoadingAccounts } = useGetAccountingAccountsQuery({ page: 1, limit: 500 });
  const allAccounts: ChartOfAccount[] = accountsData?.data || [];
  const [accountSearch, setAccountSearch] = useState("");

  // All params are URL-driven (same model as the Ledger report) — no local
  // state, no "Generate" button. Toggling an account or changing a date updates
  // the URL and the report refetches live.
  const accountIds = searchParams.account_ids
    ? searchParams.account_ids.split(',').map(Number).filter(n => !isNaN(n))
    : [];
  const from = searchParams.from || "";
  const to   = searchParams.to   || "";

  const selectedSet = useMemo(() => new Set(accountIds), [accountIds]);

  // Flattened, indented account tree (filtered by search).
  const flatAccounts = useMemo(() => {
    const flat = flattenAccountTree(buildAccountTree(allAccounts));
    if (!accountSearch) return flat;
    const q = accountSearch.toLowerCase();
    return flat.filter(
      (f) =>
        f.account.name.toLowerCase().includes(q) ||
        f.account.code.toLowerCase().includes(q) ||
        f.account.type?.toLowerCase().includes(q)
    );
  }, [allAccounts, accountSearch]);

  // ── Account selection (live) ──────────────────────────────────────────────
  const toggleAccount = (id: number) => {
    const next = new Set(accountIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    const arr = Array.from(next);
    navigate({ to: '.', search: (prev: any) => ({ ...prev, account_ids: arr.length ? arr.join(',') : undefined }) });
  };

  const allAccountIds = useMemo(() => allAccounts.map((a) => a.id), [allAccounts]);
  const allSelected = allAccountIds.length > 0 && allAccountIds.every((id) => selectedSet.has(id));
  const toggleAll = () => {
    navigate({
      to: '.',
      search: (prev: any) => ({ ...prev, account_ids: allSelected ? undefined : allAccountIds.join(',') }),
    });
  };

  // ── Date range (live, mirrors Ledger report) ──────────────────────────────
  const setFrom = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: v }) });
  const setTo   = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, to: v }) });
  const clearDates = () => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: '', to: '' }) });

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(DATE_PRESETS).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to]);

  const applyPreset = (key: string) => {
    const p = DATE_PRESETS[key];
    if (p) navigate({ to: '.', search: (prev: any) => ({ ...prev, from: p.from, to: p.to }) });
  };

  // Fetch — only fires when at least one account is selected
  const { data: reportData, isLoading: isLoadingReport } = useMultiLedgerReport({
    account_ids: accountIds,
    from: from || format(new Date(), "yyyy-MM-dd"),
    to:   to   || format(new Date(), "yyyy-MM-dd"),
  });

  const grandSummary = reportData?.grand_summary;

  return (
    <div>
      <AppHeader fixed />
      <main className='p-4 space-y-4'>
        <PageHeader
          title="Multi-Account Ledger Report"
          description="View ledger for multiple accounts grouped together."
          actions={
            <Button variant="outline" className="gap-2" disabled={accountIds.length === 0}
              onClick={() => navigate({
                to: '/dashboard/accounting/reports/multi-ledger/print' as any,
                search: { account_ids: accountIds.join(','), from, to } as any,
              })}>
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          }
          showBackButton={false}
        />

        {/* Filter Card */}
        <Card className="border-t-4 border-emerald-500 shadow-md py-0">
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              {/* Account Checkbox List (full chart of accounts) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Accounts
                  </label>
                  <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {/* Search */}
                <div className="flex items-center border rounded-md px-2 bg-background">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground ml-2"
                    placeholder="Search by code, name, or type..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                  {accountSearch && (
                    <button onClick={() => setAccountSearch("")} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {isLoadingAccounts ? (
                    <div className="p-4 text-center text-sm text-gray-400">Loading accounts...</div>
                  ) : flatAccounts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No accounts found</div>
                  ) : (
                    flatAccounts.map(({ account, depth }) => (
                      <button
                        key={account.id}
                        onClick={() => toggleAccount(account.id)}
                        style={{ paddingLeft: `${depth * 18 + 10}px` }}
                        className={cn(
                          "w-full flex items-center gap-2 py-1.5 pr-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
                          selectedSet.has(account.id) && "bg-blue-50 dark:bg-blue-950/20"
                        )}
                      >
                        {selectedSet.has(account.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        {depth > 0 && <span className="text-muted-foreground text-xs">└</span>}
                        <span className="font-mono text-xs text-gray-500">{account.code}</span>
                        <span className="truncate">{account.name}</span>
                        <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", TYPE_COLORS[normType(account.type)] || "bg-gray-100 text-gray-600")}>
                          {normType(account.type)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-400">{accountIds.length} account(s) selected</p>
              </div>

              {/* Date range controls — mirrors the Ledger report */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                <div className="flex items-center gap-1.5">
                  <Select value={activePreset} onValueChange={applyPreset}>
                    <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="last15">Last 15 days</SelectItem>
                      <SelectItem value="last30">Last 30 days</SelectItem>
                      <SelectItem value="last60">Last 60 days</SelectItem>
                      <SelectItem value="last90">Last 90 days</SelectItem>
                      <SelectItem value="last180">Last 180 days</SelectItem>
                      <SelectItem value="last365">Last 365 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                  <DateField value={from} onChange={setFrom} placeholder="From" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <DateField value={to} onChange={setTo} placeholder="To" />
                  {(from || to) && (
                    <Button variant="ghost" size="sm" onClick={clearDates} className="h-9 px-2">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty state — no accounts selected */}
        {accountIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground border rounded-lg bg-muted/20">
            <BookOpen className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Select accounts to view the report</p>
            <p className="text-sm opacity-70">Pick one or more accounts above, optionally set a date range</p>
          </div>
        )}

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
        {isLoadingReport && accountIds.length > 0 && (
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
                    { data: "debit", title: `Debit (${currencySymbol})`, className: "text-right text-emerald-600", render: (data: any) => (Number(data) || 0).toFixed(2) },
                    { data: "credit", title: `Credit (${currencySymbol})`, className: "text-right text-red-600", render: (data: any) => (Number(data) || 0).toFixed(2) },
                    { data: "balance", title: `Balance (${currencySymbol})`, className: "text-right font-bold", render: (data: any) => (Number(data) || 0).toFixed(2) },
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
