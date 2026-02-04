/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function CurrenciesPage() {
  const currencies = [
    { currency: "Malaysian Ringgit", code: "MYR", rate: 1.0, validFrom: "2025-01-01", status: "Active" },
    { currency: "Australian Dollar", code: "AUD", rate: 3.25, validFrom: "2025-01-01", status: "Active" },
    { currency: "US Dollar", code: "USD", rate: 4.7, validFrom: "2025-01-01", status: "Active" },
  ];

  const columns = [
    { accessorKey: "currency", header: "Currency" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "rate", header: "Rate vs Base" },
    { accessorKey: "validFrom", header: "Valid From" },
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
            Currency & Exchange Rates
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Currency
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={currencies} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Currencies are stored in <code>currencies</code>, and daily/period rates are in <code>exchange_rates</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
