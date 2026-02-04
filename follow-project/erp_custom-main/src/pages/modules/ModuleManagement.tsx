"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export type ModuleRow = {
  module: string;
  description: string;
  key: string;
  type: "Core" | "Optional";
  status: "Enabled" | "Disabled";
};

const modulesData: ModuleRow[] = [
  {
    module: "Customers",
    description: "Customer master, groups, statements, CRM basics.",
    key: "customers",
    type: "Core",
    status: "Enabled",
  },
  {
    module: "Suppliers",
    description: "Supplier master, statements, purchase history.",
    key: "suppliers",
    type: "Core",
    status: "Enabled",
  },
  {
    module: "Inventory / Stock",
    description: "Warehouses, stock movements, stock valuation.",
    key: "inventory",
    type: "Core",
    status: "Enabled",
  },
  {
    module: "HR & Payroll",
    description: "Employees, attendance, payroll processing.",
    key: "hr_payroll",
    type: "Optional",
    status: "Disabled",
  },
];

export default function ModuleManagement() {
  const [filterType, setFilterType] = useState<"all" | "Core" | "Optional">("all");

  const columns: ColumnDef<ModuleRow>[] = [
    { accessorKey: "module", header: "Module" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "key", header: "Key" },
    { accessorKey: "type", header: "Type" },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as "Enabled" | "Disabled";
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isEnabled, setIsEnabled] = useState(status === "Enabled");

        const toggleStatus = () => {
          setIsEnabled(!isEnabled);
          // Optional: call API to persist status change
          // updateModuleStatus(row.original.key, !isEnabled);
        };

        return (
          <div className="flex items-center gap-3">
            {/* Status Text */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </span>

            {/* Smooth Toggle */}
            <button
              onClick={toggleStatus}
              className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${isEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
              />
            </button>
          </div>
        );
      },
    }


  ];

  // Apply filter
  const filteredData = modulesData.filter(
    (mod) => filterType === "all" || mod.type === filterType
  );

  return (
    <>
      {/* Header & Description */}
      <div className="mb-5 space-y-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            Module Management & System Settings
          </CardTitle>
        </div>
        <p className="text-gray-500 text-sm max-w-3xl">
          Enable or disable modules, configure company profile, numbering, taxes, email/SMS gateways, templates,
          language, backups and integrations.
        </p>
      </div>

      {/* Module List Card */}
      <Card className="rounded-2xl shadow-sm p-6 space-y-6">
        {/* Card Header with Button Group */}
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center px-0 gap-4 md:gap-0">
          <CardTitle className="text-xl font-semibold">Module List</CardTitle>

          {/* Button Group for Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "Core", "Optional"] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                className="px-4"
              >
                {type === "all" ? "All" : type}
              </Button>
            ))}
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent className="p-0 mt-4">
          <DataTable columns={columns} data={filteredData} pageSize={10} />
          <p className="text-gray-400 text-xs mt-4">
            Modules are stored in <code>modules</code>, per-company activation in <code>company_modules</code>.
            Disabling a module does NOT delete data – it only hides access.
          </p>
        </CardContent>
      </Card>
    </>

  );
}
