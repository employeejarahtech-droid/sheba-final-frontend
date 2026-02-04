/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadConversionTracking() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const conversions = [
    {
      leadCode: "L-2025-005",
      leadCompany: "Family Lawyers Mackay",
      convertedTo: "Customer C-102 (ERP + SEO)",
      conversionDate: "2025-01-12",
      dealValue: 18000,
      result: "CONVERTED",
      owner: "Abdullah",
    },
    {
      leadCode: "L-2025-006",
      leadCompany: "MK Tower Builders",
      convertedTo: "-",
      conversionDate: "2025-01-10",
      dealValue: 0,
      result: "LOST",
      owner: "Team A",
    },
  ];

  const columns = [
    { accessorKey: "leadCode", header: "Lead Code" },
    { accessorKey: "leadCompany", header: "Lead / Company" },
    { accessorKey: "convertedTo", header: "Converted To" },
    { accessorKey: "conversionDate", header: "Conversion Date" },
    {
      accessorKey: "dealValue",
      header: "Deal Value",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("dealValue");
        return <span>{value.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "result",
      header: "Result",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("result");
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              value === "CONVERTED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    { accessorKey: "owner", header: "Owner" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Conversion Tracking (Lead → Customer)
          </CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Conversion
          </Button>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Period From</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Period To</label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Owner</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Abdullah">Abdullah</SelectItem>
                  <SelectItem value="Team A">Team A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <DataTable columns={columns} data={conversions} pageSize={10} />

          <p className="text-gray-400 text-xs mt-2">
            Conversion details are stored in <code>crm_leads</code> (status + customer_id + converted_at) and history in{" "}
            <code>crm_lead_conversion_logs</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
