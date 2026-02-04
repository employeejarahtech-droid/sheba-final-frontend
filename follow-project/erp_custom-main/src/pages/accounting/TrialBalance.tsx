"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetTrialBalanceQuery } from "@/store/features/accounting/accoutntingApiService";

export default function TrialBalance() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const formattedDate = date ? format(date, "yyyy-MM-dd") : undefined;

    const { data: reportData, isLoading } = useGetTrialBalanceQuery(
        { date: formattedDate },
        { skip: !formattedDate }
    );

    const trialBalanceData = reportData?.data?.trial_balance || [];
    const totalDebit = reportData?.data?.total_debit || 0;
    const totalCredit = reportData?.data?.total_credit || 0;
    const status = reportData?.data?.status || "UNBALANCED";
    const isBalanced = status === "BALANCED";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Trial Balance</h2>
                    <p className="text-muted-foreground">Summary of all ledger account balances.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">As of:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <Card className="py-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Account Balances</CardTitle>
                    {isLoading ? (
                        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                    ) : isBalanced ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> BALANCED
                        </Badge>
                    ) : (
                        <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" /> UNBALANCED
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead className="text-xs text-muted-foreground">Type</TableHead>
                                <TableHead className="text-right">Debit Balance</TableHead>
                                <TableHead className="text-right">Credit Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-12 bg-gray-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-gray-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-16 bg-gray-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-full bg-gray-100 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-full bg-gray-100 animate-pulse rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : trialBalanceData.length > 0 ? (
                                trialBalanceData.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                                        <TableCell className="font-medium">{row.account}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{row.type}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No data available for this date.
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && trialBalanceData.length > 0 && (
                                <TableRow className="bg-muted/50 font-bold text-base">
                                    <TableCell colSpan={3} className="text-right">Totals</TableCell>
                                    <TableCell className="text-right text-emerald-600 border-t-2 border-emerald-600">
                                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-600 border-t-2 border-emerald-600">
                                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
