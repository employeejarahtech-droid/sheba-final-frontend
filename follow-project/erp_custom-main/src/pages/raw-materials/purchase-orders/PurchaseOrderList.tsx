import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Eye, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useGetAllRawMaterialPurchaseOrdersQuery, useDeleteRawMaterialPurchaseOrderMutation, type RawMaterialPurchaseOrder } from "@/store/features/admin/rawMaterialApiService";
import { useAppSelector } from "@/store/store";
import { toast } from "sonner";

export default function RMPurchaseOrderList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useGetAllRawMaterialPurchaseOrdersQuery({
    page,
    limit: 10,
    search,
  });

  const [deleteOrder] = useDeleteRawMaterialPurchaseOrderMutation();

  const currency = useAppSelector((state) => state.currency.value);

  const purchaseOrders: RawMaterialPurchaseOrder[] = Array.isArray(data?.data) ? data.data : [];

  const handleDelete = (id: number) => {
    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-red-200">
          <p className="mb-4 font-semibold">
            Are you sure you want to delete this purchase order?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteOrder(id).unwrap();
                  toast.success("Purchase order deleted successfully");
                  toast.dismiss(t);
                } catch (error) {
                  console.error("Error deleting purchase order:", error);
                  toast.error("Failed to delete purchase order");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const columns: ColumnDef<RawMaterialPurchaseOrder>[] = [
    {
      accessorKey: "po_number",
      header: "PO Number",
      cell: ({ row }) => `${row.original.po_number}`,
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier?.name || "-",
    },
    {
      accessorKey: "order_date",
      header: "Order Date",
      cell: ({ row }) => {
        const date = new Date(row.original.order_date as string);
        return date.toISOString().split("T")[0];
      },
    },
    {
      accessorKey: "expected_delivery_date",
      header: "Expected Delivery Date",
      cell: ({ row }) => {
        const date = new Date(row.original.expected_delivery_date as string);
        return date.toISOString().split("T")[0];
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => (
        <span>
          {currency} {row.original.total_amount?.toFixed(2) || "0"}
        </span>
      ),
    },
    {
      accessorKey: "total_payable_amount",
      header: "Total Payable Amount",
      cell: ({ row }) => (
        <span>
          {currency} {(row.original.total_payable_amount !== undefined && row.original.total_payable_amount !== null) ? Number(row.original.total_payable_amount).toFixed(2) : "0"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusMap: Record<string, string> = {
          approved: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
          rejected: "bg-red-100 text-red-800",
        };
        const statusValue = row.original.status ?? "pending";
        const status = (typeof statusValue === "string" ? statusValue : "pending").toLowerCase();
        const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
        return (
          <Badge className={statusMap[status] || "bg-gray-100 text-gray-800"}>
            {displayStatus}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const statusStr = (row.original.status ?? "pending").toString().toLowerCase();
        const isEditable = !["approved", "received", "delivered"].includes(statusStr);
        return (
          <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(
                `/dashboard/raw-materials/purchase-orders/${row.original.id}`
              )
            }
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isEditable && (
              <>
                <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(
                `/dashboard/raw-materials/purchase-orders/edit/${row.original.id}`
              )
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row.original.id!)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Purchase Orders (Raw Materials)
        </h2>
        <Link to="/dashboard/raw-materials/purchase-orders/create">
          <Button className="bg-blue-600 hover:bg-blue-500">
            <PlusCircle className="h-4 w-4" /> Create PO
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PO List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={purchaseOrders}
            totalCount={data?.pagination?.total || 0}
            pageIndex={page - 1}
            pageSize={10}
            onPageChange={(p) => setPage(p + 1)}
            onSearch={setSearch}
            isFetching={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
