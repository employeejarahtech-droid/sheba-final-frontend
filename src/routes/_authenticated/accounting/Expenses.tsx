/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useGetExpensesQuery } from "@/store/features/accounting/accoutntingApiService";
import { useAppSelector } from "@/store/store";
import type { Expense } from "@/types/accounting.types";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, DollarSign, TrendingDown, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const limit = 10;

  const { data, isFetching, isError } = useGetExpensesQuery({
    page,
    limit,
    search,
    date,
  });
  const fetchedExpenses = data?.data || [];

  const currency = useAppSelector((state) => state.currency.value);

  // Stats Data
  const { data: allExpensesData } = useGetExpensesQuery({ limit: 1000 });
  const allExpenses = allExpensesData?.data || [];

  const totalExpense = allExpenses.reduce((sum: number, item: Expense) => sum + Number(item.amount), 0);
  const totalTransactions = allExpenses.length;
  const avgTransaction = totalTransactions > 0 ? totalExpense / totalTransactions : 0;

  const stats = [
    {
      label: "Total Expenses",
      value: `${currency} ${totalExpense.toLocaleString()}`,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <DollarSign className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Transactions",
      value: totalTransactions,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <TrendingDown className="w-6 h-6 text-white" />,
    },
    {
      label: "Avg. Transaction",
      value: `${currency} ${avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      gradient: "from-violet-600 to-violet-400",
      shadow: "shadow-violet-500/30",
      icon: <CreditCard className="w-6 h-6 text-white" />,
    },
  ];

  const expenseColumns: ColumnDef<Expense>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
    },
    {
      accessorKey: "title",
      header: "Title",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any
    },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "debitHead",
      header: "Category",
      cell: ({ row }: { row: any }) => {
        const debitHead = row?.original?.debitHead?.name;
        return <span className="font-medium">{debitHead}</span>;
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-right">Amount ({currency})</div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="text-right">{Number(row.getValue("amount")).toFixed(2)}</div>
      ),
    },
    { accessorKey: "expense_date", header: "Date" },
    { accessorKey: "payment_method", header: "Payment Method" },
    { accessorKey: "reference_number", header: "Reference" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = (row.getValue("status") as string) || "pending";

        let className = "capitalize ";
        if (status.toLowerCase() === "paid") {
          className += "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200";
        } else if (status.toLowerCase() === "pending") {
          className += "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
        } else {
          className += "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200";
        }

        return <Badge variant="outline" className={className}>{status}</Badge>;
      },
    },
  ];

  if (isError) return <p>Error loading expenses</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Expenses</h2>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            className="w-auto"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
          <Link to={"/dashboard/accounting/add-expanse"}>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
              <Plus size={18} /> Add Expense
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
          >
            {/* Background Pattern */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{item.label}</p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {item.value}
                </h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                {item.icon}
              </div>
            </div>

            {/* Progress/Indicator line (optional visual flair) */}
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>
      <DataTable
        columns={expenseColumns}
        data={fetchedExpenses}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={data?.pagination?.total || 0}
        onPageChange={setPage}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isFetching={isFetching}
      />
    </div>
  );
}
