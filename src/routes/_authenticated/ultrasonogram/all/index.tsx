import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useState, useMemo } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/ultrasonogram/all/',
)({
  component: AllUltrasonogramReports,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  Status: string;
};

function AllUltrasonogramReports() {

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data: ultrasonogramAllReports } = useQuery({
    queryKey: ["ultrasonogram-all", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
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

  const columns = useMemo(() => [
    {
      data: "ReciptID",
      title: "Receipt ID",
      orderable: true,
      defaultContent: "",
    },
    {
      data: "PatientId",
      title: "Patient ID",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data ? new Date(data).toLocaleDateString() : '-',
    },
    {
      data: "Tests",
      title: "Ultrasonogram Record IDs",
      orderable: false,
      defaultContent: "",
      render: (data: any) => {
        if (!data) return '-';
        const testIds = data.split(',').filter((id: string) => id.trim() !== '');
        return testIds.map((id: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1">${id.trim()}</span>`
        ).join('');
      },
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      defaultContent: "",
      render: (data: any) => {
        const statusColor = data === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return `<span class="${statusColor}">${data}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      defaultContent: "",
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <a href="/ultrasonogram/all/print/${row.ReciptID}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">View Report</a>
            <a href="/ultrasonogram/all/edit/${row.ReciptID}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">Edit</a>
          </div>
        `;
      },
    },
  ], []);

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>All Reports (Ultrasonogram)</h1>
        </div>
        <DataTable columns={columns} data={ultrasonogramAllReports?.data?.items || []} meta={{ page, limit, total: ultrasonogramAllReports?.data?.meta?.total || 0 }} onPageChange={setPage} search={search} onSearchChange={setSearch} />
      </Main>
    </>

  )
}
