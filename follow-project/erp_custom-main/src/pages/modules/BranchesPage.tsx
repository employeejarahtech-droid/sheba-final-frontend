/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";


export default function BranchesPage() {
  const branches = [
    {
      name: "Head Office – Shah Alam",
      code: "HO-SHAH",
      type: "Head Office",
      status: "Active",
    },
    {
      name: "Warehouse – Port Klang",
      code: "WH-PK",
      type: "Warehouse",
      status: "Active",
    },
    {
      name: "Branch – Penang",
      code: "BR-PG",
      type: "Branch",
      status: "Inactive",
    },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: "Branch Name",
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }:{row:any}) => {
        const value = row.getValue("status");

        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              value === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {value}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">

      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Branches / Locations
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Branch
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={branches} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Branches are stored in <code>company_branches</code> and linked to
            each company.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
