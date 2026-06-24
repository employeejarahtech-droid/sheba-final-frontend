"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetDailySummaryQuery } from "@/features/accounting/accountingQueries";
import { useCurrency } from "@/hooks/use-currency";
import { AppHeader } from "@/components/layout/app-header";
import { PageHeader } from "@/components/layout/page-header";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/daily-summary/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: DailySummary,
});

function DailySummary() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const { currencySymbol } = useCurrency();

  const selectedDate = searchParams.date || format(new Date(), "yyyy-MM-dd");

  const { data: summaryData, isLoading } = useGetDailySummaryQuery({
    date: selectedDate,
  });

  const report = summaryData?.data;

  const openingBalance = report?.opening_balance ?? 0;
  const todayDebit = report?.today_debit ?? 0;
  const todayCredit = report?.today_credit ?? 0;
  const closingBalance = report?.closing_balance ?? 0;
  const transactions = report?.transactions ?? [];

  const setReportDate = (date: Date | undefined) => {
    if (date) {
      navigate({ search: (prev: any) => ({ ...prev, date: format(date, "yyyy-MM-dd") }) });
    }
  };

  const refTypeBadge: Record<string, { label: string; color: string }> = {
    TRANSACTION: { label: "Transaction", color: "bg-blue-100 text-blue-700" },
    MANUAL: { label: "Manual", color: "bg-purple-100 text-purple-700" },
    INVOICE: { label: "Invoice", color: "bg-green-100 text-green-700" },
  };

  return (
    <>
      <AppHeader fixed />
      <main className=" space-y-4">
        <PageHeader
          title="Daily Summary"
          description="Opening balance, today's transactions, and closing balance."
          showBackButton={false}
          actions={
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(selectedDate), "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={new Date(selectedDate)}
                  onSelect={setReportDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Opening Balance", icon: Scale, grad: "from-blue-500 to-indigo-500", valueClass: "", sub: `Balance before ${format(new Date(selectedDate), "dd MMM yyyy")}`, value: openingBalance },
            { label: "Today's Debit", icon: ArrowUpRight, grad: "from-emerald-500 to-teal-500", valueClass: "text-emerald-600", sub: `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} today`, value: todayDebit },
            { label: "Today's Credit", icon: ArrowDownLeft, grad: "from-rose-500 to-red-500", valueClass: "text-rose-600", sub: "Total credits for the day", value: todayCredit },
            { label: "Closing Balance", icon: closingBalance >= 0 ? TrendingUp : TrendingDown, grad: closingBalance >= 0 ? "from-violet-500 to-purple-500" : "from-rose-500 to-red-500", valueClass: closingBalance >= 0 ? "text-violet-600" : "text-rose-600", sub: "Opening + Debit − Credit", value: closingBalance },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-2 bg-gradient-to-br rounded-lg shadow-lg", card.grad)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <h3 className={cn("text-2xl font-bold", card.valueClass)}>
                      {currencySymbol} {card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Calculation */}
        {!isLoading && (
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-center gap-4 text-sm font-mono flex-wrap">
                <span>Closing =</span>
                <span className="text-blue-600 font-semibold">{currencySymbol} {openingBalance.toFixed(2)}</span>
                <span className="text-muted-foreground">+</span>
                <span className="text-emerald-600 font-semibold">{currencySymbol} {todayDebit.toFixed(2)}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-red-600 font-semibold">{currencySymbol} {todayCredit.toFixed(2)}</span>
                <span className="text-muted-foreground">=</span>
                <span className={cn("font-bold text-lg", closingBalance >= 0 ? "text-violet-600" : "text-red-600")}>
                  {currencySymbol} {closingBalance.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions — {format(new Date(selectedDate), "dd MMM yyyy")}</CardTitle>
            <CardDescription>All journal entries recorded on this date</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found for {format(new Date(selectedDate), "dd MMM yyyy")}.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead className="text-right w-[120px]">Debit</TableHead>
                      <TableHead className="text-right w-[120px]">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => {
                      const badge = refTypeBadge[tx.reference_type] || { label: tx.reference_type || '-', color: 'bg-gray-100 text-gray-700' };
                      return (
                        <TableRow key={tx.journal_id}>
                          <TableCell className="font-mono text-sm">#{tx.journal_id}</TableCell>
                          <TableCell className="font-medium">{tx.narration || "-"}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", badge.color)}>
                              {badge.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.entries.map((e: any, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{e.account_code}</span>
                                <span>{e.account_name}</span>
                                {e.debit > 0 && <span className="text-emerald-600 text-xs">Dr {e.debit.toFixed(2)}</span>}
                                {e.credit > 0 && <span className="text-red-600 text-xs">Cr {e.credit.toFixed(2)}</span>}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">
                            {tx.total_debit > 0 ? tx.total_debit.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            {tx.total_credit > 0 ? tx.total_credit.toFixed(2) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4} className="text-right">Total</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">{todayDebit.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{todayCredit.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
