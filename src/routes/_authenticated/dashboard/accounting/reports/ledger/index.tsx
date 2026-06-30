
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { BookOpen, Printer, X } from "lucide-react";
import { createFileRoute } from '@tanstack/react-router';
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";
import { DateField } from "@/components/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Layout
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'

// Data
import { useLedgerReport } from "@/features/accounting/api/queries";
import { useCurrency } from "@/hooks/use-currency";

const ledgerSearchSchema = z.object({
  account_id: z.coerce.number().optional(),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/ledger/')({
  validateSearch: (search) => ledgerSearchSchema.parse(search),
  component: LedgerReport,
})

// ── Date preset helpers ──────────────────────────────────────────────────────
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DATE_PRESETS: Record<string, { label: string; from: string; to: string }> = {
  today:   { label: 'Today',        from: toYMD(today()),                                          to: toYMD(today()) },
  yesterday: { label: 'Yesterday',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 1); return d; })()), to: toYMD((() => { const d = today(); d.setDate(d.getDate() - 1); return d; })()) },
  last7:   { label: 'Last 7 days',  from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6);   return d; })()), to: toYMD(today()) },
  last15:  { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14);  return d; })()), to: toYMD(today()) },
  last30:  { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29);  return d; })()), to: toYMD(today()) },
  last60:  { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59);  return d; })()), to: toYMD(today()) },
  last90:  { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89);  return d; })()), to: toYMD(today()) },
  last180: { label: 'Last 180 days',from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
  last365: { label: 'Last 365 days',from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
};

function LedgerReport() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const { currencySymbol } = useCurrency();

  // All params are URL-driven
  const accountId = searchParams.account_id || 0;
  const from = searchParams.from || "";
  const to   = searchParams.to   || "";

  const [search, setSearch] = useState("");

  // URL navigators
  const setAccountId = (id: number | null) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, account_id: id || undefined }) });
  const setFrom = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: v }) });
  const setTo   = (v: string) => navigate({ to: '.', search: (prev: any) => ({ ...prev, to: v }) });
  const clearDates = () => navigate({ to: '.', search: (prev: any) => ({ ...prev, from: '', to: '' }) });

  // Active preset detection
  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(DATE_PRESETS).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to]);

  const applyPreset = (key: string) => {
    const p = DATE_PRESETS[key];
    if (p) {
      navigate({ to: '.', search: (prev: any) => ({ ...prev, from: p.from, to: p.to }) });
    }
  };

  // Fetch — only fires when an account is selected
  const { data: ledgerResponse, isLoading: isLedgerLoading } = useLedgerReport({
    account_id: accountId,
    from: from || format(new Date(), "yyyy-MM-dd"),
    to:   to   || format(new Date(), "yyyy-MM-dd"),
  });

  const filteredTransactions = useMemo(() => {
    const txns = ledgerResponse?.transactions || [];
    if (!search) return txns;
    const q = search.toLowerCase();
    return txns.filter((t: any) =>
      (t.narration || "").toLowerCase().includes(q) ||
      (t.date || "").toLowerCase().includes(q) ||
      String(t.debit || "").includes(q) ||
      String(t.credit || "").includes(q)
    );
  }, [ledgerResponse?.transactions, search]);

  return (
    <div className="">
      <AppHeader fixed />
      <main className='p-4 space-y-4'>
        <PageHeader
          title="Ledger Report"
          description="View detailed transaction history for a specific account."
          actions={
            <Button variant="outline" className="gap-2" disabled={!accountId}
              onClick={() => navigate({
                to: '/dashboard/accounting/reports/ledger/print' as any,
                search: { account_id: accountId, from: from || format(new Date(), "yyyy-MM-dd"), to: to || format(new Date(), "yyyy-MM-dd") } as any,
              })}>
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          }
          showBackButton={false}
        />

        {/* Account + Date Range — single unified card */}
        <Card className="border-t-4 border-emerald-500 shadow-md py-0">
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              {/* Account selector */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account</label>
                <NestedAccountSelect
                  value={accountId || null}
                  onChange={(id: number | null) => setAccountId(id)}
                  placeholder="Select an account to view its ledger..."
                />
              </div>

              {/* Date range controls */}
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

        {/* Empty state — no account selected */}
        {!accountId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground border rounded-lg bg-muted/20">
            <BookOpen className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Select an account above to view its ledger</p>
            <p className="text-sm opacity-70">Pick an account from the dropdown, then optionally set a date range</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription>Opening Balance</CardDescription>
                  <CardTitle className="text-2xl">{currencySymbol} {(ledgerResponse?.opening_balance ?? 0).toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription>Total Debit</CardDescription>
                  <CardTitle className="text-2xl text-emerald-600">
                    {currencySymbol} {(ledgerResponse?.transactions?.reduce((sum: number, t: any) => sum + (t.debit || 0), 0) || 0).toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription>Total Credit</CardDescription>
                  <CardTitle className="text-2xl text-red-600">
                    {currencySymbol} {(ledgerResponse?.transactions?.reduce((sum: number, t: any) => sum + (t.credit || 0), 0) || 0).toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-700 dark:text-emerald-400">Closing Balance</CardDescription>
                  <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">{currencySymbol} {(ledgerResponse?.closing_balance ?? 0).toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Data Table */}
            <div className="py-0 gap-0">
              <DataTable
                tableTitle="Ledger Transactions"
                columns={[
                  {
                    data: "date",
                    title: "Date",
                    render: (data: any) => format(new Date(data), "dd/MM/yyyy")
                  },
                  { data: "narration", title: "Particulars" },
                  {
                    data: "debit",
                    title: `Debit (${currencySymbol})`,
                    className: "text-right text-emerald-600",
                    render: (data: any) => (Number(data) || 0).toFixed(2)
                  },
                  {
                    data: "credit",
                    title: `Credit (${currencySymbol})`,
                    className: "text-right text-red-600",
                    render: (data: any) => (Number(data) || 0).toFixed(2)
                  },
                  {
                    data: "balance",
                    title: `Balance (${currencySymbol})`,
                    className: "text-right font-bold",
                    render: (data: any) => (Number(data) || 0).toFixed(2)
                  },
                ]}
                data={filteredTransactions}
                isLoading={isLedgerLoading}
                search={search}
                onSearchChange={setSearch}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default LedgerReport;
