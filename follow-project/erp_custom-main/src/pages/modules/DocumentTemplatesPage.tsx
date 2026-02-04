/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function DocumentTemplatesPage() {
  const templates = [
    { document: "Invoice", name: "Standard Invoice v1", engine: "HTML", isDefault: true },
    { document: "Purchase Order", name: "PO Format A", engine: "HTML", isDefault: true },
    { document: "Quotation", name: "Quote Clean Layout", engine: "HTML", isDefault: true },
    { document: "Payslip", name: "Payslip Basic", engine: "HTML", isDefault: true },
  ];

  const columns = [
    { accessorKey: "document", header: "Document" },
    { accessorKey: "name", header: "Template Name" },
    { accessorKey: "engine", header: "Engine" },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("isDefault");
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            {value ? "Yes" : "No"}
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
            Document Templates
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Template
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={templates} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Templates are stored in <code>document_templates</code> with HTML and variables.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
