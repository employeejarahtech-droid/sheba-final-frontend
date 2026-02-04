"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type AccountingRow = {
  account: string;
  debit: number;
  credit: number;
  balance: number;
};

const accountingData: AccountingRow[] = [
  {
    account: "4000 – Sales",
    debit: 0,
    credit: 245320,
    balance: -245320,
  },
  {
    account: "5000 – Cost of Sales",
    debit: 172840,
    credit: 0,
    balance: 172840,
  },
  {
    account: "6100 – Operating Expenses",
    debit: 32000,
    credit: 0,
    balance: 32000,
  },
];

export default function AccountingReports() {
  const [reportType, setReportType] = useState("trial");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

const columns: ColumnDef<AccountingRow>[] = [
  { accessorKey: "account", header: "Account" },

  {
    accessorKey: "debit",
    header: "Debit",
    cell: ({ row }) => {
      const value = row.getValue("debit") as number;
      return value.toLocaleString();
    },
  },

  {
    accessorKey: "credit",
    header: "Credit",
    cell: ({ row }) => {
      const value = row.getValue("credit") as number;
      return value.toLocaleString();
    },
  },

  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const value = row.getValue("balance") as number;
      return (
        <span className={value < 0 ? "text-red-600" : "text-gray-900"}>
          {value.toLocaleString()}
        </span>
      );
    },
  },
];


  return (
    <Card className="rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <CardTitle className="text-xl font-semibold">
          Accounting Reports
        </CardTitle>

        <Button variant="outline">Export</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Type */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Report</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Trial Balance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial Balance</SelectItem>
              <SelectItem value="ledger">Ledger</SelectItem>
              <SelectItem value="pl">Profit & Loss</SelectItem>
              <SelectItem value="balance">Balance Sheet</SelectItem>
              <SelectItem value="tax">Tax Report</SelectItem>
              <SelectItem value="expense">Expense Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Period Range */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Period</label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="From"
              className="h-10"
            />
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="To"
              className="h-10"
            />
          </div>
        </div>

        {/* Branch Select */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Branch</label>
          <Select defaultValue="all">
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="dhaka">Dhaka</SelectItem>
              <SelectItem value="ctg">Chattogram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={accountingData}
          pageIndex={pageIndex}
          pageSize={10}
          onPageChange={setPageIndex}
        />

        <p className="text-gray-500 text-xs mt-4">
          Built from general ledger, journal entries, tax and expense tables for
          Trial Balance, Ledger, P&amp;L, Balance Sheet, Tax and Expense
          reports.
        </p>
      </CardContent>
    </Card>
  );
}
