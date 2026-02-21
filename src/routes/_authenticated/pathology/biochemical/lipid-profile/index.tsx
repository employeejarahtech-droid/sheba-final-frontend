import { createFileRoute, Link } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, FileText, AlertCircle } from 'lucide-react';
import { useState, useEffect } from "react";
import { EditLipidProfileForm } from '@/features/pathology/biochemical/lipid-profile/components/EditLipidProfileForm';
import { getCookie } from '@/lib/cookies';
import { useQuery } from '@tanstack/react-query';
import { topNav } from '@/data/data';

export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/lipid-profile/',
)({
  component: LipidProfile,
})

type LipidProfileItem = {
  id: number;
  invoice_id: string;
  patient_name: string;
  created_at: string;
  status: string;
};

function LipidProfile() {
  const [open, setOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number>(1);
  const [invoiceId, setInvoiceId] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["lipid-profile", page, limit, search],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lipid-profile?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lipid profiles");
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

  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editLipidProfile = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }, [setOpen, setReportId, setInvoiceId]);

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
      render: (_data: any, _type: string, row: LipidProfileItem) => {
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

    {
      data: "status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        const status = row.status;
        const color =
          status === "passed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-500"
              : "bg-yellow-500";

        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status || 'Pending'}</span>`;
      },
      defaultContent: "",
    },
    // Actions Column
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: LipidProfileItem) => {
        return `
          <div class="flex gap-2">
            <a href="/pathology/biochemical/lipid-profile/report/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
            View Report
            </a>
            <button onclick="window.editLipidProfile(${row.id}, ${row.invoice_id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
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
          <h1 className='text-2xl font-bold tracking-tight'>Lipid Profile</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Total Reports */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Total Reports</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.meta?.total || 0}</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="relative flex justify-between text-white/90 text-sm">
              <span>All Time</span>
              <span className="font-semibold">Records</span>
            </div>
          </div>

          {/* Completed Reports */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Completed</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.items?.filter((i: any) => i.status === 'passed').length || 0}</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="relative flex justify-between text-white/90 text-sm">
              <span>Status</span>
              <span className="font-semibold">Passed</span>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-400 p-6 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Pending</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.items?.filter((i: any) => !i.status || i.status === 'pending').length || 0}</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="relative flex justify-between text-white/90 text-sm">
              <span>Status</span>
              <span className="font-semibold">Awaiting</span>
            </div>
          </div>

          {/* Rejected/Failed */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-400 p-6 shadow-lg shadow-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/90 uppercase tracking-widest">Failed</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{data?.data?.items?.filter((i: any) => i.status === 'failed').length || 0}</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="relative flex justify-between text-white/90 text-sm">
              <span>Status</span>
              <span className="font-semibold">Attention</span>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        <EditLipidProfileForm open={open} setOpen={setOpen} reportId={reportId} invoiceId={invoiceId} />
      </Main>
    </>

  )
}

