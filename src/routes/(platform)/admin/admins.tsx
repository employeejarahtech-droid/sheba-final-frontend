import { useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdmins,
  useDeleteAdmin,
  useUpdateAdmin,
} from "@/hooks/usePlatformAdmin";
import { usePlatformAuthStore } from "@/stores/platform-auth-store";
import { CreateAdminForm } from "@/features/platform/admins/components/CreateAdminForm";

export const Route = createFileRoute("/(platform)/admin/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { user } = usePlatformAuthStore();
  const { data, isLoading } = useAdmins({ page, limit, search });
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();

  // Only super_admin can access this page
  if (user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          Only super admins can manage admin users.
        </p>
      </div>
    );
  }

  const admins = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  function getRoleBadgeVariant(
    role: string
  ): "destructive" | "default" | "secondary" {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "secondary";
    }
  }

  function handleToggleActive(
    adminId: string,
    currentIsActive: boolean
  ) {
    updateAdmin.mutate({
      id: adminId,
      data: { is_active: !currentIsActive },
    });
  }

  function handleDelete(adminId: string) {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteAdmin.mutate(adminId);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Users
          </h1>
          <p className="text-muted-foreground">
            Manage platform administrators and their roles.
          </p>
        </div>
        <CreateAdminForm />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search admins by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <p className="text-muted-foreground">Loading admins...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground">No admin users found.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.name}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(admin.role)}>
                        {admin.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {admin.last_login
                        ? new Date(admin.last_login).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(admin.id, admin.is_active)
                          }
                          disabled={updateAdmin.isPending}
                          title={
                            admin.is_active
                              ? "Deactivate admin"
                              : "Activate admin"
                          }
                        >
                          {admin.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          disabled={deleteAdmin.isPending}
                          title="Delete admin"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Outlet />
    </div>
  );
}
