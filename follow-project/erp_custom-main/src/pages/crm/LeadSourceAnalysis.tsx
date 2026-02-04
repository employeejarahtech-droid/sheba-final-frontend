import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

type LeadSource = {
  source: string;
  leads: number;
  opportunities: number;
  won: number;
  conv: string;
  totalValueWon: number;
}
export default function LeadSourceAnalysis() {
  // Mock data
  const leadSources: LeadSource[] = [
    {
      source: "Website",
      leads: 35,
      opportunities: 18,
      won: 6,
      conv: "17%",
      totalValueWon: 45000,
    },
    {
      source: "Referral",
      leads: 12,
      opportunities: 10,
      won: 7,
      conv: "58%",
      totalValueWon: 80000,
    },
    {
      source: "Facebook Ads",
      leads: 20,
      opportunities: 8,
      won: 2,
      conv: "10%",
      totalValueWon: 15000,
    },
  ];

  // Table columns
  const columns:ColumnDef<LeadSource>[] = [
    { accessorKey: "source", header: "Source" },
    { accessorKey: "leads", header: "Leads" },
    { accessorKey: "opportunities", header: "Opportunities" },
    { accessorKey: "won", header: "Won" },
    { accessorKey: "conv", header: "Conv %" },
    {
      accessorKey: "totalValueWon",
      header: "Total Value Won",
      cell: ({ row }) => {
        const value = row.getValue("totalValueWon") as number;
        return <span>{value.toLocaleString()}</span>;
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Lead Source Analysis
          </CardTitle>
          {/* <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + Add Source
          </Button> */}
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable columns={columns} data={leadSources} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Lead sources are stored in <code>crm_lead_sources</code>. Stats are calculated from{" "}
            <code>crm_leads</code> and <code>crm_opportunities</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
