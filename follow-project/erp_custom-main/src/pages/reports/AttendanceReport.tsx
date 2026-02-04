"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AttendanceReport() {
  const [period, setPeriod] = useState("month");
  const [department, setDepartment] = useState("all");

  const data = [
    {
      employee: "EMP-001 – Abdullah",
      present: 22,
      leave: 2,
      gross: "8,500.00",
      net: "7,900.00",
    },
    {
      employee: "EMP-010 – Store Staff",
      present: 20,
      leave: 1,
      gross: "3,200.00",
      net: "3,000.00",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">HR & Payroll Reports</h1>
        <div className="flex gap-3">
          <Button variant="outline">Export</Button>
          <Button>Report</Button>
        </div>
      </div>

      {/* Report Section */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="range">From – To</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month / From - To</Label>
              <Input type="month" />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">Filter</Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee / Group</TableHead>
                  <TableHead className="text-center">Days Present</TableHead>
                  <TableHead className="text-center">Days Leave</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.employee}</TableCell>
                    <TableCell className="text-center">{row.present}</TableCell>
                    <TableCell className="text-center">{row.leave}</TableCell>
                    <TableCell className="text-right">{row.gross}</TableCell>
                    <TableCell className="text-right font-medium">{row.net}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
