
"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDeleteSupplierMutation,
  useGetAllSuppliersQuery,
} from "@/store/features/suppliers/supplierApiService";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, PlusCircle, Trash2, CheckCircle, Truck, XCircle, Users as UsersIcon, ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Supplier } from "@/types/supplier.types";
import { useAppSelector } from "@/store/store";



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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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

export default function SuppliersList() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const currency = useAppSelector((state) => state.currency.value);

  const { data: suppliersData, isLoading } = useGetAllSuppliersQuery({ search, page, limit });
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();

  // Fetch all for stats (simplified frontend calculation)
  const { data: allSuppliersData } = useGetAllSuppliersQuery({ limit: 1000 });
  const allSuppliers = allSuppliersData?.data || [];

  const totalSuppliers = suppliersData?.pagination?.total || 0;
  const activeSuppliers = allSuppliers.filter(s => s.is_active).length;
  const inactiveSuppliers = allSuppliers.filter(s => !s.is_active).length;

  const stats = [
    {
      label: "Total Suppliers",
      value: totalSuppliers,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <UsersIcon className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Suppliers",
      value: activeSuppliers,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Suppliers",
      value: inactiveSuppliers,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Top Suppliers",
      value: "5", // Placeholder as logic might be complex
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Truck className="w-6 h-6 text-white" />,
    },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number | null>(null);

  const handleDeleteClick = (id: string | number) => {
    setSelectedSupplierId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplierId) return;

    try {
      await deleteSupplier(selectedSupplierId).unwrap();
      toast.success("Supplier deleted successfully");
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error(error);
    } finally {
      setModalOpen(false);
      setSelectedSupplierId(null);
    }
  };

  const supplierColumns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
    },
    {
      accessorKey: "name",
      header: "Name",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any
    },
    {
      accessorKey: "contact_person",
      header: "Contact Person",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "total_purchase_amount",
      header: () => <div className="text-right">Total Purchase ({currency})</div>,
      cell: ({ row }) => {
        const amount = row.getValue("total_purchase_amount");
        return (
          <div className="text-right">
            {amount ? Number(amount).toFixed(2) : "0.00"}
          </div>
        );
      },
    },
    {
      accessorKey: "total_paid_amount",
      header: () => <div className="text-right">Total Paid ({currency})</div>,
      cell: ({ row }) => {
        const amount = row.getValue("total_paid_amount");
        return (
          <div className="text-right">
            {amount ? Number(amount).toFixed(2) : "0.00"}
          </div>
        );
      },
    },
    {
      accessorKey: "total_due_amount",
      header: () => <div className="text-right">Total Due ({currency})</div>,
      cell: ({ row }) => {
        const amount = row.getValue("total_due_amount");
        return (
          <div className="text-right">
            {amount ? Number(amount).toFixed(2) : "0.00"}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("is_active") as boolean;
        const color = status ? "bg-green-600" : "bg-red-600";
        return <Badge className={`${color} text-white`}>{status ? "Active" : "Inactive"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex gap-2">
            <Link to={`/dashboard/purchase-orders/create?supplierId=${supplier.id}`}>
              <Button size="sm" variant="outline" title="Create Purchase Order">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={`/dashboard/suppliers/${supplier.id}/edit`}>
              <Button size="sm" variant="outline">
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteClick(supplier.id)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Supplier Management</h1>
        <Link to="/dashboard/suppliers/create">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            Add Supplier
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`relative flex-1 min-w-[240px] overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
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

      <Card className="pt-6 pb-2">
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>Manage your supplier list</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            // Data Table
            <div className="max-w-full overflow-hidden">
              <DataTable
                columns={supplierColumns} // Assuming 'columns' was a typo and should be 'supplierColumns'
                data={suppliersData?.data || []}
                totalCount={suppliersData?.pagination?.total || 0}
                pageIndex={page - 1}
                pageSize={limit}
                onPageChange={(idx) => setPage(idx + 1)}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1); // Retaining the setPage(1) logic from original onSearch
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </div>
  );
}
