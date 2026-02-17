import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/stool-re/',
)({
  component: StoolRe,
})

type ReportItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  test_result: string | null;
  remarks: string | null;
  test_carried_out_by: string | null;
  created_at: string;
  status: string;
};

function StoolRe() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["stool-re", page, search],

    queryFn: async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stool-re?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          console.error('API Response:', res.status, res.statusText);
          return {
            data: {
              items: [],
              meta: {
                page,
                limit,
                total: 0,
              },
            },
          };
        }
        const jsonData = await res.json();
        console.log('Stool R/E API response:', jsonData);
        return jsonData;
      } catch (err) {
        console.error('Error fetching Stool R/E reports:', err);
        return {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        };
      }
    },

    enabled: !!token,
    retry: 0,

    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        },
  });

  // Use only API data (no fallback)
  const items = data?.data?.items || [];
  const meta = data?.data?.meta || { page, limit, total: 0 };

  // Define columns for jQuery DataTable format
  const columns = [
    {
      data: 'invoice_id',
      title: 'Invoice ID',
      className: 'font-mono text-sm',
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      className: 'font-medium',
    },
    {
      data: 'test_result',
      title: 'Test Result',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || '-'}</div>`;
      },
    },
    {
      data: 'created_at',
      title: 'Date',
      render: (data: any) => {
        const iso = data as string;
        const date = new Date(iso);
        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `<div class="text-sm">${formatted}</div>`;
      },
    },
    {
      data: 'test_carried_out_by',
      title: 'Test Carried Out By',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || '-'}</div>`;
      },
    },
    {
      data: 'status',
      title: 'Status',
      render: (data: any) => {
        const status = data as string;
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} text-white border-transparent">${status || 'Pending'}</span>`;
      },
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: ReportItem) => {
        return `
          <a href="/pathology/stool/stool-re/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 mr-2">Edit</a>
          <a href="/pathology/stool/stool-re/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-info hover:bg-info-foreground h-8 px-3">View</a>
        `;
      },
    },
  ];

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Stool R/E</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}
