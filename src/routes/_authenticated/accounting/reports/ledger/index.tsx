
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Layout
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { topNav } from '@/data/data'

// Data
import { useGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import { ChartOfAccount } from "@/types/accounting.types";

export const Route = createFileRoute('/_authenticated/accounting/reports/ledger/')({
  component: LedgerReport,
})

// Dummy Data (Placeholder until API supports specific ledger endpoint)
const ledgerData = [
  { id: 1, date: "2024-03-01", narration: "Opening Balance", debit: 0, credit: 0, balance: 5000.00 },
  { id: 2, date: "2024-03-05", narration: "Sales - Invoice #101", debit: 2000.00, credit: 0, balance: 7000.00 },
  { id: 3, date: "2024-03-08", narration: "Rent Payment", debit: 0, credit: 1500.00, balance: 5500.00 },
  { id: 4, date: "2024-03-10", narration: "Utility Bill", debit: 0, credit: 200.00, balance: 5300.00 },
];

function LedgerReport() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const { data: accountsData } = useGetAccountingAccountsQuery({ limit: 1000 });
  // @ts-ignore
  const accounts: ChartOfAccount[] = accountsData?.data || [];
  const currency = '৳';

  return (
    <div className="">
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
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

        <Card className="border-t-4 border-emerald-500 shadow-md">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
              <CardTitle className="text-2xl">{currency} 5,000.00</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Debit</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">{currency} 2,000.00</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Credit</CardDescription>
              <CardTitle className="text-2xl text-red-600">{currency} 1,700.00</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-700 dark:text-emerald-400">Closing Balance</CardDescription>
              <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">{currency} 5,300.00</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b">
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead className="py-4">Date</TableHead>
                  <TableHead className="py-4">Particulars</TableHead>
                  <TableHead className="text-right py-4 text-emerald-600">Debit ({currency})</TableHead>
                  <TableHead className="text-right py-4 text-red-600">Credit ({currency})</TableHead>
                  <TableHead className="text-right py-4 font-bold">Balance ({currency})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-3 font-medium">{row.date}</TableCell>
                    <TableCell className="py-3">{row.narration}</TableCell>
                    <TableCell className="text-right py-3">{row.debit > 0 ? row.debit.toFixed(2) : "-"}</TableCell>
                    <TableCell className="text-right py-3">{row.credit > 0 ? row.credit.toFixed(2) : "-"}</TableCell>
                    <TableCell className="text-right font-bold py-3">{row.balance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default LedgerReport;
