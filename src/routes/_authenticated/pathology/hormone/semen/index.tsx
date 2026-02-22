import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/semen/',
)({
  component: Semen,
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
};

function Semen() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const token = getCookie('accessToken');

  const { data: semenReports } = useQuery({
    queryKey: ["semen", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/semen?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch semen reports");
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

  const items = semenReports?.data?.items || [];
  const meta = semenReports?.data?.meta || { page, limit, total: 0 };

  const columns = [
    {
      data: 'id',
      title: 'ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'invoice_id',
      title: 'Invoice ID',
      orderable: true,
      defaultContent: '',
    },
    {
      data: 'patient_name',
      title: 'Patient Name',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.patient_name;
        return patientName || '-';
      },
      defaultContent: '',
    },
    {
      data: 'created_at',
      title: 'Date',
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.created_at;
        return date ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-';
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
            <a href="/pathology/hormone/semen/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </a>
            <a href="/pathology/hormone/semen/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              View Report
            </a>
          </div>
        `;
      },
      defaultContent: '',
    },
  ];

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Semen Analysis</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )

}
