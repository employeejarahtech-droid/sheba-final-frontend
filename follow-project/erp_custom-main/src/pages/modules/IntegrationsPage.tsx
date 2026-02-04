/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function IntegrationsPage() {
  const integrations = [
    {
      provider: "Stripe",
      type: "Payment",
      apiKey: "pk_live_xxxxxxxxxxxxx",
      status: "Active",
    },
    {
      provider: "WhatsApp Cloud API",
      type: "Messaging",
      apiKey: "waba_app_123456",
      status: "Active",
    },
    {
      provider: "Xero",
      type: "Accounting",
      apiKey: "client_abc123",
      status: "Disabled",
    },
  ];

  const columns = [
    { accessorKey: "provider", header: "Provider" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "apiKey", header: "API Key / Client ID" },
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
            API Keys / Integrations
          </CardTitle>

          <Button
            className="
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600 
              text-white rounded-sm
            "
          >
            + Add Integration
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={integrations} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Integrations are stored in <code>integrations</code> with encrypted secrets and configuration JSON.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
