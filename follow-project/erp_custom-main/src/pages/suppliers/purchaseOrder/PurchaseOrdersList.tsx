/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useDeletePurchaseOrderMutation, useGetAllPurchasesQuery, useUpdatePurchaseOrderMutation } from "@/store/features/purchaseOrder/purchaseOrderApiService";
import { useAppSelector } from "@/store/store";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2, FileText, CheckCircle, Clock, XCircle, PlusCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";


// Simple confirmation modal
function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* COMPONENT */
export default function PurchaseOrdersList() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;
  const { data, isFetching } = useGetAllPurchasesQuery({ page, limit, search });
  const purchaseOrdersData: PurchaseOrder[] = Array.isArray(data?.data)
    ? data.data
    : [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const { data: allPOData } = useGetAllPurchasesQuery({ limit: 1000 });
  const allPOs = (Array.isArray(allPOData?.data) ? allPOData?.data : []) as any[];

  const totalPOs = data?.pagination?.total || 0;
  const approvedPOs = allPOs.filter((po: any) => po.status === "approved" || po.status === "received").length;
  const pendingPOs = allPOs.filter((po: any) => po.status === "pending").length;
  const rejectedPOs = allPOs.filter((po: any) => po.status === "rejected").length;

  const stats = [
    {
      label: "Total Orders",
      value: totalPOs,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <FileText className="w-6 h-6 text-white" />,
    },
    {
      label: "Approved/Received",
      value: approvedPOs,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Pending Orders",
      value: pendingPOs,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "Rejected Orders",
      value: rejectedPOs,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  const currency = useAppSelector((state) => state.currency.value);

  const [deletePurchaseOrder, { isLoading: isDeleting }] =
    useDeletePurchaseOrderMutation();


  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);

  /* DELETE HANDLER */
  const handleDelete = useCallback(async () => {
    if (!selectedPOId) return;

    try {
      const res = await deletePurchaseOrder(selectedPOId).unwrap();
      if (res.status) {
        toast.success("Purchase Order Deleted Successfully");
      } else {
        toast.error(res?.message || "Delete failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Delete failed");
    } finally {
      setModalOpen(false);
      setSelectedPOId(null);
    }
  }, [selectedPOId, deletePurchaseOrder]);





  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();

  const handleApprove = async (id: number) => {
    try {
      const res = await updatePurchaseOrder({ id, body: { status: "approved" } }).unwrap();
      if (res.status) {
        toast.success("Purchase Order Approved Successfully");
      } else {
        toast.error(res?.message || "Approve failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Approve failed");
    }
  };

  /* COLUMNS */
  const poColumns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "po_number",
      header: "PO Number",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[120px]" } as any
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      meta: { className: "md:sticky md:left-[120px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => `${row.original.supplier?.name || "N/A"}`,
    },
    {
      accessorKey: "order_date",
      header: "Order Date",
      cell: ({ row }) => new Date(row.original.order_date as string).toLocaleDateString(),
    },
    {
      accessorKey: "expected_delivery_date",
      header: "Expected Delivery Date",
      cell: ({ row }) => new Date(row.original.expected_delivery_date as string).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        const color =
          status === "pending"
            ? "bg-yellow-500"
            : status === "approved"
              ? "bg-blue-600"
              : status === "rejected"
                ? "bg-red-600"
                : "bg-green-600";

        return <Badge className={`${color} text-white capitalize`}>{status}</Badge>;
      },
    },
    {
      accessorKey: "total_amount",
      header: () => <div className="text-right">Total Price ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">{row.original.total_amount.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "discount_amount",
      header: () => (
        <div className="text-right">Total Discount ({currency})</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.discount_amount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "tax_amount",
      header: () => <div className="text-right">Tax Amount ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">{row.original.tax_amount.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "total_payable_amount",
      header: () => <div className="text-right">Total Payable ({currency})</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.total_payable_amount.toFixed(2)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const po = row.original;
        const isEditable = !["approved", "received", "delivered"].includes(po.status); // hide for approved, received, delivered
        const isPending = po.status === "pending";

        return (
          <div className="flex gap-2">
            {isPending && (
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white"
                onClick={() => handleApprove(Number(po.id))}
                disabled={isUpdating}
                title="Approve Order"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}

            <Link to={`/dashboard/purchase-orders/${po.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" /> View
              </Button>
            </Link>

            {isEditable && (
              <>
                <Link to={`/dashboard/purchase-orders/${po.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => {
                    setSelectedPOId(Number(po.id));
                    setModalOpen(true);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        );
      },
    }
  ];







  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Purchase Orders
        </h1>
        <Link to="/dashboard/purchase-orders/create">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            Add Purchase Order
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

      <Card className="py-6">
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>Manage all your purchase orders</CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={poColumns}
            data={purchaseOrdersData}
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
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </div>
  );
}
