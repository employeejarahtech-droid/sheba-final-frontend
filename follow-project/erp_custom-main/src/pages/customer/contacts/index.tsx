import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import AddCustomerContactForm from "./AddCustomerContactForm";
import EditCustomerContactForm from "./EditCustomerContactForm";


interface Contact {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  primaryContact: string;
}

const contacts: Contact[] = [
  {
    id: 1,
    name: "Jane Tan",
    role: "Finance Manager",
    email: "jane.tan@abctrading.com",
    phone: "+6012345678",
    primaryContact: "Yes",
  },
  {
    id: 2,
    name: "John Doe",
    role: "Sales Manager",
    email: "john.doe@abctrading.com",
    phone: "+6012345678",
    primaryContact: "No",
  },
];

export default function CustomerContacts() {
  const [open, setOpen] = useState<boolean>(false);
  const [openEditForm, setOpenEditForm] = useState<boolean>(false);

  const columns: ColumnDef<Contact>[] = [
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <div className="">{row.getValue("role")}</div>,
    },
 {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div className="">{row.getValue("phone")}</div>,
    },
    {
      accessorKey: "primaryContact",
      header: "Primary",
      cell: ({ row }) => <span className={`${row.getValue("primaryContact") === "Yes" ? "bg-green-500" : "bg-red-500"} inline-block py-1 px-2 rounded-full text-xs text-white text-center`}>{row.getValue("primaryContact")}</span>,
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
        <h1 className="text-3xl font-bold">Customer Contacts (Per Customer)</h1>
        <AddCustomerContactForm open={open} setOpen={setOpen} />
      </div>
      {/* Roles List */}
      <Card>
        <CardContent>
          <DataTable columns={columns} data={contacts} />
        </CardContent>
      </Card>
      <EditCustomerContactForm open={openEditForm} setOpen={setOpenEditForm} />
    </div>
  );
}
