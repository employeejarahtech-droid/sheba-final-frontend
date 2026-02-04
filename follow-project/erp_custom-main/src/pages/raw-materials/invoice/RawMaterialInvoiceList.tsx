import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { PlusCircle, Eye, Trash2, CreditCard } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  useGetAllRawMaterialPurchaseInvoicesQuery,
  type RawMaterialInvoice,
  useDeleteRawMaterialPurchaseInvoiceMutation,
} from "@/store/features/admin/rawMaterialApiService";
import { useAppSelector } from "@/store/store";
import { toast } from "sonner";

export default function RMInvoiceList() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  //const navigate = useNavigate();
  const limit = 10;

  const { data, isFetching } = useGetAllRawMaterialPurchaseInvoicesQuery({
    page,
    limit,
    search,
  });

  const [deleteInvoice] = useDeleteRawMaterialPurchaseInvoiceMutation();

  const invoicesData: RawMaterialInvoice[] = Array.isArray(data?.data)
    ? data.data
    : [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const currency = useAppSelector((state) => state.currency.value);

  const handleDelete = (id: number | undefined) => {
    if (!id) return;

    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-red-200">
          <p className="mb-4 font-semibold">
            Are you sure you want to delete this invoice?
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
                  await deleteInvoice(id).unwrap();
                  toast.success("Invoice deleted successfully");
                  toast.dismiss(t);
                } catch (error) {
                  console.error("Error deleting invoice:", error);
                  toast.error("Failed to delete invoice");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Table Columns
  const invoiceColumns: ColumnDef<RawMaterialInvoice>[] = [
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
    },
    {
      accessorKey: "purchase_order",
      header: "PO Number",
      cell: ({ row }) => `PO #${row.original.purchase_order?.po_number || "-"}`,
    },
    {
      accessorKey: "purchase_order.supplier.name",
      header: "Supplier",
      cell: ({ row }) =>
        `${row.original.purchase_order?.supplier?.name || "-"}`,
    },
    {
      accessorKey: "invoice_date",
      header: "Invoice Date",
      cell: ({ row }) => {
        const date = new Date(row.original.invoice_date);
        return date.toISOString().split("T")[0];
      },
    },
    {
      accessorKey: "total_payable_amount",
      header: `Total Amount (${currency})`,
      cell: ({ row }) =>
        `${Number(row.original.total_payable_amount || 0).toFixed(2)}`,
    },
    {
      accessorKey: "paid_amount",
      header: `Paid Amount (${currency})`,
      cell: ({ row }) => `${Number(row.original.paid_amount || 0).toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "pending";
        const color =
          status === "paid"
            ? "bg-green-600"
            : status === "pending"
              ? "bg-yellow-600"
              : "bg-gray-400";

        return (
          <Badge className={`${color} text-white capitalize`}>{status}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <div className="flex gap-2">
            <Link to={`/dashboard/raw-materials/invoices/${invoice.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </Button>
            </Link>
            {invoice.status !== "paid" && (
              <Link to={`/dashboard/raw-materials/payments/create?po_id=${invoice.purchase_order?.id}&invoice_id=${invoice.id}`}>
                <Button size="sm" variant="outline">
                  <CreditCard className="w-4 h-4" />
                  <span>Pay</span>
                </Button>
              </Link>
            )}
            {invoice.status !== "paid" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(invoice.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Invoices & GRN (Raw Materials)</h1>
        <Link to="/dashboard/raw-materials/payments/create">
          <Button className="bg-blue-600 hover:bg-blue-500">
            <PlusCircle className="h-4 w-4" /> Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices (Raw Materials)</CardTitle>
          <CardDescription>Manage all your purchase invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={invoiceColumns}
            data={invoicesData}
            pageIndex={page - 1}
            pageSize={limit}
            totalCount={pagination.total}
            onPageChange={(p) => setPage(p + 1)}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            isFetching={isFetching}
          />
        </CardContent>
      </Card>
    </div>
  );
}
