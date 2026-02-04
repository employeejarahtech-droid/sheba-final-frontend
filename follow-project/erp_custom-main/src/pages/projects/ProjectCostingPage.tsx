import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectCost = {
  costType: string;
  description: string;
  sourceRef: string;
  amount: number;
};
// ---------------------- MOCK DATA ----------------------
const projectCosts: ProjectCost[] = [
  {
    costType: "Labour (Timesheets)",
    description: "Total hours × rate",
    sourceRef: "TS-PRJ-001",
    amount: 8450.0,
  },
  {
    costType: "Purchases",
    description: "Software licenses & tools",
    sourceRef: "PO-2025-015",
    amount: 4200.0,
  },
  {
    costType: "Expenses",
    description: "Travel & meetings",
    sourceRef: "EXP-2025-021",
    amount: 1100.0,
  },
];

// ---------------------- TABLE COLUMNS ----------------------
const costColumns: ColumnDef<ProjectCost>[] = [
  { accessorKey: "costType", header: "Cost Type" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "sourceRef", header: "Source Ref" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const value = row.getValue("amount") as number;
      return <span className="font-medium">${value.toFixed(2)}</span>;
    },
  },
];

// ---------------------- COMPONENT ----------------------
export default function ProjectCostingPage() {
  const [selectedProject, setSelectedProject] = useState("PRJ-001");

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Project Costing</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Track labour, purchases, and expenses per project including allocations
        and source references.
      </p>

      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Project Costs</CardTitle>
          {/* <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + Add Cost
          </Button> */}
        </CardHeader>

        {/* FILTERS */}
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRJ-001">
                  PRJ-001 – TimeWhip SaaS Implementation
                </SelectItem>
                <SelectItem value="PRJ-002">
                  PRJ-002 – Speedex ERP Rollout
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* COST TABLE */}
        <CardContent className="mt-6">
          <DataTable data={projectCosts} columns={costColumns} pageSize={10} />
          <p className="text-gray-400 text-xs mt-2">
            Cost allocations are stored in <code>project_cost_allocations</code>{" "}
            linked to purchases and expenses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
