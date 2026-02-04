/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

/* ---------------------------
   Debounce Hook (Typed)
---------------------------- */
// function useDebounce<T extends (...args: any[]) => void>(
//   callback: T,
//   delay: number
// ) {
//   const timer = useRef<NodeJS.Timeout | null>(null);

//   return (...args: Parameters<T>) => {
//     if (timer.current) clearTimeout(timer.current);

//     timer.current = setTimeout(() => {
//       callback(...args);
//     }, delay);
//   };
// }

/* ---------------------------
   Component Types
---------------------------- */
interface DataTableProps<TData> {
  columns?: ColumnDef<TData>[];
  data?: TData[];

  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;

  onPageChange?: (page: number) => void;
  search?: string;
  onSearch?: (value: string) => void;
  isFetching?: boolean | null;

  globalFilterValue?: string;
  onGlobalFilterChange?: (value: string) => void;
}

/* ---------------------------
   DataTable Component
---------------------------- */
export function DataTable<TData>({
  columns = [],
  data = [],
  totalCount = 0,
  pageIndex = 0,
  pageSize = 10,
  onPageChange = () => { },
  onSearch = () => { },
  isFetching = null,
  // onGlobalFilterChange = () => {},
  globalFilterValue = "",
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState(globalFilterValue || "");

  // const debouncedFilter = useDebounce((value: string) => {
  //   onGlobalFilterChange && onGlobalFilterChange(value);
  // }, 300);

  // useEffect(() => {
  //   debouncedFilter(globalFilter);
  // }, [globalFilter]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, pagination: { pageIndex, pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  // const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search..."
        value={globalFilter}
        onChange={(e) => {
          setGlobalFilter(e.target.value);
          onSearch?.(e.target.value); // 🔥 ask parent to fetch from API
        }}
        className="max-w-sm"
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={(header.column.columnDef.meta as any)?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell
                  colSpan={columns?.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={(cell.column.columnDef.meta as any)?.className}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns?.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between py-4 gap-4">
        {/* Showing X–Y of Z */}
        <div className="text-sm">
          Showing {pageIndex * pageSize + 1}–
          {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}{" "}
          results
        </div>

        {/* Pagination Controls */}
        <div className="space-x-2 flex items-center">
          {/* Previous */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            Previous
          </Button>

          {/* Page Selector */}
          <div className="flex items-center gap-1 text-sm">
            <span>Page</span>
            <select
              value={pageIndex + 1}
              onChange={(e) => onPageChange?.(Number(e.target.value) - 1)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
            >
              {Array.from(
                { length: Math.ceil(totalCount / pageSize) },
                (_, i) => i + 1
              ).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span>of {Math.ceil(totalCount / pageSize)}</span>
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={pageIndex + 1 >= Math.ceil(totalCount / pageSize)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
