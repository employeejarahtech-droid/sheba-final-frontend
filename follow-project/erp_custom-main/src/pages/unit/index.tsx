import { useState } from "react";
import { Button } from "@/components/ui/button";
import AddUnitForm from "@/components/products/AddUnitForm";
import EditUnitForm from "@/components/products/EditUnitForm";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useDeleteUnitMutation,
  useGetAllUnitsQuery,
} from "@/store/features/admin/productsApiService";
import type { Unit } from "@/types/types";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { ProductPermission, SuperAdminPermission } from "@/config/permissions";

export default function UnitsPage() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [unitId, setUnitId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);

  // Units permissions
  const canDeleteUnits = userPermissions.includes(ProductPermission.DELETE_UNITS) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);





  const {
    data: fetchedUnits,
    isFetching,
    refetch: refetchUnits,
  } = useGetAllUnitsQuery({ page, limit, search });

  const units: Unit[] = fetchedUnits?.data || [];
  const pagination = fetchedUnits?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const [deleteUnit] = useDeleteUnitMutation();
  const handleDeleteUnit = async (id: number) => {
    // Ask for confirmation using a simple toast with prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      if (!canDeleteUnits) {
        toast.error("You do not have permission to delete this unit");
        return; // Stop further execution
      }

      // Proceed with delete logic if permission exists
      toast("Are you sure you want to delete this unit?", {
        action: {
          label: "Delete",
          onClick: () => resolve(true), // user confirmed
        },
        duration: 10000, // auto-dismiss after 5s
      });

      // resolve false if toast disappears automatically
      setTimeout(() => resolve(false), 10000);
    });

    console.log("User confirmed deletion: ", confirmed);

    if (!confirmed) return; // stop if user didn’t confirm

    try {
      const res = await deleteUnit(id).unwrap();
      if (res.status) {
        toast.success("Unit deleted successfully");
        refetchUnits();
      } else {
        toast.error("Failed to delete unit");
      }
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast.error(error?.data?.message || "Failed to delete unit");
    }
  };

  const columns: ColumnDef<Unit>[] = [
    { accessorKey: "name", header: "Unit Name" },
    { accessorKey: "symbol", header: "Short Code" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.is_active;

        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => {
        const unit = row.original as Unit;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditSheetOpen(true);
                setUnitId(unit.id);
              }}
            >
              Edit
            </Button>

            <Button
              variant="destructive"
              onClick={() => handleDeleteUnit(unit.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Unit Management</h1>

        <Button onClick={() => setAddSheetOpen(true)}>+ Add Unit</Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={units}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={pagination?.total}
        onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isFetching={isFetching}
      />

      {/* Add Form */}
      <AddUnitForm
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        refetchUnits={refetchUnits}
      />

      {/* Edit Form */}
      <EditUnitForm
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        unitId={unitId}
        refetchUnits={refetchUnits}
      />
    </div>
  );
}
