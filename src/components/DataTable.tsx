"use client";

import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import 'datatables.net-dt';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search as SearchIcon, Loader2 } from 'lucide-react';
import { getPageNumbers } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableProps<TData> {
  columns: {
    data: string | null;
    title?: string;
    render?: (data: any, type: string, row: TData, meta: any) => string;
    orderable?: boolean;
    className?: string;
    responsivePriority?: number;
    visible?: boolean;
    defaultContent?: string;
  }[];
  data: TData[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  filterSlot?: React.ReactNode;
  tableTitle?: string;
  hideExport?: boolean;
  createdRow?: (row: Node, data: TData[], dataIndex: number) => void;
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  isLoading,
  filterSlot,
  tableTitle,
  hideExport,
  createdRow,
}: DataTableProps<TData>) {
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);
  const columnsRef = useRef(columns);
  const searchRef = useRef(search);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState(search || "");
  const debouncedSearch = useDebounce(localSearch, 500);

  // Sync localSearch with search prop if search prop changes from outside
  useEffect(() => {
    if (search !== undefined && search !== localSearch) {
      setLocalSearch(search);
    }
  }, [search]);

  // Handle debounced search change - push to parent
  useEffect(() => {
    if (onSearchChange && debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, search]);

  // Update refs on every render to avoid stale closures in jQuery events
  useEffect(() => {
    columnsRef.current = columns;
    searchRef.current = search;
  }, [columns, search]);

  // ── Drag-to-scroll on hover ──────────────────────────────────────────────
  useEffect(() => {
    const el = scrollWrapperRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollL = 0;

    const onDown = (e: MouseEvent) => {
      // Don't hijack clicks on interactive elements
      if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return;
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollL = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollL - walk;
    };

    const onUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Initialize DataTable ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tableRef.current || dataTableRef.current) return;

    const table = $(tableRef.current).DataTable({
      data: data,
      columns: columns.map((_col: any) => ({
        data: _col.data,
        title: _col.title,
        render: (data: any, type: string, row: TData, dtMeta: any) => {
          if (_col.render) {
            return _col.render(data, type, row, dtMeta);
          }
          return data;
        },
        orderable: _col.orderable !== false,
        searchable: _col.searchable !== false,
        className: _col.className,
        visible: _col.visible !== false,
        defaultContent: _col.defaultContent || "",
        width: 'auto',
      })),
      autoWidth: false,
      pageLength: meta?.limit || 10,
      lengthMenu: [10, 25, 50, 100],
      searching: true,
      ordering: true,
      info: true,
      responsive: false,
      // Sticky first column
      columnDefs: [
        {
          targets: 0,
          className: 'dt-sticky-left',
        }
      ],
      language: {
        search: "Search:",
        lengthMenu: "Show _MENU_ entries per page",
        info: "Showing _START_ to _END_ of _TOTAL_ entries",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous",
        },
        emptyTable: "No data available",
      },
      ...(createdRow ? { createdRow } : {}),
      dom: '<"top"rt><"clear">',
      paging: true,
    });

    dataTableRef.current = table;

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (dataTableRef.current) {
      const table = dataTableRef.current;
      table.clear();
      table.rows.add(data);
      table.draw();
    }
  }, [data]);

  // Sync header titles when columns change. DataTables only applies column
  // titles at initialization, so without this a value that loads after init
  // (e.g. a dynamic currency symbol like "AED") would be frozen at the default
  // captured on first render.
  useEffect(() => {
    const table = dataTableRef.current;
    if (!table) return;
    columns.forEach((col, idx) => {
      const headerCell = table.column(idx).header();
      if (headerCell) {
        headerCell.textContent = col.title ?? col.data ?? '';
      }
    });
  }, [columns]);

  // Update pageLength when limit changes
  useEffect(() => {
    if (dataTableRef.current && meta?.limit) {
      dataTableRef.current.page.len(meta.limit).draw();
    }
  }, [meta?.limit]);

  // Export to CSV
  const exportToCSV = () => {
    if (!dataTableRef.current) return;

    const tableData = data.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
        if (col.data === null && col.render) {
          const renderedValue = col.render(null, 'export', row, {});
          obj[col.title || ''] = renderedValue;
        } else if (col.data) {
          obj[col.data] = row[col.data];
        }
      });
      return obj;
    });

    if (tableData.length === 0) return;

    const headers = columns.map((col) => col.title || col.data || '').join(',');
    const rows = tableData.map((row) =>
      columns.map((col) => {
        const key = col.data || col.title || '';
        const value = row[key];
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table-data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const page = meta?.page || 1;
  const limit = meta?.limit || data.length || 10;
  const total = meta?.total || data.length || 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {tableTitle && (
            <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">{tableTitle}</h2>
          )}
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
          <div className="text-sm text-gray-600">
            {meta?.total && (
              <span>Total: {meta.total} records {isLoading && "(Loading...)"}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filterSlot}
          {!hideExport && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* DataTable — scroll wrapper with drag support */}
      <div
        ref={scrollWrapperRef}
        className="relative rounded-md border overflow-x-auto"
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {/* Sticky-first-column styles */}
        <style>{`
          .dt-sticky-left {
            position: sticky !important;
            left: 0;
            z-index: 5;
            background: linear-gradient(to bottom right, #2563eb, #60a5fa) !important;
            color: white !important;
          }
          .dt-sticky-left .font-mono,
          .dt-sticky-left span {
            color: white !important;
          }
          .dt-sticky-left a,
          .dt-sticky-left button.expand-btn {
            color: white !important;
            border-color: rgba(255,255,255,0.4) !important;
          }
          table.dataTable thead th.dt-sticky-left {
            z-index: 6;
            background: linear-gradient(to bottom right, #2563eb, #60a5fa) !important;
            color: white !important;
          }
          table.dataTable thead th.dt-sticky-left::after,
          table.dataTable tbody td.dt-sticky-left::after {
            content: '';
            position: absolute;
            top: 0;
            right: -6px;
            bottom: 0;
            width: 6px;
            background: linear-gradient(to right, rgba(37,99,235,0.15), transparent);
            pointer-events: none;
          }
          table.dataTable thead th.dt-sticky-left,
          table.dataTable tbody td.dt-sticky-left {
            position: sticky !important;
          }
        `}</style>
        <table
          ref={tableRef}
          className="display nowrap w-full dataTable"
          style={{ width: '100%' }}
        >
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`${col.className || ''}${idx === 0 ? ' dt-sticky-left' : ''}`}
                >
                  {col.title || col.data}
                </th>
              ))}
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      {/* Custom Pagination Info & Buttons */}
      {meta && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 mt-4">
          <div>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} results
          </div>

          <div className="flex items-center space-x-6">
            {/* Limit Selector */}
            {onLimitChange && (
              <div className="flex items-center space-x-2">
                <span className="text-xs whitespace-nowrap text-muted-foreground font-medium">Rows per page</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => onLimitChange(Number(val))}
                >
                  <SelectTrigger size="sm" className="h-8 w-[70px]">
                    <SelectValue placeholder={limit} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 25, 50, 100].map((val) => (
                      <SelectItem key={val} value={String(val)}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex h-8 w-8 p-0"
                onClick={() => onPageChange?.(1)}
                disabled={page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First Page</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page Buttons */}
              <div className="hidden md:flex items-center space-x-1">
                {getPageNumbers(page, Math.ceil(total / limit)).map((p, idx) => (
                  <div key={idx}>
                    {p === '...' ? (
                      <span className="px-2">...</span>
                    ) : (
                      <Button
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange?.(Number(p))}
                      >
                        {p}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex h-8 w-8 p-0"
                onClick={() => onPageChange?.(Math.ceil(total / limit))}
                disabled={page >= Math.ceil(total / limit)}
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last Page</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
