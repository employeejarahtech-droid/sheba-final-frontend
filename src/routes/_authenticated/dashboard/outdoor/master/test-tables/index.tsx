import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { DataTable } from '@/components/DataTable'
import { useState, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreateTestTableForm } from '@/features/test-tables/CreateTestTableForm';
import { EditTestTableForm } from '@/features/test-tables/EditTestTableForm';

const testTablesSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/outdoor/master/test-tables/',
)({
  validateSearch: (search) => testTablesSearchSchema.parse(search),
  component: TestTables,
})


type TestItem = {
  id: string;
  name: string;
  table_name: string;
  description: string;
  display_name: string;
  created_at: string;
  created_by?: string;
  creator?: { id: number; name: string };
};

function TestTables() {
  const [tableId, setTableId] = useState<number>(1);
  const [open, setOpen] = useState<boolean>(false);

  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };

  const token = getCookie('accessToken');
  //const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Failed to delete test table');
      return json;
    },
    onSuccess: () => {
      toast.success('Test table deleted');
      queryClient.invalidateQueries({ queryKey: ['test-tables'] });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editTestTable = (id: number) => {
      setTableId(id);
      setOpen(true);
    };
  }, []);

  // Expose delete function to window for onclick handlers
  useEffect(() => {
    (window as any).deleteTestTable = (id: number) => {
      if (confirm('Delete this test table? This action cannot be undone.')) {
        deleteMutation.mutate(id);
      }
    };
  }, [deleteMutation]);

  const { data, isFetching, refetch: refetchTestTables } = useQuery({
    queryKey: ["test-tables", page, limit, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-tables?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            meta: {
              total: 0,
              page: 1,
              limit: 10
            }
          },
        },
  });

  // Handle expand button clicks using event delegation
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn');
      if (!button) return;

      const btn = button as HTMLButtonElement;
      const row = btn.closest('tr');
      if (!row) return;

      const isExpanded = row.classList.contains('expanded');
      const nextRow = row.nextElementSibling;

      // Toggle collapse
      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove();
        row.classList.remove('expanded');
        btn.textContent = '+';
        btn.style.backgroundColor = '#10B981';
        return;
      }

      // Don't expand if already expanded
      if (isExpanded) return;

      // Get data from attributes
      const displayName = btn.dataset.displayName || '-';
      const tableName = btn.dataset.tableName || '-';
      const description = btn.dataset.description || '-';
      const id = btn.dataset.id || '';

      // Create card HTML
      const cardContainer = document.createElement('div');
      cardContainer.className = 'max-w-3xl mx-auto my-4';
      cardContainer.innerHTML = `
        <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <h2 class="text-lg font-semibold text-white">Test Table Information</h2>
            <p class="text-emerald-100 text-sm">Detailed overview of selected test table</p>
          </div>

          <!-- Body -->
          <div class="p-6">
            <ul class="grid md:grid-cols-2 gap-6 text-sm">

              <li class="flex flex-col">
                <span class="text-gray-500">Display Name</span>
                <span class="font-semibold text-gray-800 text-base">${displayName}</span>
              </li>

              <li class="flex flex-col">
                <span class="text-gray-500">Table Name</span>
                <span class="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">${tableName}</span>
              </li>

              <li class="flex flex-col md:col-span-2">
                <span class="text-gray-500">Description</span>
                <span class="font-medium text-gray-700 text-sm">${description || 'No description provided'}</span>
              </li>

              <li class="flex flex-col">
                <span class="text-gray-500">Table ID</span>
                <span class="font-mono text-sm text-gray-600">#${id}</span>
              </li>

            </ul>

            <!-- Actions -->
            <div class="mt-8 flex justify-end gap-3 border-t pt-5">
              <button onclick="window.location.href='/dashboard/outdoor/master/test-tables/${id}'"
                      class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                View
              </button>

              <button onclick="window.editTestTable(${id})"
                      class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition h-10 px-5 shadow">
                Edit
              </button>
            </div>
          </div>
        </div>
      `;

      // Create new row
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-muted/50';
      cell.colSpan = 10;
      cell.appendChild(cardContainer);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '−';
      btn.style.backgroundColor = '#dc2626';
    };

    // Add event listener to document for delegation
    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, []);

  const columns = [
    {
      data: "id",
      title: "ID",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: TestItem, meta: any) => {
        const displayName = row.display_name || row.name || 'N/A';
        const tableName = row.table_name || 'N/A';
        const description = row.description || '-';

        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-display-name="${displayName.replace(/"/g, '&quot;')}"
                    data-table-name="${tableName.replace(/"/g, '&quot;')}"
                    data-description="${description.replace(/"/g, '&quot;')}"
                    data-id="${row.id}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.id.toString().startsWith('TT-') ? row.id : 'TT-' + row.id}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "display_name",
      title: "Test Table Name",
      orderable: true,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: TestItem) => {
        return row.display_name || row.name || 'N/A';
      },
      defaultContent: "N/A",
    },
    {
      data: "table_name",
      title: "Match Table Name",
      orderable: true,
      responsivePriority: 2,
      render: (_data: any, _type: string, row: TestItem) => {
        return row.table_name || 'N/A';
      },
      defaultContent: "N/A",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: TestItem) => {
        return `
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.location.href='/dashboard/outdoor/master/test-tables/${row.id}'" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </button>
            <button onclick="window.editTestTable(${row.id})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Edit
            </button>
            <button onclick="window.deleteTestTable(${row.id})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  return <>
    <AppHeader fixed />

  <main className=''>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">List of Test Tables</h1>
        <CreateTestTableForm refetchTestTables={refetchTestTables} />
      </div>
      <DataTable
        columns={columns}
        data={data?.data?.items || []}
        meta={data?.data?.meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        isLoading={isFetching}
      />
      <EditTestTableForm id={tableId} open={open} setOpen={setOpen} />
    </main>
  </>
}
