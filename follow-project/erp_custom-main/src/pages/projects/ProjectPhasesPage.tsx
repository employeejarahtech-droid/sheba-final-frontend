/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";


// ---------------------- MOCK DATA ----------------------
const projectPhases = [
  { name: "Discovery & Requirements", order: 1, start: "2025-01-01", end: "2025-01-31", progress: "100%", status: "COMPLETED" },
  { name: "Design & Architecture", order: 2, start: "2025-02-01", end: "2025-02-28", progress: "25%", status: "IN_PROGRESS" },
];

const projectMilestones = [
  { name: "Sign-off Requirements Document", phase: "Discovery", dueDate: "2025-01-15", status: "DONE" },
  { name: "Finalize Database Schema", phase: "Design", dueDate: "2025-02-10", status: "OPEN" },
];

// ---------------------- TABLE COLUMNS ----------------------
const phaseColumns: ColumnDef<any>[] = [
  { accessorKey: "name", header: "Phase" },
  { accessorKey: "order", header: "Order" },
  { accessorKey: "start", header: "Start" },
  { accessorKey: "end", header: "End" },
  { accessorKey: "progress", header: "Progress" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const value = row.getValue("status");
      const bg = value === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
      return <span className={`px-2 py-1 text-xs rounded-full font-medium ${bg}`}>{value}</span>;
    },
  },
];

const milestoneColumns: ColumnDef<any>[] = [
  { accessorKey: "name", header: "Milestone" },
  { accessorKey: "phase", header: "Phase" },
  { accessorKey: "dueDate", header: "Due Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const value = row.getValue("status");
      const bg = value === "DONE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
      return <span className={`px-2 py-1 text-xs rounded-full font-medium ${bg}`}>{value}</span>;
    },
  },
];

// ---------------------- COMPONENT ----------------------
export default function ProjectPhasesPage() {
  const selectedProject = "PRJ-001 – TimeWhip SaaS Implementation";

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Project Phases & Milestones</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Manage project phases, milestones, progress, and statuses per project.
      </p>

      {/* Project Selector + New Phase */}
      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Project: {selectedProject}</CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Phase
          </Button>
        </CardHeader>

        {/* Phases Table */}
        <CardContent className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Phases</h3>
          <DataTable data={projectPhases} columns={phaseColumns} pageSize={5} />
          <p className="text-gray-400 text-xs mt-2">
            Phases are stored in <code>project_phases</code>.
          </p>
        </CardContent>

        {/* Milestones Table */}
        <CardContent className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Key Milestones</h3>
          <DataTable data={projectMilestones} columns={milestoneColumns} pageSize={5} />
          <p className="text-gray-400 text-xs mt-2">
            Milestones are stored in <code>project_milestones</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
