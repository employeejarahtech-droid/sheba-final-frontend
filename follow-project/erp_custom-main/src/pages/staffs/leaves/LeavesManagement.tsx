/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import {  CalendarPlus, Check, MoreHorizontal, X } from "lucide-react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { useGetAllLeavesQuery, useUpdateLeaveStatusMutation } from "@/store/features/leave/leaveApiService";

export default function LeavesManagement() {
  const { data: leavesData, isLoading, refetch } = useGetAllLeavesQuery();
  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();


  const leaves = (leavesData?.data as any[]) || [];

  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    try {
      await updateLeaveStatus({ id, status }).unwrap();
      toast.success(`Leave ${status} successfully`);
      refetch();
    } catch (err) {
      toast.error("Failed to update leave status");
      console.error(err);
    }
  };

  const leaveColumns: ColumnDef<any>[] = [
    {
      accessorKey: "staff",
      header: "Employee #",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">
            {row.original.staff.first_name} {row.original.staff.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{row.original.staff.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "leave_type",
      header: "Type",
      cell: ({ row }) => <div className="font-semibold">{row.getValue("leave_type")}</div>,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => <div>{row.getValue("start_date")}</div>,
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => <div>{row.getValue("end_date")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const color =
          status.toLowerCase() === "approved"
            ? "bg-green-600"
            : status.toLowerCase() === "pending"
              ? "bg-yellow-600"
              : status.toLowerCase() === "rejected"
                ? "bg-red-600"
                : "bg-gray-500";

        return <Badge className={`${color} text-white`}>{status}</Badge>;
      },
    },
    {
      accessorKey: "approver",
      header: "Approved By",
      cell: ({ row }) => (
        <div>{row.original.approver ? `${row.original.approver.first_name} ${row.original.approver.last_name}` : "-"}</div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <div>{row.getValue("reason")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        if (item.status.toLowerCase() !== "pending") return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => handleStatusChange(item.id, "approved")}
              >
                <Check className="h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => handleStatusChange(item.id, "rejected")}
              >
                <X className="h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Leaves Management</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/dashboard/staffs/leaves/request">
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              <span>Request Leave</span>
            </Button>
          </Link>

        </div>
      </div>
      <Card>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading leaves...</p>
          ) : (
            <DataTable columns={leaveColumns} data={leaves} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
