import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import AddCustomerGroupForm from "./AddCustomerGroupForm";
import EditCustomerGroupForm from "./EditCustomerGroupForm";

interface Group {
  id: number;
  name: string;
  description: string;
  status: string;
}

const groups: Group[] = [
  {
    id: 1,
    name: "Retail",
    description: "Small and medium retail customers",
    status: "Active",
  },
  {
    id: 2,
    name: "Wholesale",
    description: "Bulk orders and distributors",
    status: "Active",
  },
];

export default function CustomerGroups() {
  const [open, setOpen] = useState<boolean>(false);
  const [openEditForm, setOpenEditForm] = useState<boolean>(false);

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Group Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="">{row.getValue("description")}</div>,
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
        const route = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOpenEditForm(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                alert(route.id);
              }}
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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Customer Groups / Types</h1>
        <AddCustomerGroupForm open={open} setOpen={setOpen} />
      </div>
      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={groups} />
        </CardContent>
      </Card>
      <EditCustomerGroupForm open={openEditForm} setOpen={setOpenEditForm} />
    </div>
  );
}
