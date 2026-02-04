"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  onPageChange,
  search,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const page = meta?.page || 1;
  const limit = meta?.limit || data.length || 10;
  const total = meta?.total || data.length || 0;
  const totalPage = Math.ceil(total / limit);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: search || "",
    },
    onGlobalFilterChange: onSearchChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Global Search */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search..."
          value={search || ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} results
        </div>
        <div className="space-x-2 flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1 text-sm">
            <span>Page</span>
            <select
              value={page}
              onChange={(e) => onPageChange?.(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
            >
              {Array.from({ length: totalPage }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span>of {totalPage}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
