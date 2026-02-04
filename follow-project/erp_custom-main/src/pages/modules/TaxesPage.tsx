/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function TaxesPage() {
  const taxes = [
    { code: "SR", name: "Standard Rated Supply", rate: 6.0, type: "Output", status: "Active" },
    { code: "ZR", name: "Zero Rated Supply", rate: 0.0, type: "Output", status: "Active" },
    { code: "TX-IMPORT", name: "Import Tax", rate: 6.0, type: "Input", status: "Active" },
  ];

  const columns = [
    { accessorKey: "code", header: "Tax Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "rate", header: "Rate %" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
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
            Tax / GST / VAT Configuration
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Tax
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={taxes} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Taxes are stored in <code>taxes</code>; mapping to accounts is done in accounting configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
