"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type SavedReportRow = {
  name: string;
  type: string;
  scope: string;
  lastRun: string;
};

const savedReportsData: SavedReportRow[] = [
  {
    name: "Monthly Sales by Customer",
    type: "Sales – By Customer",
    scope: "This Month",
    lastRun: "2025-01-15 08:30",
  },
  {
    name: "Inventory – Low Stock Items",
    type: "Inventory – Low Stock",
    scope: "All Warehouses",
    lastRun: "2025-01-15 09:10",
  },
  {
    name: "Payroll Summary – Warehouse Staff",
    type: "HR – Payroll Summary",
    scope: "Dept: Warehouse",
    lastRun: "2025-01-10 17:05",
  },
];

export default function SavedReports() {
  const [filterName, setFilterName] = useState("");
  const [filterScope, setFilterScope] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);

  const columns: ColumnDef<SavedReportRow>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "scope", header: "Scope" },
    { accessorKey: "lastRun", header: "Last Run" },
  ];

  // Apply filters
  const filteredData = savedReportsData.filter(
    (report) =>
      report.name.toLowerCase().includes(filterName.toLowerCase()) &&
      (filterScope === "all" || report.scope === filterScope)
  );

  return (
    <Card className="rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <CardTitle className="text-xl font-semibold">Saved Reports</CardTitle>
        <Button variant="outline" className="px-5">
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Report Name</label>
          <Input
            placeholder="Search report..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Scope */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Scope</label>
          <Select value={filterScope} onValueChange={setFilterScope}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="All Warehouses">All Warehouses</SelectItem>
              <SelectItem value="Dept: Warehouse">Dept: Warehouse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Current Filter Button */}
        <div className="flex items-end">
          <Button className="h-10 w-full">+ Save Current Filter</Button>
        </div>
      </div>

      {/* Table */}
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={filteredData}
          pageIndex={pageIndex}
          pageSize={10}
          onPageChange={setPageIndex}
        />
        <p className="text-gray-500 text-xs mt-4">
          Saved report filters/layouts are stored in saved_reports.
        </p>
      </CardContent>
    </Card>
  );
}
