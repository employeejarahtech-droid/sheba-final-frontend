import { DataTable } from "@/components/dashboard/components/DataTable";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeleteStaffMutation,
  useGetAllStaffsQuery,
} from "@/store/features/staffs/staffApiService";
import type { Department, Staff } from "@/types/types";
import type { Role } from "@/types/users.types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarX2,
  Clock,
  PlusCircle,
  Trash,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

// Simple modal
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

export default function Staffs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);
  const { data: staffsData, isLoading } = useGetAllStaffsQuery({
    page,
    limit,
    search,
  });
  const staffsList = staffsData?.data as Staff[] | [];
  const [deleteStaff] = useDeleteStaffMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  // -----------------------------------------
  //  DYNAMIC STATS BASED ON API RESPONSE
  // -----------------------------------------
  const totalStaff = staffsList?.length;

  const activeStaff = staffsList?.filter(
    (s: Staff) => s.status.toLowerCase() === "Active"
  ).length;

  const inactiveStaff = staffsList?.filter(
    (s: Staff) => s.status.toLowerCase() === "Inactive"
  ).length;

  const onLeaveStaff = staffsList?.filter(
    (s) => s.status.toLowerCase() === "On Leave"
  ).length;
  // If your DB uses "leave" or "onLeave", update the string.

  const stats = [
    {
      label: "Total Staffs",
      value: totalStaff,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Staffs",
      value: activeStaff,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "On Leave",
      value: onLeaveStaff,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <CalendarX2 className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Staffs",
      value: inactiveStaff,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  // -----------------------
  // DELETE HANDLER
  // -----------------------
  const handleDeleteClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStaff) return;
    try {
      await deleteStaff(selectedStaff.id).unwrap();
      toast.success("Staff deleted successfully!");
      setModalOpen(false);
      setSelectedStaff(null);
    } catch (err) {
      toast.error("Failed to delete staff.");
      console.error(err);
    }
  };

  const staffColumns: ColumnDef<Staff>[] = [
    {
      accessorKey: "id",
      header: "Employee ID #",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[140px]" } as any,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("id")}</span>
      ),
    },

    {
      accessorKey: "first_name",
      header: "Name",
      meta: { className: "md:sticky md:left-[140px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      cell: ({ row }) => (
        <div className="font-semibold">
          {row.original?.first_name} {row.original?.last_name}
        </div>
      ),
    },
    {
      accessorKey: "thumb_url",
      header: "Image",
      cell: ({ row }) => {
        const image = row.getValue("thumb_url") as string;
        return (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={image} />
            </Avatar>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },

    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        const department = row.getValue("department") as Department | null;
        return <div className="font-normal">{department?.name}</div>;
      },
    },

    {
      accessorKey: "position",
      header: "Position",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as Role | null;
        return <div className="font-normal">{role?.display_name}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        const color =
          status.toLowerCase() === "active"
            ? "bg-green-600"
            : status.toLowerCase() === "inactive"
              ? "bg-red-500"
              : "bg-gray-500";

        return <Badge className={`${color} text-white capitalize`}>{status}</Badge>;
      },
    },

    {
      accessorKey: "created_at",
      header: "Hire Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string);
        return date.toLocaleDateString();
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Link to={`/dashboard/staffs/${item.id}`}>
              <Button size="sm" variant="outline-info">
                View
              </Button>
            </Link>
            <Link to={`/dashboard/staffs/${item.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteClick(item)}
            >
              <Trash className="w-4 h-4 mr-1" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Staffs Management</h1>

        <Link to="/dashboard/staffs/add">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <PlusCircle size={18} />
            Add Staff
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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

      <Card className="pt-6 pb-2">
        <CardHeader>
          <CardTitle>All Staffs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <DataTable
              columns={staffColumns}
              data={staffsList ?? []}
              pageIndex={page - 1}
              pageSize={limit}
              totalCount={staffsData?.pagination?.total}
              onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              isFetching={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
        message={`Are you sure you want to delete ${selectedStaff?.first_name} ${selectedStaff?.last_name}?`}
      />
    </div>
  );
}
