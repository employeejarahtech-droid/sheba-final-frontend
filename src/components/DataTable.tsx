"use client";

import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-responsive-dt';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  meta,
  onPageChange,
  search,
  onSearchChange,
}: DataTableProps<TData>) {
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);
  const isProgrammaticPageChange = useRef(false);

  // Initialize DataTable
  useEffect(() => {
    if (!tableRef.current || dataTableRef.current) return;

    // Add control column for expand/collapse
    const controlColumn = {
      data: null,
      defaultContent: '',
      orderable: false,
      searchable: false,
      className: 'control',
      responsivePriority: 1,
      title: '',
    };
    const columnsWithControl = [controlColumn, ...columns] as any[];

    // Initialize jQuery DataTable with Responsive
    const table = $(tableRef.current).DataTable({
      data: data,
      columns: columnsWithControl.map((col: any) => ({
        data: col.data,
        title: col.title,
        render: col.render
          ? (_data: any, _type: string, row: TData, meta: any) => col.render!(_data, _type, row, meta)
          : undefined,
        orderable: col.orderable !== false,
        searchable: col.searchable !== false,
        className: col.className,
        responsivePriority: col.responsivePriority || 10000,
        visible: col.visible !== false,
        defaultContent: col.defaultContent || "",
      })),
      pageLength: meta?.limit || 10,
      lengthMenu: [10, 25, 50, 100],
      searching: true,
      ordering: true,
      info: true,
      responsive: {
        details: {
          type: 'column',
          target: 0
        }
      },
      columnDefs: [
        {
          className: 'control',
          orderable: false,
          targets: 0
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
      dom: '<"top"rt<"bottom"ip><"clear">',
    });

    dataTableRef.current = table;

    // Handle page change (only from user interaction, not from programmatic changes)
    table.on('page.dt', () => {
      // Only trigger onPageChange if this is a user-initiated page change
      if (!isProgrammaticPageChange.current) {
        const info = table.page.info();
        if (onPageChange) {
          onPageChange(info.page + 1);
        }
      }
      // Reset the flag after handling
      isProgrammaticPageChange.current = false;
    });

    // Handle search
    table.on('search.dt', () => {
      const searchValue = table.search();
      if (onSearchChange && typeof searchValue === 'string') {
        onSearchChange(searchValue);
      }
    });

    return () => {
      // Destroy DataTable on cleanup
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

  // Update search when controlled search prop changes
  useEffect(() => {
    if (dataTableRef.current && search !== undefined) {
      const currentSearch = dataTableRef.current.search();
      const currentSearchString = typeof currentSearch === 'string' ? currentSearch : '';
      if (currentSearchString !== search) {
        dataTableRef.current.search(search).draw();
      }
    }
  }, [search]);

  // Update page when controlled page prop changes (for server-side pagination)
  useEffect(() => {
    if (dataTableRef.current && meta?.page) {
      const table = dataTableRef.current;
      const currentPage = table.page.info().page; // 0-based
      const targetPage = meta.page - 1; // Convert to 0-based
      if (currentPage !== targetPage) {
        isProgrammaticPageChange.current = true; // Mark as programmatic change
        table.page(targetPage).draw(false);
      }
    }
  }, [meta?.page]);

  // Export to CSV
  const exportToCSV = () => {
    if (!dataTableRef.current) return;

    const tableData = data.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
        // For computed fields (data is null), use the render function
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
        // Escape values containing commas or quotes
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
          <div className="text-sm text-gray-600">
            {meta?.total && (
              <span>Total: {meta.total} records</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* DataTable */}
      <div className="rounded-md border overflow-hidden">
        <table
          ref={tableRef}
          className="display nowrap w-full dataTable collapsed"
          style={{ width: '100%' }}
        >
          <thead>
            <tr>
              <th className="control" style={{ width: '30px' }}></th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={col.className || ''}
                  data-priority={col.responsivePriority || 10000}
                >
                  {col.title || col.data}
                </th>
              ))}
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      {/* Custom Pagination Info */}
      {meta && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} results
          </div>
        </div>
      )}
    </div>
  );
}
