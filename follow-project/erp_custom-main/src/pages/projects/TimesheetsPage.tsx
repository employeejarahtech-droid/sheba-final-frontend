/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------- MOCK DATA ----------------------
const timesheets = [
  { date: "2025-01-14", employee: "Dev A", project: "PRJ-001", task: "T-001", hours: 4.0, rate: 80.0, cost: 320.0, billable: "Yes" },
  { date: "2025-01-15", employee: "Dev B", project: "PRJ-001", task: "T-002", hours: 3.5, rate: 70.0, cost: 245.0, billable: "Yes" },
];

// ---------------------- TABLE COLUMNS ----------------------
const timesheetColumns: ColumnDef<any>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "employee", header: "Employee" },
  { accessorKey: "project", header: "Project" },
  { accessorKey: "task", header: "Task" },
  { accessorKey: "hours", header: "Hours" },
  { accessorKey: "rate", header: "Rate" },
  { accessorKey: "cost", header: "Cost" },
  {
    accessorKey: "billable",
    header: "Billable",
    cell: ({ row }: { row: any }) => {
      const value = row.getValue("billable");
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            value === "Yes" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {value}
        </span>
      );
    },
  },
];

// ---------------------- COMPONENT ----------------------
export default function TimesheetsPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Timesheets</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Track hours worked by employees per project and task, including billable costs.
      </p>

      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Timesheets</CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + Log Time
          </Button>
        </CardHeader>

        {/* FILTERS */}
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Project */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PRJ-001">PRJ-001 – TimeWhip SaaS Implementation</SelectItem>
                <SelectItem value="PRJ-002">PRJ-002 – Speedex ERP Rollout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Employee</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Dev A">Dev A</SelectItem>
                <SelectItem value="Dev B">Dev B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period From */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">From</label>
            <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
          </div>

          {/* Period To */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">To</label>
            <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
          </div>
        </CardContent>

        {/* TIMESHEETS TABLE */}
        <CardContent className="mt-6">
          <DataTable data={timesheets} columns={timesheetColumns} pageSize={10} />
          <p className="text-gray-400 text-xs mt-2">
            Timesheets are stored in <code>project_timesheets</code> including employee, project, task, hours, cost, and billable flag.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
