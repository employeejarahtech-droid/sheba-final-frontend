/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAllUsersQuery } from "@/store/features/users/usersApiService";
import type { User } from "@/types/users.types";

import type { ColumnDef } from "@tanstack/react-table";
import { Users, UserPlus, UserCheck, Eye, Pencil } from "lucide-react";

import { useState } from "react";
import { Link } from "react-router";

export default function UsersList() {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit,] = useState(10)
  const { data: usersData } = useGetAllUsersQuery({ page: pageIndex, limit, search: searchTerm });

  const users = (usersData?.data as User[]) || [];

  // -------------------- DYNAMIC STATS --------------------
  const totalUsers = usersData?.pagination?.total || 0;
  const activeUsers = users.filter(
    (u) => u.status?.toLowerCase() === "active"
  ).length;
  const adminUsers = users.filter(
    (u) => u.role?.display_name === "Admin"
  ).length;

  const stats = [
    {
      label: "Active Users",
      value: activeUsers,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <UserCheck className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Users",
      value: totalUsers,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Admins",
      value: adminUsers,
      gradient: "from-purple-600 to-purple-400",
      shadow: "shadow-purple-500/30",
      icon: <UserPlus className="w-6 h-6 text-white" />,
    },
    // Adding a 4th dummy card for grid balance if desired, or keep 3. keeping 3 for now but adjusted styles.
  ];

  // -------------------- TABLE COLUMNS --------------------
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "User ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
    },
    {
      accessorKey: "name",
      header: "Name",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role.name", header: "Role" },

    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   cell: ({ row }) => {
    //     const status = row.getValue("status") as string;
    //     const bgColor = status.toLowerCase() === "active" ? "bg-green-500" : "bg-red-500";
    //     return <span className={`py-1 px-2 rounded-full text-xs text-white font-medium ${bgColor}`}>{status}</span>;
    //   },
    // },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.id;
        console.log("User ID:", id);

        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/users/${id}`}>
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>

            <Link to={`/dashboard/users/${id}/edit`}>
              <Button variant="secondary" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">All Users</h2>

        <Link to="/dashboard/users/add">
          <button className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
            <UserPlus size={18} />
            Add User
          </button>
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5`}
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

      {/* TABLE */}
      <Card className="pt-6 pb-2">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={users}
            pageIndex={pageIndex - 1}
            pageSize={limit}
            totalCount={usersData?.pagination?.total || 0}
            onPageChange={(newPageIndex) => setPageIndex(newPageIndex + 1)}
            onSearch={(value) => {
              setSearchTerm(value);
              setPageIndex(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
