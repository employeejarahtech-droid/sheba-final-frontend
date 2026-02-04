import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/top-nav'
import { topNav } from '@/data/data'
import { FileText, DollarSign } from 'lucide-react'
import { Link } from '@tanstack/react-router'

type InvoiceItem = {
  id: number;
  patient_name: string;
  phone: string | null;
  doctor?: { doctor_name: string; };
  total_amount: number;
  discount: number;
  net_amount: number | null;
  total_paid: number;
  due_amount: number;
  invoice_date: string;
  status: string;
};

export default function DueCollection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const token = getCookie('accessToken');

  const { data } = useQuery({
    queryKey: ["due-invoices", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&due_only=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { rows: [], total: 0 } },
  });

  // Calculate stats for the current view (filtered by due_only)
  const stats = useMemo(() => {
    const invoices = data?.data?.items || [];
    const totalDueInvoices = data?.data?.meta?.total || 0;

    const totalDueAmount = invoices.reduce((sum: number, inv: InvoiceItem) => sum + Number(inv.due_amount || 0), 0);

    return [
      {
        label: "Due Invoices",
        value: totalDueInvoices,
        gradient: "from-red-600 to-red-400",
        shadow: "shadow-red-500/30",
        icon: <FileText className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Due Amount (Page)",
        value: `৳${totalDueAmount.toLocaleString()}`,
        gradient: "from-orange-600 to-orange-400",
        shadow: "shadow-orange-500/30",
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
    ];
  }, [data]);

  const columns: ColumnDef<InvoiceItem>[] = [
    {
      accessorKey: "id",
      header: "Invoice ID",
    },
    {
      accessorKey: "patient_name",
      header: "Patient Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "doctor.doctor_name",
      header: "Ref. Doctor",
      cell: ({ row }) => <div>{row.original.doctor?.doctor_name ?? "-"}</div>,
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => <div>{row.original.total_amount ?? 0}</div>,
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => <div>{row.original.discount ?? 0}</div>,
    },
    {
      accessorKey: "total_paid",
      header: "Paid (৳)",
      cell: ({ row }) => <div className="text-emerald-600 font-medium">{row.original.total_paid ?? 0}</div>,
    },
    {
      accessorKey: "due_amount",
      header: "Due (৳)",
      cell: ({ row }) => <div className="text-red-600 font-bold">{row.original.due_amount ?? 0}</div>,
    },
    {
      accessorKey: "invoice_date",
      header: "Date",
      cell: ({ row }) => <div>{new Date(row.original.invoice_date).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const due = parseFloat(row.original.due_amount as any || 0);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${due > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
            {due > 0 ? 'Due' : 'Paid'}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Link to={`/outdoor/reception/due-collection/$invoiceId`} params={{ invoiceId: row.original.id.toString() }}>
            <Button size="sm" variant="outline">
              Collect Due
            </Button>
          </Link>
        );
      },
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

      <main className='p-6 lg:p-10'>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Due Collection List</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">{item.label}</p>
                  <h3 className="mt-2 text-3xl font-bold text-white">
                    {item.value}
                  </h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  {item.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.items || []}
          meta={data?.data?.meta}
          onPageChange={setPage}
          search={search}
          onSearchChange={setSearch}
        />
      </main>
    </>
  )
}
