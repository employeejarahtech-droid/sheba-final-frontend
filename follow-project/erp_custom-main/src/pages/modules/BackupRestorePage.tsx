/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function BackupRestorePage() {
  const backups = [
    {
      id: "BKP-20250115-01",
      type: "Full",
      started: "2025-01-15 03:00",
      completed: "2025-01-15 03:10",
      size: 120.5,
      status: "Success",
    },
    {
      id: "BKP-20250114-01",
      type: "Database",
      started: "2025-01-14 03:00",
      completed: "2025-01-14 03:05",
      size: 45.2,
      status: "Success",
    },
  ];

  const columns = [
    { accessorKey: "id", header: "Backup ID" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "started", header: "Started" },
    { accessorKey: "completed", header: "Completed" },
    { accessorKey: "size", header: "Size (MB)" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("status");
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              value === "Success"
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
            Backup & Restore
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            Run Backup Now
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={backups} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Manual backups are logged in <code>backups</code>. Restore executed via admin tool. No auto-delete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
