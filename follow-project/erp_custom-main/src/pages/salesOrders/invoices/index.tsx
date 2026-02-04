/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";


import { useGetSalesInvoicesQuery } from "@/store/features/salesOrder/salesOrder";
import type { SalesInvoice } from "@/types/salesInvoice.types";
import { useAppSelector } from "@/store/store";

export default function Invoices() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  // Fetch invoices with pagination & search
  const { data: fetchedInvoices, isFetching } = useGetSalesInvoicesQuery({
    page,
    limit,
    search,
  });

  const invoices: SalesInvoice[] = fetchedInvoices?.data || [];
  const pagination = fetchedInvoices?.pagination ?? {
    total: 0,
    page: 1,
    limit,
    totalPage: 1,
  };

  const currency = useAppSelector((state) => state.currency.value);

  // Stats calculation
  const totalInvoices = pagination.total;
  // Note: This is an estimation based on current page if fetch all isn't available, 
  // but ideally we'd fetch stats from API. Using fetchedInvoices for now or fetch all.

  // Fetching all for accurate stats - optional optimization: create specific stats endpoint
  const { data: allInvoicesData } = useGetSalesInvoicesQuery({ limit: 1000 });
  const allInvoices = allInvoicesData?.data || [];

  const paidInvoices = allInvoices.filter(i => i.status === 'paid').length;
  const pendingInvoices = allInvoices.filter(i => i.status === 'pending' || i.status === 'partial').length;
  const overdueInvoices = allInvoices.filter(i => i.status === 'overdue').length;

  const stats = [
    {
      label: "Total Invoices",
      value: totalInvoices,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <FileText className="w-6 h-6 text-white" />,
    },
    {
      label: "Paid Invoices",
      value: paidInvoices,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Pending/Partial",
      value: pendingInvoices,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "Overdue Invoices",
      value: overdueInvoices,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
    },
  ];

  const invoiceColumns: ColumnDef<SalesInvoice>[] = [
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[120px]" } as any,
      cell: ({ row }) => <span className="font-medium">{row.getValue("invoice_number")}</span>,
    },
    {
      accessorKey: "order.customer.name",
      header: "Customer",
      meta: { className: "md:sticky md:left-[120px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => row.original?.order?.customer.name,
    },
    {
      accessorKey: "order.order_number",
      header: "Order #",
      cell: ({ row }) => row.original?.order?.order_number,
    },
    {
      accessorKey: "invoice_date",
      header: "Invoice Date",
      cell: ({ row }) => new Date(row.getValue("invoice_date")).toLocaleDateString(),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => new Date(row.getValue("due_date")).toLocaleDateString(),
    },
    {
      accessorKey: "total_amount",
      header: () => (
        <div className="text-right">Total Amount ({currency})</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("total_amount")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "total_payable",
      header: () => (
        <div className="text-right">Total Payable ({currency})</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("total_payable")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "paid_amount",
      header: () => (
        <div className="text-right">Paid Amount ({currency})</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("paid_amount")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "remaining_balance",
      header: () => <div className="text-right">Due Amount ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("remaining_balance")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const color =
          status === "paid"
            ? "bg-green-500"
            : status === "draft"
              ? "bg-yellow-500"
              : "bg-gray-500";
        return <Badge className={color}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/sales/invoices/${invoice.id}`}>
              <Button size="sm" variant="outline-info">View</Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Invoices</h1>
        <Link to="/dashboard/sales/orders/create">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            Create Order
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* DataTable */}
      <DataTable
        columns={invoiceColumns}
        data={invoices}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={pagination.total}
        onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        isFetching={isFetching}
      />
    </div>
  );
}
