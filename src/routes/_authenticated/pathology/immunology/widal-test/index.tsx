import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useState, useEffect } from 'react';
import { WidalTestForm } from '@/features/pathology/immunology/EditWidalTestForm';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/widal-test/',
)({
  component: WidalTest,
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  created_at: string;
  status: string;
};

function WidalTest() {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["widal", page, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/widal?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch blood for tcdc reports");
      return res.json(); // MUST match placeholderData
    },

    enabled: !!token,

    // ⭐ Perfect smooth pagination
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


  //console.log(data?.data);

  // Expose edit function to window
  useEffect(() => {
    (window as any).editWidalTest = (id: number, invoiceId: number) => {
      setReportId(id);
      setInvoiceId(invoiceId);
      setIsDrawerOpen(true);
    };
  }, [setReportId, setInvoiceId]);

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
      responsivePriority: 1,
      defaultContent: "",
    },
    {
      data: "created_at",
      title: "Date",
      orderable: true,
      responsivePriority: 2,
      defaultContent: "",
      render: (_data: any, _type: string, row: ReportsItem) => {
        const iso = row.created_at;
        const date = new Date(iso);

        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `<div>${formatted}</div>`; // Example: Nov 23, 2025
      },
    },

    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      defaultContent: "",
      render: (_data: any, _type: string, row: ReportsItem) => {
        const status = row.status || 'Pending';
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status}</span>`;
      },
    },
    // Actions Column
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex gap-2">
            <a href="/pathology/immunology/widal-test/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              View
            </a>
            <button onclick="window.editWidalTest(${row.id}, ${row.invoice_id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </button>
          </div>
        `;
      },
      defaultContent: "",
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
          <h1 className='text-2xl font-bold tracking-tight'>Widal Test</h1>
        </div>
        <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <WidalTestForm open={isDrawerOpen} setOpen={setIsDrawerOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
