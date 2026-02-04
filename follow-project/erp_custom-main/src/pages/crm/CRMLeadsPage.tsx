/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------- MOCK DATA ----------------------
const leads = [
    {
        code: "L-2025-010",
        company: "Yazhi Manufacturing",
        source: "Website",
        stage: "MQL",
        value: 15000,
        status: "CONTACTED",
        nextFollowUp: "2025-01-20",
    },
    {
        code: "L-2025-011",
        company: "Speedex Express",
        source: "Referral",
        stage: "Proposal",
        value: 35000,
        status: "QUALIFIED",
        nextFollowUp: "2025-01-18",
    },
];

// ---------------------- TABLE COLUMNS ----------------------
const leadColumns: ColumnDef<any>[] = [
    { accessorKey: "code", header: "Lead Code" },
    { accessorKey: "company", header: "Lead / Company" },
    { accessorKey: "source", header: "Source" },
    { accessorKey: "stage", header: "Stage" },
    {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }: { row: any }) => `$${row.getValue("value").toLocaleString()}`,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: any }) => {
            const value = row.getValue("status") as "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
            const colors: Record<typeof value, string> = {
                NEW: "bg-blue-100 text-blue-700",
                CONTACTED: "bg-yellow-100 text-yellow-700",
                QUALIFIED: "bg-green-100 text-green-700",
                LOST: "bg-red-100 text-red-700",
            };
            return (
                <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${colors[value]}`}
                >
                    {value}
                </span>
            );
        },
    },
    { accessorKey: "nextFollowUp", header: "Next Follow-up" },
];

// ---------------------- COMPONENT ----------------------
export default function CRMLeadsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");

    // MOCK SNAPSHOT DATA
    const snapshot = {
        openLeads: 42,
        pipelineValue: 125000,
        conversionRate: "28%",
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6">
            <h2 className="text-3xl font-bold">CRM – Leads & Pipeline</h2>
            <p className="text-gray-500 mb-4 max-w-3xl">
                Manage leads, opportunities, pipeline stages, activities, and conversions from lead → customer.
            </p>

            {/* SNAPSHOT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 text-sm">Open Leads</p>
                    <p className="text-3xl font-semibold">{snapshot.openLeads}</p>
                    <p className="text-xs text-gray-400">Status NEW / CONTACTED / QUALIFIED</p>
                </Card>

                <Card className="rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 text-sm">Open Pipeline Value</p>
                    <p className="text-3xl font-semibold">${snapshot.pipelineValue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Sum of opportunity value in CRM</p>
                </Card>

                <Card className="rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-gray-500 text-sm">Conversion Rate</p>
                    <p className="text-3xl font-semibold">{snapshot.conversionRate}</p>
                    <p className="text-xs text-gray-400">Leads converted → customers this period</p>
                </Card>
            </div>

            {/* LEADS TABLE */}
            <Card className="rounded-2xl shadow-sm mt-6">
                <CardHeader className="flex justify-between items-center pb-3">
                    <CardTitle>Leads</CardTitle>
                    <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
                        + New Lead
                    </Button>
                </CardHeader>

                {/* FILTERS */}
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <Input
                        placeholder="Search by name / company / email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="NEW">NEW</SelectItem>
                            <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                            <SelectItem value="QUALIFIED">QUALIFIED</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Owner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Abdullah">Abdullah</SelectItem>
                            <SelectItem value="Team A">Team A</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>

                {/* DATA TABLE */}
                <CardContent className="mt-6">
                    <DataTable data={leads} columns={leadColumns} pageSize={10} />
                    <p className="text-gray-400 text-xs mt-2">
                        Leads stored in <code>crm_leads</code> with owner, status, stage and value.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
