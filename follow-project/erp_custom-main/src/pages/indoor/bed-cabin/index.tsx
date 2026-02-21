import { useState } from "react";
import { Button } from "@/components/ui/button";
import AddBedCabinForm from "@/components/indoor/bed-cabin/AddBedCabinForm";
import EditBedCabinForm from "@/components/indoor/bed-cabin/EditBedCabinForm";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import {
  useDeleteBedCabinMutation,
  useGetAllBedCabinsQuery,
} from "@/store/features/indoor/bedCabinApiService";
import type { BedCabin } from "@/store/features/indoor/bedCabinApiService";
import { toast } from "sonner";

export default function BedCabinListPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bedCabinId, setBedCabinId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const { data: fetchedBedCabins, isFetching, error } = useGetAllBedCabinsQuery({
    page,
    limit,
    search,
  });

  // Debug logging
  console.log("Raw API response:", fetchedBedCabins);
  console.log("Error:", error);

  const bedCabins: BedCabin[] = fetchedBedCabins?.data?.items || [];
  const totalCount = fetchedBedCabins?.data?.meta?.total || 0;

  console.log("Parsed bedCabins:", bedCabins);
  console.log("Parsed totalCount:", totalCount);

  const [deleteBedCabin] = useDeleteBedCabinMutation();

  const handleDeleteBedCabin = async (id: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast("Are you sure you want to delete this bed/cabin?", {
        action: {
          label: "Delete",
          onClick: () => resolve(true),
        },
        duration: 3000,
      });
      setTimeout(() => resolve(false), 3000);
    });

    if (!confirmed) return;

    try {
      const res = await deleteBedCabin(id).unwrap();
      if (res.status) {
        toast.success("Bed/Cabin deleted successfully");
      } else {
        toast.error("Failed to delete bed/cabin");
      }
    } catch (error) {
      console.error("Error deleting bed/cabin:", error);
      toast.error("Failed to delete bed/cabin");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Available</span>;
      case "Occupied":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Occupied</span>;
      case "Maintenance":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Maintenance</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Bed":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Bed</span>;
      case "Cabin":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Cabin</span>;
      case "Special":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Special</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  const columns: ColumnDef<BedCabin>[] = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: "ward",
      header: "Ward",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBedCabinId(row.original.id);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteBedCabin(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Bed/Cabin Management</h1>
        <Button onClick={() => setAddOpen(true)}>+ Add Bed/Cabin</Button>
      </div>

      {/* Debug Info - Check console and this section */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-semibold mb-2">Debug Info:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span>isFetching: <strong>{isFetching ? 'true' : 'false'}</strong></span>
          <span>bedCabins length: <strong>{bedCabins.length}</strong></span>
          <span>totalCount: <strong>{totalCount}</strong></span>
          <span>page: <strong>{page}</strong></span>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
            <p className="font-semibold">Error:</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
        {fetchedBedCabins && (
          <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
            <p className="font-semibold">API Response:</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(fetchedBedCabins, null, 2)}</pre>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={bedCabins}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isFetching={isFetching}
      />

      {/* Add Sheet */}
      <AddBedCabinForm open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Sheet */}
      <EditBedCabinForm
        open={editOpen}
        onOpenChange={setEditOpen}
        bedCabinId={bedCabinId}
      />
    </div>
  );
}
