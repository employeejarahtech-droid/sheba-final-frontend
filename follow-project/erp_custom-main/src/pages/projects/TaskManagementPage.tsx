/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------- MOCK DATA ----------------------
const tasks = [
  { task: "T-001", title: "Setup Node.js project structure", project: "PRJ-001", assignee: "Dev A", due: "2025-01-20", estHrs: 10, status: "IN_PROGRESS" },
  { task: "T-002", title: "Design DB for ERP modules", project: "PRJ-001", assignee: "Dev B", due: "2025-01-22", estHrs: 12, status: "TODO" },
];

// ---------------------- TABLE COLUMNS ----------------------
const taskColumns: ColumnDef<any>[] = [
  { accessorKey: "task", header: "Task" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "project", header: "Project" },
  { accessorKey: "assignee", header: "Assignee" },
  { accessorKey: "due", header: "Due" },
  { accessorKey: "estHrs", header: "Est Hrs" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const value = row.getValue("status");
      const bg =
        value === "IN_PROGRESS"
          ? "bg-blue-100 text-blue-700"
          : value === "TODO"
          ? "bg-gray-100 text-gray-700"
          : "bg-green-100 text-green-700";
      return <span className={`px-2 py-1 text-xs rounded-full font-medium ${bg}`}>{value}</span>;
    },
  },
];

// ---------------------- COMPONENT ----------------------
export default function TaskManagementPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <h2 className="text-3xl font-bold">Task Management</h2>
      <p className="text-gray-500 mb-4 max-w-3xl">
        Track tasks, assignees, due dates, and status per project.
      </p>

      <Card className="rounded-2xl shadow-sm p-6">
        <CardHeader className="flex justify-between items-center pb-3">
          <CardTitle>Tasks</CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Task
          </Button>
        </CardHeader>

        {/* FILTERS */}
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

          {/* Assignee */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Dev A">Dev A</SelectItem>
                <SelectItem value="Dev B">Dev B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="TODO">TODO</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* TASKS TABLE */}
        <CardContent className="mt-6">
          <DataTable data={tasks} columns={taskColumns} pageSize={10} />
          <p className="text-gray-400 text-xs mt-2">
            Tasks are stored in <code>project_tasks</code>, assignees in <code>project_task_assignments</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
