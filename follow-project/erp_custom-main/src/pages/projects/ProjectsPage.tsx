/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportRangeButtons } from "@/components/reports/ReportRangeButtons";

// ---------------------- MOCK DATA ----------------------
const projectsSnapshot = {
  activeProjects: 14,
  hoursLogged: 482.5,
  overallProfit: 28450.0,
};

const projectsList = [
  {
    code: "PRJ-001",
    name: "TimeWhip SaaS Implementation",
    customer: "Yazhi Manufacturing",
    manager: "Abdullah",
    start: "2025-01-01",
    end: "2025-04-30",
    progress: "40%",
    status: "IN_PROGRESS",
  },
  {
    code: "PRJ-002",
    name: "Speedex ERP Rollout",
    customer: "Speedex Express",
    manager: "Team A",
    start: "2025-02-01",
    end: "2025-06-30",
    progress: "15%",
    status: "PLANNED",
  },
];

// ---------------------- TABLE COLUMNS ----------------------
const projectColumns: ColumnDef<any>[] = [
  { accessorKey: "code", header: "Project" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "manager", header: "Manager" },
  { accessorKey: "start", header: "Start" },
  { accessorKey: "end", header: "End" },
  { accessorKey: "progress", header: "Progress" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const value = row.getValue("status");
      let bg = "bg-gray-100 text-gray-800";
      if (value === "IN_PROGRESS") bg = "bg-blue-100 text-blue-700";
      if (value === "PLANNED") bg = "bg-yellow-100 text-yellow-700";
      if (value === "ON_HOLD") bg = "bg-orange-100 text-orange-700";
      return <span className={`px-2 py-1 text-xs rounded-full font-medium ${bg}`}>{value}</span>;
    },
  },
];

// ---------------------- COMPONENT ----------------------
export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Projects / Jobs</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Track projects, phases, tasks, timesheets, costs and profitability per job.
      </p>

      {/* Projects Snapshot */}
      <Card className="rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Projects Snapshot</h2>
          <ReportRangeButtons />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <p className="text-gray-500 text-sm">Active Projects</p>
            <p className="text-3xl font-semibold">{projectsSnapshot.activeProjects}</p>
            <p className="text-xs text-gray-400">Status IN_PROGRESS / ON_HOLD in projects</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Hours Logged (This Month)</p>
            <p className="text-3xl font-semibold">{projectsSnapshot.hoursLogged}</p>
            <p className="text-xs text-gray-400">Sum of hours in project_timesheets</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Overall Profit (This Month)</p>
            <p className="text-3xl font-semibold">{projectsSnapshot.overallProfit.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Revenue − costs from sales, purchases & expenses</p>
          </div>
        </div>
      </Card>

      {/* Projects List */}
      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Projects / Jobs List</CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Project
          </Button>
        </CardHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input
            placeholder="Search by Code / Name / Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
              <SelectItem value="PLANNED">PLANNED</SelectItem>
              <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Project Manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Abdullah">Abdullah</SelectItem>
              <SelectItem value="Team A">Team A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Table */}
        <CardContent className="mt-4">
          <DataTable data={projectsList} columns={projectColumns} pageSize={5} />
          <p className="text-gray-400 text-xs mt-4">
            Projects are stored in <code>projects</code> with links to customers, managers and status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
