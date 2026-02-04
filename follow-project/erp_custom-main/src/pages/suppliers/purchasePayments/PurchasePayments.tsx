import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetAllPurchasePaymentsQuery } from "@/store/features/purchaseOrder/purchaseOrderApiService";

import type { PurchasePayment } from "@/types/purchasePayment.types";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Banknote, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useAppSelector } from "@/store/store";

export default function PurchasePayments() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const { data: paymentData, isFetching } = useGetAllPurchasePaymentsQuery({
    page,
    limit,
    search,
  });

  const currency = useAppSelector((state) => state.currency.value);

  // Fetch all for stats (simplified frontend calculation)
  const { data: allPaymentsData } = useGetAllPurchasePaymentsQuery({ limit: 1000 });
  const allPayments = (Array.isArray(allPaymentsData?.data) ? allPaymentsData?.data : []) as any[];

  const totalPayments = paymentData?.pagination?.total ?? 0;
  const completedPayments = allPayments.filter((p) => p.status === "completed").length;
  const pendingPayments = allPayments.filter((p) => p.status === "pending").length;
  const failedPayments = allPayments.filter((p) => p.status === "failed" || p.status === "refunded").length;

  const stats = [
    {
      label: "Total Payments",
      value: totalPayments,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Banknote className="w-6 h-6 text-white" />,
    },
    {
      label: "Completed",
      value: completedPayments,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Pending",
      value: pendingPayments,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "Failed/Refunded",
      value: failedPayments,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  const payments = paymentData?.data;

  const columns: ColumnDef<PurchasePayment>[] = [
    {
      accessorKey: "id",
      header: "Payment #",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[120px]" } as any,
      cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
    },
    {
      accessorKey: "purchase_order.po_number",
      header: "PO Number",
      meta: { className: "md:sticky md:left-[120px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => row.original.purchase_order.po_number ?? "-",
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const supplier = row.original.purchase_order?.supplier;
        if (!supplier) return "-";

        return (
          <div className="font-semibold">{supplier.name}</div>
        );
      },
    },
    {
      accessorKey: "invoice.invoice_number",
      header: "Invoice #",
      cell: ({ row }) => row.original.invoice?.invoice_number ?? "-",
    },
    {
      accessorKey: "payment_date",
      header: "Payment Date",
      cell: ({ row }) => new Date(row.original.payment_date).toLocaleString(),
    },
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.original.payment_method;

        const color =
          method === "cash"
            ? "bg-yellow-500"
            : method === "bank_transfer"
              ? "bg-blue-500"
              : method === "card"
                ? "bg-purple-500"
                : "bg-gray-600";

        return <Badge className={color}>{method}</Badge>;
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-right">Amount ({currency})</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">{Number(row.original.amount).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => row.original.reference_number ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color =
          status === "completed"
            ? "bg-green-600"
            : status === "pending"
              ? "bg-yellow-500"
              : "bg-red-600";

        return <Badge className={color}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/purchase-payments/${payment.id}`}>
              <Button size="sm" variant="outline">View</Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Payments</h1>

        <Link to="/dashboard/purchase-payments/create">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            Record Payment
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
        columns={columns}
        data={payments ?? []}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={paymentData?.pagination?.total ?? 0}
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
