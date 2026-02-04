/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function NumberingSequencesPage() {
  const sequences = [
    {
      documentType: "Sales Order",
      prefix: "SO-",
      currentNo: 1025,
      padding: 4,
      sample: "SO-1025",
      reset: "Yearly",
    },
    {
      documentType: "Purchase Order",
      prefix: "PO-",
      currentNo: 550,
      padding: 4,
      sample: "PO-0550",
      reset: "Yearly",
    },
    {
      documentType: "Sales Invoice",
      prefix: "INV-",
      currentNo: 1203,
      padding: 5,
      sample: "INV-01203",
      reset: "Monthly",
    },
  ];

  const columns = [
    {
      accessorKey: "documentType",
      header: "Document Type",
    },
    {
      accessorKey: "prefix",
      header: "Prefix",
    },
    {
      accessorKey: "currentNo",
      header: "Current No.",
    },
    {
      accessorKey: "padding",
      header: "Padding",
    },
    {
      accessorKey: "sample",
      header: "Sample",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("sample");
        return (
          <code className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-sm">
            {value}
          </code>
        );
      },
    },
    {
      accessorKey: "reset",
      header: "Reset",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("reset");
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
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
            Numbering Sequences
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Sequence
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={sequences} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Numbering sequences are stored in{" "}
            <code>numbering_sequences</code>, configurable per company/branch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
