import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Boxes, AlertTriangle, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  useGetAllRawMaterialsQuery,
  useDeleteRawMaterialMutation,
} from "@/store/features/admin/rawMaterialApiService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";

const RawMaterialsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Fetch raw materials
  const { data: rawMaterialsData, isFetching, refetch } = useGetAllRawMaterialsQuery({
    page,
    limit,
    search: search || undefined,
  });

  console.log("rawMaterialsData", rawMaterialsData);

  const [deleteRawMaterial] = useDeleteRawMaterialMutation();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRawMaterial(deleteId).unwrap();
      toast.success("Raw material deleted successfully!");
      refetch();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting raw material:", error);
      toast.error("Failed to delete raw material");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Material Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span>{row.getValue("sku") || "-"}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return <span>{category?.name || "-"}</span>;
      },
    },
    {
      accessorKey: "stock_level",
      header: "Stock Level",
      cell: ({ row }) => {
        const stock = row.original.initial_stock;
        const unit = row.original.unit;
        const unitName = typeof unit === "string" ? unit : unit?.name || "";
        return <span>{stock} {unitName}</span>;
      },
    },
    {
      accessorKey: "cost",
      header: "Cost Price",
      cell: ({ row }) => {
        const cost = row.getValue("cost") as number;
        return <span className="font-medium">${cost.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => <span>{row.getValue("supplier") || "-"}</span>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active");
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigate(`/dashboard/raw-materials/${row.original.id}`)
              }
              className="cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate(`/dashboard/raw-materials/edit/${row.original.id}`)
              }
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original.id)}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const rawMaterials = rawMaterialsData?.data || [];

  // Calculate stats
  const totalMaterials = rawMaterialsData?.pagination?.total || 0;
  const lowStockMaterials = rawMaterials.filter(
    (m) => m.initial_stock < m.min_stock
  ).length;
  const activeSuppliers = new Set(rawMaterials.map((m) => m.supplier)).size;

  const stats = [
    {
      label: "Total Materials",
      value: totalMaterials,
      color: "bg-blue-600",
      icon: <Boxes className="w-10 h-10 opacity-80" />,
    },
    {
      label: "Low Stock",
      value: lowStockMaterials,
      color: "bg-red-600",
      icon: <AlertTriangle className="w-10 h-10 opacity-80" />,
    },
    {
      label: "Active Suppliers",
      value: activeSuppliers,
      color: "bg-green-700",
      icon: <Truck className="w-10 h-10 opacity-80" />,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">Raw Material Management</h2>
        <Link to="/dashboard/raw-materials/add">
          <Button className="bg-blue-600 hover:bg-blue-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`${item.color} text-white rounded-xl p-6 flex justify-between items-center shadow-lg`}
          >
            <div>
              <h3 className="text-3xl font-bold">{item.value}</h3>
              <p className="text-sm mt-1 opacity-90">{item.label}</p>
            </div>
            {item.icon}
          </div>
        ))}
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Raw Materials Inventory</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rawMaterials}
            pageIndex={page - 1}
            pageSize={limit}
            onPageChange={(page) => setPage(page + 1)}
            totalCount={rawMaterialsData?.pagination?.total || 0}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            isFetching={isFetching}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Raw Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this raw material? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RawMaterialsPage;
