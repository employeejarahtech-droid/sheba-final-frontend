import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from "@/components/ui/button";
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
};

function TestTables() {
  const [tableId, setTableId] = useState<number>(1);
  const [open, setOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');
  const navigate = useNavigate();

  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editTestTable = (id: number) => {
      setTableId(id);
      setOpen(true);
    };
  }, []);

  const { data, refetch: refetchTestTables } = useQuery({
    queryKey: ["test-tables", page, search],
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

  const columns = [
    {
      data: null,
      title: "SL",
      orderable: false,
      responsivePriority: 3,
      render: (_data: any, _type: string, _row: TestItem, meta: any) => {
        return (page - 1) * limit + meta.row + 1;
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
    <Header>
      <Search />
      <div className='ms-auto flex items-center space-x-4'>
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>

    <Main>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight mb-4">List of Test Tables</h1>
        <CreateTestTableForm refetchTestTables={refetchTestTables} />
      </div>
      <DataTable
        columns={columns}
        data={data?.data?.items || []}
        meta={data?.data?.meta}
        onPageChange={(newPage) => setPage(newPage)} search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1); // reset page when searching
        }}
      />
      <EditTestTableForm id={tableId} open={open} setOpen={setOpen} />
    </Main>
  </>
}
