import { createFileRoute } from '@tanstack/react-router';

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { DataTable } from '@/components/DataTable'
import { useState, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { CreateTestTableForm } from '@/features/test-tables/CreateTestTableForm';
import { EditTestTableForm } from '@/features/test-tables/EditTestTableForm';

export const Route = createFileRoute(
  '/_authenticated/outdoor/master/test-tables/',
)({
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const token = getCookie('accessToken');
  //const navigate = useNavigate();

  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editTestTable = (id: number) => {
      setTableId(id);
      setOpen(true);
    };
  }, []);

  const { data, refetch: refetchTestTables } = useQuery({
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
        btn.style.backgroundColor = 'black';
        return;
      }

      // Don't expand if already expanded
      if (isExpanded) return;

      // Get data from attributes
      const displayName = btn.dataset.displayName || '-';
      const tableName = btn.dataset.tableName || '-';
      const description = btn.dataset.description || '-';
      const createdBy = btn.dataset.createdBy || '-';
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
                <span class="text-gray-500">Created By</span>
                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  ${createdBy}
                </span>
              </li>

              <li class="flex flex-col">
                <span class="text-gray-500">Table ID</span>
                <span class="font-mono text-sm text-gray-600">#${id}</span>
              </li>

            </ul>

            <!-- Actions -->
            <div class="mt-8 flex justify-end gap-3 border-t pt-5">
              <button onclick="window.location.href='/outdoor/master/test-tables/${id}'"
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
      data: null,
      title: "SL",
      orderable: false,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: TestItem, meta: any) => {
        const sl = (page - 1) * limit + meta.row + 1;
        const displayName = row.display_name || row.name || 'N/A';
        const tableName = row.table_name || 'N/A';
        const description = row.description || '-';

        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                    type="button"
                    data-display-name="${displayName.replace(/"/g, '&quot;')}"
                    data-table-name="${tableName.replace(/"/g, '&quot;')}"
                    data-description="${description.replace(/"/g, '&quot;')}"
                    data-created-by="${(row.creator?.name || row.created_by || '-').replace(/"/g, '&quot;')}"
                    data-id="${row.id}">+</button>
            <span>${sl}</span>
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
      data: "created_by",
      title: "Created By",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: TestItem) => {
        const name = row.creator?.name || row.created_by || '-';
        return `<span class="text-sm text-muted-foreground">${name}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: TestItem) => {
        return `
          <div class="flex gap-2">
            <button onclick="window.location.href='/outdoor/master/test-tables/${row.id}'" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              View
            </button>
            <button onclick="window.editTestTable(${row.id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </button>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  return <>
    <AppHeader fixed />

  <main className='p-4'>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">List of Test Tables</h1>
        <CreateTestTableForm refetchTestTables={refetchTestTables} />
      </div>
      <DataTable
        columns={columns}
        data={data?.data?.items || []}
        meta={data?.data?.meta}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <EditTestTableForm id={tableId} open={open} setOpen={setOpen} />
    </main>
  </>
}
