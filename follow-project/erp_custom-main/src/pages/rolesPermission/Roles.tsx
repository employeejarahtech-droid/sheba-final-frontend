/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import AddNewRoleForm from "@/components/roles/AddRoleForm";
import { useDeleteRoleMutation, useGetAllRolesQuery } from "@/store/features/role/roleApiService";
import type { Role } from "@/types/users.types";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { RolePermission, SuperAdminPermission } from "@/config/permissions";
import { ShieldCheck, Users, XCircle } from "lucide-react";


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





export default function Roles() {
  // Form modal states
  const [open, setOpen] = useState<boolean>(false);
  // const [openEditForm, setOpenEditForm] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectRoleId, setSelectRoleId] = useState<string | number | null>(null);
  // Pagination & Search states
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;


  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canDeleteRole =
    userPermissions.includes(RolePermission.DELETE_ROLES) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);




  // Fetch roles from backend using RTK Query
  const { data, isFetching } = useGetAllRolesQuery({
    page,
    limit,
    search,
  });

  // Safe fallback
  const rolelist = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit,
    totalPage: 1,
  };

  // Stats calculation
  const totalRoles = pagination.total || 0;
  const activeRoles = rolelist.filter(r => r.status?.toLowerCase() === 'active').length;
  const inactiveRoles = rolelist.filter(r => r.status?.toLowerCase() === 'inactive').length;

  const stats = [
    {
      label: "Total Roles",
      value: totalRoles,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Roles",
      value: activeRoles,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Roles",
      value: inactiveRoles,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  const [deleteRole] = useDeleteRoleMutation()




  const handleDeleteClick = (id: string | number) => {
    setSelectRoleId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDeleteRole) {
      toast.error("You don't have permission to delete roles.");
      setModalOpen(false);
      return;
    }
    if (!selectRoleId) return;

    try {
      await deleteRole(selectRoleId).unwrap();
      toast.success("Supplier deleted successfully");
    } catch (error) {
      toast.error("Failed to delete supplier");
      console.error(error);
    } finally {
      setModalOpen(false);
      setSelectRoleId(null);
    }
  };








  // Columns for TanStack Table
  const roleColumns: ColumnDef<Role>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any,
      cell: ({ row }) => <span className="font-medium">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => <span className="font-medium">{row.getValue("role")}</span>,
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: ({ row }) => <div>{row.getValue("display_name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const color =
          status.toLowerCase() === "active"
            ? "bg-green-400"
            : status.toLowerCase() === "inactive"
              ? "bg-blue-500"
              : "bg-gray-500";

        return <Badge className={`${color} capitalize`}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/permissions/${role.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteClick(role.id)}
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
        <h1 className="text-3xl font-bold">Existing Roles</h1>
        <AddNewRoleForm open={open} setOpen={setOpen} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

      {/* Roles Table */}
      <Card className="pt-6 pb-2">
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={roleColumns}
            data={rolelist}
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
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this Role? This action cannot be undone."
      />
      {/* Edit Role Modal */}
      {/* <EditRoleForm open={openEditForm} setOpen={setOpenEditForm} /> */}


    </div>
  );
}
