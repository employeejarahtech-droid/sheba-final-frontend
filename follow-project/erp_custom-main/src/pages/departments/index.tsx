import { useState } from "react";
import { Button } from "@/components/ui/button";
import AddDepartmentForm from "@/components/departments/AddDepartmentForm";
import EditDepartmentForm from "@/components/departments/EditDepartmentForm";

import { z } from "zod";
//import { Link } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import {
  useDeleteDepartmentMutation,
  useGetAllDepartmentsQuery,
} from "@/store/features/admin/departmentApiService";
import type { Department } from "@/types/types";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { StaffPermission, SuperAdminPermission } from "@/config/permissions";

export const DepartmentSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
});

export type DepartmentFormValues = z.infer<typeof DepartmentSchema>;

export default function DepartmentsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canDeleteDepartments = userPermissions.includes(StaffPermission.DELETE_DEPARTMENTS)|| userPermissions.includes(SuperAdminPermission.ACCESS_ALL);







  const { data: fetchedDepartments, isFetching } = useGetAllDepartmentsQuery({
    page,
    limit,
    search,
  });

  //console.log("Fetched Departments: ", fetchedDepartments);

  const departments: Department[] = fetchedDepartments?.data || [];

  const [deleteDepartment] = useDeleteDepartmentMutation();

  const handleDeleteDepartment = async (id: number) => {
    // Ask for confirmation using a simple toast with prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      if (!canDeleteDepartments) {
        toast.error("You do not have permission to delete this department");
        return; // Stop further execution
      }
      toast("Are you sure you want to delete this department?", {
        action: {
          label: "Delete",
          onClick: () => resolve(true), // user confirmed
        },
        duration: 3000, // auto-dismiss after 5s
      });

      // resolve false if toast disappears automatically
      setTimeout(() => resolve(false), 3000);
    });

    //console.log("User confirmed deletion: ", confirmed);

    if (!confirmed) return; // stop if user didn’t confirm

    try {
      const res = await deleteDepartment(id).unwrap();
      if (res.status) {
        toast.success("Department deleted successfully");
      } else {
        toast.error("Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
    }
  };

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: "Department",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDepartmentId(row.original.id);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDeleteDepartment(row.original.id)}
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
        <h1 className="text-3xl font-bold">Departments</h1>

        <div className="flex gap-4">
          <Button onClick={() => setAddOpen(true)}>+ Add Department</Button>
          {/* <Link to="/dashboard/staffs/add">
            <Button variant="outline">+ Add Staff</Button>
          </Link> */}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={fetchedDepartments?.pagination?.total || 0}
        onPageChange={setPage}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isFetching={isFetching}
      />

      {/* Add Sheet */}
      <AddDepartmentForm open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Sheet */}
      <EditDepartmentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        departmentId={departmentId}
      />
    </div>
  );
}
