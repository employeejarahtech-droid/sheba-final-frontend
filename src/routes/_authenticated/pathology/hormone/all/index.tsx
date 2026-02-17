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
  '/_authenticated/pathology/hormone/all/',
)({
  component: AllHormones,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  Status: string;
};

function AllHormones() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: hormoneAllReports } = useQuery({
    queryKey: ["hormon-all", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hormon-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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
            total: 0,
          },
        },
  });

  const items = hormoneAllReports?.data?.items || [];
  const meta = hormoneAllReports?.data?.meta || { page, limit, total: 0 };

  const columns = [
    {
      data: 'ReciptID',
      title: 'Receipt ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'PatientId',
      title: 'Patient ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'PatientName',
      title: 'Patient Name',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.PatientName;
        return patientName || '-';
      },
      defaultContent: '',
    },
    {
      data: 'Date',
      title: 'Date',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.Date;
        return date ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-';
      },
      defaultContent: '',
    },
    {
      data: 'Tests',
      title: 'Hormone Record IDs',
      render: (data: any) => {
        const tests = data as string;
        if (!tests) return '-';

        // Split comma-separated IDs and display as badges
        const testIds = tests.split(',').filter(id => id.trim() !== '');
        return testIds.map((id) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 mr-1 mb-1">${id.trim()}</span>`
        ).join('');
      },
      orderable: false,
      defaultContent: '',
    },
    {
      data: 'Status',
      title: 'Status',
      orderable: true,
      render: (data: any) => {
        const status = data as string;
        const statusColor = status === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return `<span class="${statusColor}">${status || 'Pending'}</span>`;
      },
      defaultContent: '',
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <a href="/pathology/hormone/all/edit/${row.ReciptID}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </a>
          </div>
        `;
      },
      defaultContent: '',
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
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Hormones)</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )

}
