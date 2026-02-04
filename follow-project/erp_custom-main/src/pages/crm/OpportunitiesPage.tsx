/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function OpportunitiesPage() {
  const [pipeline, setPipeline] = useState("default");
  const [stage, setStage] = useState("all");

  // Mock opportunities data
  const opportunities = [
    {
      code: "OP-2025-003",
      customer: "Speedex Express",
      stage: "Proposal",
      prob: 60,
      value: 35000,
      status: "OPEN",
      closeDate: "2025-02-05",
    },
    {
      code: "OP-2025-004",
      customer: "Yazhi Manufacturing",
      stage: "Negotiation",
      prob: 75,
      value: 22000,
      status: "OPEN",
      closeDate: "2025-02-10",
    },
  ];

  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    WON: "bg-green-100 text-green-700",
    LOST: "bg-red-100 text-red-700",
  };

  const columns = [
    { accessorKey: "code", header: "Opportunity" },
    { accessorKey: "customer", header: "Customer / Lead" },
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "prob",
      header: "Prob %",
      cell: ({ row }: { row: any }) => `${row.getValue("prob")}%`,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }: { row: any }) =>
        `$${row.getValue("value").toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("status");
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              statusColors[value] || "bg-gray-100 text-gray-700"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    { accessorKey: "closeDate", header: "Close Date" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Opportunities
          </CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Opportunity
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Pipeline</label>
              <Select value={pipeline} onValueChange={setPipeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Sales Pipeline</SelectItem>
                  <SelectItem value="custom">Custom Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={opportunities}
              pageSize={10}
            />
          </div>

          <p className="text-gray-400 text-xs mt-2">
            Opportunities are stored in <code>crm_opportunities</code> and linked
            to leads/customers and pipeline stages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
