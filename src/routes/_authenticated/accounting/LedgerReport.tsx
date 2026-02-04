"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
// Dummy Data
const ledgerData = [
    { id: 1, date: "2024-03-01", narration: "Opening Balance", debit: 0, credit: 0, balance: 5000.00 },
    { id: 2, date: "2024-03-05", narration: "Sales - Invoice #101", debit: 2000.00, credit: 0, balance: 7000.00 },
    { id: 3, date: "2024-03-08", narration: "Rent Payment", debit: 0, credit: 1500.00, balance: 5500.00 },
    { id: 4, date: "2024-03-10", narration: "Utility Bill", debit: 0, credit: 200.00, balance: 5300.00 },
];

export default function LedgerReport() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ledger Report</h2>
                    <p className="text-muted-foreground">View detailed transaction history for a specific account.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Account</label>
                            <Select defaultValue="cash">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash in Hand</SelectItem>
                                    <SelectItem value="bank">Bank Account</SelectItem>
                                    <SelectItem value="sales">Sales Account</SelectItem>
                                    <SelectItem value="rent">Rent Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
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
                        <Button>Generate Report</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Opening Balance</CardDescription>
                        <CardTitle className="text-2xl">5,000.00</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Debit</CardDescription>
                        <CardTitle className="text-2xl text-emerald-600">2,000.00</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Credit</CardDescription>
                        <CardTitle className="text-2xl text-red-600">1,700.00</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Closing Balance</CardDescription>
                        <CardTitle className="text-2xl text-primary">5,300.00</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Particulars</TableHead>
                                <TableHead className="text-right text-emerald-600">Debit</TableHead>
                                <TableHead className="text-right text-red-600">Credit</TableHead>
                                <TableHead className="text-right font-bold">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledgerData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.narration}</TableCell>
                                    <TableCell className="text-right">{row.debit > 0 ? row.debit.toFixed(2) : "-"}</TableCell>
                                    <TableCell className="text-right">{row.credit > 0 ? row.credit.toFixed(2) : "-"}</TableCell>
                                    <TableCell className="text-right font-medium">{row.balance.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
