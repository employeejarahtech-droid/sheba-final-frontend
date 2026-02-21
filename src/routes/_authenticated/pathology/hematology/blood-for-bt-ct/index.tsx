import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { EditBloodForBTCTForm } from '@/features/pathology/hematology/blood-for-bt-ct/_components/EditBloodForBTCTForm';
import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/blood-for-bt-ct/',
)({
  component: BloodForBTCT,
})

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]

type BTCTItem = {
  id: number;
  invoice_id: number;
  patient_name: string;
  bleeding_time: number | null;
  clotting_time: number | null;
  created_at: string;
};

function BloodForBTCT() {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data, isLoading, error } = useQuery({
    queryKey: ["btct", page, search],

    queryFn: async () => {
      console.log('Fetching BTCT data...', { page, limit, search });
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/btct?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('BTCT Response status:', res.status);
      if (!res.ok) throw new Error("Failed to fetch blood for BT/CT reports");
      const json = await res.json();
      console.log('BTCT Response JSON:', json);
      return json; // MUST match placeholderData
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

  console.log('BTCT Data State:', { data, isLoading, error });


  console.log('BTCT Query Response:', data);

  // Expose edit function to window
  useEffect(() => {
    (window as any).editBloodForBTCT = (id: number, invoiceId: number) => {
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
      responsivePriority: 2,
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
      responsivePriority: 3,
      render: (_data: any, _type: string, row: BTCTItem) => {
        const iso = row.created_at;
        const date = new Date(iso);

        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `<div>${formatted}</div>`; // Example: Nov 23, 2025
      },
      defaultContent: "",
    },
    // Actions Column
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: BTCTItem) => {
        return `
          <div class="flex gap-2">
            <a href="/pathology/hematology/blood-for-bt-ct/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
            View Report
            </a>
            <button onclick="window.editBloodForBTCT(${row.id}, ${row.invoice_id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
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
          <h1 className='text-2xl font-bold tracking-tight'>Blood For BT/CT</h1>
        </div>
        {(() => {
          const items = data?.data?.items || [];
          const meta = data?.data?.meta;
          console.log('Passing to DataTable:', { items, meta });
          return null;
        })()}
        <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditBloodForBTCTForm open={isDrawerOpen} setOpen={setIsDrawerOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}

