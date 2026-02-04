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

export type ScheduledReportRow = {
  schedule: string;
  report: string;
  frequency: string;
  channel: string;
  lastRun: string;
};

const scheduledReportsData: ScheduledReportRow[] = [
  {
    schedule: "Daily Sales Summary",
    report: "Sales by Date",
    frequency: "Daily",
    channel: "Email",
    lastRun: "2025-01-15 23:59",
  },
  {
    schedule: "Month-End P&L",
    report: "P&L by Period",
    frequency: "Monthly",
    channel: "Email, WhatsApp",
    lastRun: "2024-12-31 22:00",
  },
];

export default function ScheduledReports() {
  const [filterSchedule, setFilterSchedule] = useState("");
  const [filterFrequency, setFilterFrequency] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);

  const columns: ColumnDef<ScheduledReportRow>[] = [
    { accessorKey: "schedule", header: "Schedule" },
    { accessorKey: "report", header: "Report" },
    { accessorKey: "frequency", header: "Frequency" },
    { accessorKey: "channel", header: "Channel" },
    { accessorKey: "lastRun", header: "Last Run" },
  ];

  // Apply filters
  const filteredData = scheduledReportsData.filter(
    (report) =>
      report.schedule.toLowerCase().includes(filterSchedule.toLowerCase()) &&
      (filterFrequency === "all" || report.frequency === filterFrequency)
  );

  return (
    <Card className="rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <CardTitle className="text-xl font-semibold">
          Scheduled Reports
        </CardTitle>
        <Button variant="outline" className="px-5">
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Schedule Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Schedule Name</label>
          <Input
            placeholder="Search schedule..."
            value={filterSchedule}
            onChange={(e) => setFilterSchedule(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Frequency</label>
          <Select value={filterFrequency} onValueChange={setFilterFrequency}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Report Button */}
        <div className="flex items-end">
          <Button className="h-10 w-full">+ Schedule Report</Button>
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
          Scheduled jobs are stored in scheduled_reports and executed by background worker / cron.
        </p>
      </CardContent>
    </Card>
  );
}
