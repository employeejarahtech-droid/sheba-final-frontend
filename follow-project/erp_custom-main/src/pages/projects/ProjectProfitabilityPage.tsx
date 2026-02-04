/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------- MOCK DATA ----------------------
const projectProfitability = [
  {
    project: "PRJ-001 – TimeWhip SaaS Implementation",
    customer: "Yazhi Manufacturing",
    revenue: 35000.0,
    labourCost: 8450.0,
    otherCosts: 5300.0,
    profit: 21250.0,
    margin: "60.7%",
  },
  {
    project: "PRJ-002 – Speedex ERP Rollout",
    customer: "Speedex Express",
    revenue: 12000.0,
    labourCost: 2200.0,
    otherCosts: 600.0,
    profit: 9200.0,
    margin: "76.7%",
  },
];

// ---------------------- TABLE COLUMNS ----------------------
const profitabilityColumns: ColumnDef<any>[] = [
  { accessorKey: "project", header: "Project" },
  { accessorKey: "customer", header: "Customer" },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }: { row: any }) => `$${row.getValue("revenue").toFixed(2)}`,
  },
  {
    accessorKey: "labourCost",
    header: "Labour Cost",
    cell: ({ row }: { row: any }) => `$${row.getValue("labourCost").toFixed(2)}`,
  },
  {
    accessorKey: "otherCosts",
    header: "Other Costs",
    cell: ({ row }: { row: any }) => `$${row.getValue("otherCosts").toFixed(2)}`,
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }: { row: any }) => `$${row.getValue("profit").toFixed(2)}`,
  },
  { accessorKey: "margin", header: "Margin %" },
];

// ---------------------- COMPONENT ----------------------
export default function ProjectProfitabilityPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewBy, setViewBy] = useState("project");

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Project Profitability Reports</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Profitability reports aggregate sales invoices, timesheets, and project cost allocations.
      </p>

      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Filters</CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            Export
          </Button>
        </CardHeader>

        {/* FILTERS */}
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">From</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">To</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">View By</label>
            <Select value={viewBy} onValueChange={setViewBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* PROFITABILITY TABLE */}
        <CardContent className="mt-6">
          <DataTable data={projectProfitability} columns={profitabilityColumns} pageSize={10} />
          <p className="text-gray-400 text-xs mt-2">
            Aggregates revenue, labour, and other costs per project. Stored in sales invoices, project_timesheets, and project_cost_allocations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
