
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Layout

import { AppHeader } from '@/components/layout/app-header'




// Data
import { useGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import { useLedgerReport } from "@/features/accounting/api/queries";
import { ChartOfAccount } from "@/types/accounting.types";

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

  const accountId = searchParams.account_id ? String(searchParams.account_id) : "";
  const fromDate = searchParams.from || format(new Date(), "yyyy-MM-dd");
  const toDate = searchParams.to || format(new Date(), "yyyy-MM-dd");

  const [localAccountId, setLocalAccountId] = useState(accountId);
  const [localFrom, setLocalFrom] = useState<Date | undefined>(searchParams.from ? new Date(searchParams.from) : new Date());
  const [localTo, setLocalTo] = useState<Date | undefined>(searchParams.to ? new Date(searchParams.to) : new Date());

  const { data: accountsData } = useGetAccountingAccountsQuery({ limit: 1000 });

  const { data: ledgerResponse, isLoading: isLedgerLoading } = useLedgerReport({
    account_id: Number(accountId),
    from: fromDate,
    to: toDate
  });

  const handleGenerateReport = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        account_id: localAccountId ? Number(localAccountId) : undefined,
        from: localFrom ? format(localFrom, "yyyy-MM-dd") : undefined,
        to: localTo ? format(localTo, "yyyy-MM-dd") : undefined,
      })
    });
  };
  // @ts-ignore
  const accounts: ChartOfAccount[] = accountsData?.data || [];
  const currency = '৳';

  return (
    <div className="">
      <AppHeader fixed />
      <main className='p-6 lg:p-10 space-y-6'>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ledger Report</h2>
            <p className="text-muted-foreground">View detailed transaction history for a specific account.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>

        <Card className="border-t-4 border-emerald-500 shadow-md py-0">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account</label>
                <Select value={localAccountId} onValueChange={setLocalAccountId}>
                  <SelectTrigger className="md:w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        {acc.name} ({acc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <CardTitle className="text-2xl">{currency} {ledgerResponse?.opening_balance?.toFixed(2) || "0.00"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Debit</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">
                {currency} {ledgerResponse?.transactions?.reduce((sum: number, t: any) => sum + (t.debit || 0), 0).toFixed(2) || "0.00"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Credit</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {currency} {ledgerResponse?.transactions?.reduce((sum: number, t: any) => sum + (t.credit || 0), 0).toFixed(2) || "0.00"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-700 dark:text-emerald-400">Closing Balance</CardDescription>
              <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">{currency} {ledgerResponse?.closing_balance?.toFixed(2) || "0.00"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-lg py-0 gap-0">
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b-1 py-4 gap-0">
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-6">
            <DataTable
              columns={[
                {
                  data: "date",
                  title: "Date",
                  render: (data: any) => format(new Date(data), "dd/MM/yyyy")
                },
                { data: "narration", title: "Particulars" },
                {
                  data: "debit",
                  title: `Debit (${currency})`,
                  className: "text-right text-emerald-600",
                  render: (data: any) => (Number(data) || 0).toFixed(2)
                },
                {
                  data: "credit",
                  title: `Credit (${currency})`,
                  className: "text-right text-red-600",
                  render: (data: any) => (Number(data) || 0).toFixed(2)
                },
                {
                  data: "balance",
                  title: `Balance (${currency})`,
                  className: "text-right font-bold",
                  render: (data: any) => (Number(data) || 0).toFixed(2)
                },
              ]}
              data={ledgerResponse?.transactions || []}
              isLoading={isLedgerLoading}
            // Ledger reports usually aren't paginated the same way list views are,
            // but we can provide meta if the API eventually supports it.
            // For now, we show all transactions returned for the range.
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default LedgerReport;
