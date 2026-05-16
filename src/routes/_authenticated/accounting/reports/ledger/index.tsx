
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NestedAccountSelect } from "@/components/accounting/NestedAccountSelect";

// Layout
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'




// Data
import { useLedgerReport } from "@/features/accounting/api/queries";
import { useCurrency } from "@/hooks/use-currency";

const ledgerSearchSchema = z.object({
  account_id: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/accounting/reports/ledger/')({
  validateSearch: (search) => ledgerSearchSchema.parse(search),
  component: LedgerReport,
})



function LedgerReport() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const goToPrint = useNavigate();

  const accountId = searchParams.account_id ? String(searchParams.account_id) : "";
  const fromDate = searchParams.from || format(new Date(), "yyyy-MM-dd");
  const toDate = searchParams.to || format(new Date(), "yyyy-MM-dd");
  const [search, setSearch] = useState("");

  const [localAccountId, setLocalAccountId] = useState<number | null>(accountId ? Number(accountId) : null);
  const [localFrom, setLocalFrom] = useState<Date | undefined>(searchParams.from ? new Date(searchParams.from) : new Date());
  const [localTo, setLocalTo] = useState<Date | undefined>(searchParams.to ? new Date(searchParams.to) : new Date());

  const { data: ledgerResponse, isLoading: isLedgerLoading } = useLedgerReport({
    account_id: Number(accountId),
    from: fromDate,
    to: toDate
  });

  const handleGenerateReport = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        account_id: localAccountId || undefined,
        from: localFrom ? format(localFrom, "yyyy-MM-dd") : undefined,
        to: localTo ? format(localTo, "yyyy-MM-dd") : undefined,
      })
    });
  };
  const { currencySymbol } = useCurrency();

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
              onClick={() => goToPrint({
                to: '/accounting/reports/ledger/print' as any,
                search: { account_id: Number(accountId), from: fromDate, to: toDate } as any,
              })}>
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          }
          showBackButton={false}
        />

        <Card className="border-t-4 border-emerald-500 shadow-md py-0">
          <CardContent className="p-3">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account</label>
                <NestedAccountSelect
                  value={localAccountId}
                  onChange={(id: number | null) => setLocalAccountId(id)}
                  placeholder="Select account"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFrom ? format(localFrom, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFrom}
                      onSelect={setLocalFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localTo ? format(localTo, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localTo}
                      onSelect={setLocalTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleGenerateReport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <FileText className="mr-2 h-4 w-4" /> Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Header */}
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
      </main>
    </div>
  );
}

export default LedgerReport;
