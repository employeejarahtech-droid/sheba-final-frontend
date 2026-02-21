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
import { EditUrineForSugarForm } from '@/features/pathology/urine/EditUrineForSugarForm';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-sugar/',
)({
  component: UrineForSugar,
})

type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
  status: string | null;
  test_carried_out_by: string | null;
};

function UrineForSugar() {

  const [open, setOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data: urineSugarData } = useQuery({
    queryKey: ["urine-sugar", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-sugar?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch urine sugar reports");
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
              page,
              limit,
              total: 0,
            },
          },
        },
  });

  const columns = [
    {
      data: "invoice_id",
      title: "Invoice ID",
      orderable: true,
      defaultContent: "",
    },
    {
      data: "patient_name",
      title: "Patient Name",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const patientName = row.patient_name;
        return patientName || '-';
      },
      defaultContent: "",
    },
    {
      data: "created_at",
      title: "Date",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const date = row.created_at;
        return date ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : '-';
      },
      defaultContent: "",
    },
    {
      data: "test_carried_out_by",
      title: "Test Carried Out By",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const testCarriedOutBy = row.test_carried_out_by;
        return testCarriedOutBy || '-';
      },
      defaultContent: "",
    },
    {
      data: "status",
      title: "Status",
      orderable: true,
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.status;
        const color = status === 'Completed' ? 'bg-green-500' : status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-500';
        return `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${color} text-white">${status || 'Pending'}</span>`;
      },
      defaultContent: "",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <button
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
              onclick="window.editUrineSugar(${row.id}, ${row.invoice_id})"
            >
              Edit
            </button>
            <a href="/pathology/urine/urine-for-sugar/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              View Report
            </a>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  // Expose edit function to window for onclick handler
  if (typeof window !== 'undefined') {
    (window as any).editUrineSugar = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }

  return (
    <>
      <Header fixed>
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
          <h1 className='text-2xl font-bold tracking-tight'>Urine For Sugar</h1>
        </div>
        <DataTable columns={columns} data={urineSugarData?.data?.items || []} meta={urineSugarData?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditUrineForSugarForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
