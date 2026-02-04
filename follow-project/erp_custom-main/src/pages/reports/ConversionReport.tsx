"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function ConversionReport() {
  const [period, setPeriod] = useState("range");
  const [owner, setOwner] = useState("all");

  const reportData = [
    {
      type: "crm",
      title: "CRM – Jan 2025",
      leads: "48 Leads",
      converted: "19 Won",
      conversion: "39.6%",
    },
    {
      type: "project",
      title: "PRJ-001 – TimeWhip SaaS Implementation",
      leads: "Budget 50,000.00",
      converted: "Cost 29,750.00",
      conversion: "Under by 20,250.00",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CRM / Project Reports</h1>
        <div className="flex gap-3">
          <Button variant="outline">Export</Button>
          <Button>Report</Button>
        </div>
      </div>

      {/* REPORT WRAPPER */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Lead / Opportunity Conversion</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="range">From - To</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From - To</Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label>Owner / Project Manager</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="john">John</SelectItem>
                  <SelectItem value="sara">Sara</SelectItem>
                  <SelectItem value="rahim">Rahim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">Filter</Button>
            </div>
          </div>

          {/* TABLE */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key / Project</TableHead>
                  <TableHead>Leads / Budget</TableHead>
                  <TableHead>Converted / Cost</TableHead>
                  <TableHead className="text-right">Conversion % / Variance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reportData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.leads}</TableCell>
                    <TableCell>{item.converted}</TableCell>
                    <TableCell className="text-right font-semibold">{item.conversion}</TableCell>
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
