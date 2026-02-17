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
import { EditSkinScrapingForFungalForm } from '@/features/pathology/special/EditSkinScrappingForFungusForm';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/hormone/skin-scrapping-for-fungus/',
)({
  component: SkinScrappingForFungus,
})


type ReportsItem = {
  id: number;
  invoice_id: number;
  patient_name: string | null;
  created_at: string | null;
};

function SkinScrappingForFungus() {
  const [reportId, setReportId] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const token = getCookie('accessToken');

  const { data: skinScrapingReports } = useQuery({
    queryKey: ["skin-scraping", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/skin-scraping?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch skin scraping reports");
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

  // Expose edit function to window for onclick handler
  if (typeof window !== 'undefined') {
    (window as any).editSkinScraping = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }

  const items = skinScrapingReports?.data?.items || [];
  const meta = skinScrapingReports?.data?.meta || { page, limit, total: 0 };

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
            <button onclick="window.editSkinScraping(${row.id}, ${row.invoice_id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
              Edit
            </button>
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
          <h1 className='text-2xl font-bold tracking-tight'>Skin Scrapping For Fungus</h1>
        </div>
        <DataTable columns={columns} data={items} meta={meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditSkinScrapingForFungalForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}
