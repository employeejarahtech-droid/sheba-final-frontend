import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import AddBrandForm from "./AddBrandForm";
import EditBrandForm from "./EditBrandForm";

export interface Brand {
  id: number;
  brand_name: string;
  description: string;
  status: string;
}

const brands: Brand[] = [
  {
    id: 1,
    brand_name: "3M",
    description: "Safety & industrial products",
    status: "Active",
  },
  {
    id: 2,
    brand_name: "Honeywell",
    description: "Industrial safety gear",
    status: "Active",
  },
];

export default function Brands() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const columns: ColumnDef<Brand>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "brand_name", header: "Brand Name" },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as string;
        const bgColor =
          status.toLowerCase() === "active" ? "bg-green-500" : "bg-red-500";
        return (
          <span
            className={`py-1 px-2 rounded-full text-xs text-white font-medium ${bgColor}`}
          >
            {status}
          </span>
        );
      },
    },

    {
      header: "Actions",
      cell: ({ row }) => {
        const brand = row.original as Brand;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditSheetOpen(true);
              }}
            >
              Edit
            </Button>

            <Button
              variant="destructive"
              onClick={() => alert("Delete" + brand.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Brands</h1>

        <Button onClick={() => setAddSheetOpen(true)}>+ New Brand</Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={brands} />

      {/* Add Form */}
      <AddBrandForm open={addSheetOpen} onOpenChange={setAddSheetOpen} />

      {/* Edit Form */}
      <EditBrandForm open={editSheetOpen} onOpenChange={setEditSheetOpen} />
    </div>
  );
}
