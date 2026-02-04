"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";

type OverrideValue = boolean | null;

interface UserOverrideRow {
  id: string;
  module: string;
  menu: string;
  roleView: boolean;
  roleCreate: boolean;
  overrideView: OverrideValue;
  overrideCreate: OverrideValue;
}

const users = [
  { id: "1", label: "Admin User (ADMIN)" },
  { id: "2", label: "Sales User (SALES)" },
];

export interface PermissionRow {
  id: string;
  module: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  disabled?: Partial<Record<PermissionKey, boolean>>;
}

export type PermissionKey = "view" | "create" | "edit" | "delete" | "approve";

export default function RoleMenuPermissions() {
  const roles = [
    { id: "1", label: "ADMIN" },
    { id: "2", label: "SALES" },
    { id: "3", label: "STORE" },
  ];

  const [rows, setRows] = useState<UserOverrideRow[]>([
    {
      id: "1",
      module: "Customers",
      menu: "Customer List",
      roleView: true,
      roleCreate: false,
      overrideView: null,
      overrideCreate: null,
    },
    {
      id: "2",
      module: "Sales",
      menu: "Sales Invoices",
      roleView: true,
      roleCreate: true,
      overrideView: null,
      overrideCreate: null,
    },
  ]);

  // Flattened permission dataset
  const [data, setData] = useState<PermissionRow[]>([
    {
      id: "row1",
      module: "Customers",
      label: "Customers (Main Menu)",
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      //disabled: { create: true, edit: true, delete: true, approve: true },
    },
    {
      id: "row2",
      module: "Customers",
      label: "Customer List",
      view: true,
      create: false,
      edit: true,
      delete: true,
      approve: false,
    },
    {
      id: "row3",
      module: "Customers",
      label: "Add Customer",
      view: true,
      create: true,
      edit: false,
      delete: false,
      approve: false,
    },
    {
      id: "row4",
      module: "Suppliers",
      label: "Supplier List",
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
    },
    {
      id: "row5",
      module: "Suppliers",
      label: "Add Supplier",
      view: true,
      create: true,
      edit: false,
      delete: false,
      approve: false,
    },
    {
      id: "row6",
      module: "Sales",
      label: "Sales Orders",
      view: true,
      create: true,
      edit: true,
      delete: false,
      approve: false,
    },
    {
      id: "row7",
      module: "Sales",
      label: "Sales Invoices",
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: false,
    },
  ]);

  const columns = (
    onChange: (id: string, key: PermissionKey, value: boolean) => void
  ): ColumnDef<PermissionRow>[] => [
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ row }) => <div>{row.original.module}</div>,
    },
    {
      accessorKey: "label",
      header: "Menu / Submenu",
      cell: ({ row }) => <div>{row.original.label}</div>,
    },
    {
      id: "view",
      header: "View",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.view}
          disabled={row.original.disabled?.view}
          onCheckedChange={(val) =>
            onChange(row.original.id, "view", Boolean(val))
          }
        />
      ),
    },
    {
      id: "create",
      header: "Create",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.create}
          disabled={row.original.disabled?.create}
          onCheckedChange={(val) =>
            onChange(row.original.id, "create", Boolean(val))
          }
        />
      ),
    },
    {
      id: "edit",
      header: "Edit",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.edit}
          disabled={row.original.disabled?.edit}
          onCheckedChange={(val) =>
            onChange(row.original.id, "edit", Boolean(val))
          }
        />
      ),
    },
    {
      id: "delete",
      header: "Delete",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.delete}
          disabled={row.original.disabled?.delete}
          onCheckedChange={(val) =>
            onChange(row.original.id, "delete", Boolean(val))
          }
        />
      ),
    },
    {
      id: "approve",
      header: "Approve",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.approve}
          disabled={row.original.disabled?.approve}
          onCheckedChange={(val) =>
            onChange(row.original.id, "approve", Boolean(val))
          }
        />
      ),
    },
  ];

  const updatePermission = (
    id: string,
    key: keyof PermissionRow,
    value: boolean
  ) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  // ------------------ TABLE COLUMNS ------------------
  const overRideColumns: ColumnDef<UserOverrideRow>[] = [
    {
      accessorKey: "module",
      header: "Module",
    },
    {
      accessorKey: "menu",
      header: "Menu / Submenu",
    },
    {
      accessorKey: "roleView",
      header: "Role View",
      cell: ({ row }) =>
        row.original.roleView ? (
          <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-800">
            Yes
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-red-200 text-red-800">
            No
          </span>
        ),
      meta: { align: "center" },
    },
    {
      id: "overrideView",
      header: "Override View",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.overrideView === true}
          onCheckedChange={(val) =>
            toggleOverride(row.original, "overrideView", Boolean(val))
          }
        />
      ),
      meta: { align: "center" },
    },
    {
      accessorKey: "roleCreate",
      header: "Role Create",
      cell: ({ row }) =>
        row.original.roleCreate ? (
          <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-800">
            Yes
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-red-200 text-red-800">
            No
          </span>
        ),
      meta: { align: "center" },
    },
    {
      id: "overrideCreate",
      header: "Override Create",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.overrideCreate === true}
          onCheckedChange={(val) =>
            toggleOverride(row.original, "overrideCreate", Boolean(val))
          }
        />
      ),
      meta: { align: "center" },
    },
  ];

  const toggleOverride = (
    row: UserOverrideRow,
    key: keyof UserOverrideRow,
    value: boolean
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, [key]: value } : r))
    );
  };

  return (
    <React.Fragment>
      <Card className="p-4 w-full">
        <CardHeader>
          <CardTitle>Role-Based Menu Permissions</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Selector */}
          <div className="flex gap-8">
            <div className="w-80">
              <label className="text-sm font-medium">Select Role</label>
              <Select defaultValue="1">
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ShadCN DataTable */}
          <DataTable columns={columns(updatePermission)} data={data} />

          <div className="flex justify-end gap-4 pt-3">
            <Button size="sm" onClick={() => console.log("Saving...", data)}>
              Save Role Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="p-4 w-full mt-8">
        <CardHeader>
          <CardTitle>User-Specific Overrides</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* USER SELECT */}
          <div className="flex gap-6 items-start">
            <div className="w-60">
              <label className="text-sm font-medium">Select User</label>
              <Select defaultValue="1">
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DATATABLE */}
          <DataTable columns={overRideColumns} data={rows} />

          {/* SAVE BUTTON */}
          <div className="flex justify-end gap-4 pt-3">
            <Button
              size="sm"
              onClick={() => console.log("Saving overrides:", rows)}
            >
              Save User Overrides
            </Button>
          </div>
        </CardContent>
      </Card>
    </React.Fragment>
  );
}
