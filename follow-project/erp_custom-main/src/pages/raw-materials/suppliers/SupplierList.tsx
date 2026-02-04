import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetAllRawMaterialSuppliersQuery, useDeleteRawMaterialSupplierMutation } from "@/store/features/admin/rawMaterialApiService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Supplier = {
  id: number | string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
};

export default function RMSupplierList() {
    const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useGetAllRawMaterialSuppliersQuery({
    page,
    limit,
    search,
  });

  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteRawMaterialSupplierMutation();

  const suppliers: Supplier[] =
    data?.data?.map((supplier) => ({
      id: supplier.id || 0,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      is_active: supplier.is_active,
    })) || [];

  const handleDelete = (id: number | string, name: string) => {
    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-red-500">
        <p className="font-semibold text-gray-800 mb-4">
          Are you sure you want to Delete "{name}"?
        </p>
        <p className="text-gray-600 text-sm mb-4">
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.dismiss(t)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              try {
                const res = await deleteSupplier(id).unwrap();
                if (res?.status) {
                  toast.success("Supplier deleted successfully");
                  toast.dismiss(t);
                }
              } catch (error) {
                console.error("Error deleting supplier:", error);
                toast.error("Failed to delete supplier");
              }
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: "name", header: "Supplier Name" },
    { accessorKey: "phone", header: "Contact" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "address", header: "Address" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs text-white ${
            row.original.is_active ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
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
                navigate(`/dashboard/raw-materials/suppliers/edit/${row.original.id}`)
              }
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id, row.original.name)}
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

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">Raw Material Suppliers</h2>
        <Link to="/dashboard/raw-materials/suppliers/create">
          <Button className="bg-blue-600 hover:bg-blue-500">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={suppliers}
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
