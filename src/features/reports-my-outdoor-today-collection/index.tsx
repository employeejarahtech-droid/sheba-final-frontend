import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileText, DollarSign, TrendingUp, Calendar, CreditCard, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

type PaymentItem = {
  id: number;
  invoice_prefix: string | null;
  patient_name: string;
  sex: string | null;
  age: string | null;
  age_text: string | null;
  phone: string | null;
  doctor?: {
    id: number;
    doctor_name: string;
  } | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  total_amount: number;
  net_amount: number | null;
  payment_id: number;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  payment_created_at: string;
  payment_created_by?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
};

interface ReportsMyOutdoorTodayCollectionProps {
  page: number
  limit: number
  search: string
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
}

export default function ReportsMyOutdoorTodayCollection({
  page,
  limit,
  search,
  setPage,
  setLimit,
  setSearch,
}: ReportsMyOutdoorTodayCollectionProps) {

  const token = getCookie('accessToken');
  const { currencySymbol } = useCurrency();

  // Fetch today's collection (all users)
  const { data, isLoading } = useQuery({
    queryKey: ["my-outdoor-today-collection", page, limit, search],

    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
      })
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/today-collection?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch today's collection");
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
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
              },
              stats: {
                total_collected: 0,
                payment_count: 0,
                total_bill: 0,
                total_discount: 0,
                invoice_count: 0
              }
            },
          },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const serverStats = data?.data?.stats || {};
    const paymentCount = serverStats.payment_count || 0;

    return [
      {
        label: "Payments",
        value: paymentCount,
        gradient: "from-blue-600 to-blue-400",
        shadow: "shadow-blue-500/30",
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Collected",
        value: `${currencySymbol} ${(serverStats.total_collected || 0).toLocaleString()}`,
        gradient: "from-emerald-600 to-emerald-400",
        shadow: "shadow-emerald-500/30",
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
      {
        label: "Total Discount",
        value: `${currencySymbol} ${(serverStats.total_discount || 0).toLocaleString()}`,
        gradient: "from-orange-600 to-orange-400",
        shadow: "shadow-orange-500/30",
        icon: <TrendingUp className="w-6 h-6 text-white" />,
      },
      {
        label: "Gross Bill",
        value: `${currencySymbol} ${(serverStats.total_bill || 0).toLocaleString()}`,
        gradient: "from-purple-600 to-purple-400",
        shadow: "shadow-purple-500/30",
        icon: <FileText className="w-6 h-6 text-white" />,
      },
    ];
  }, [data]);

  const columns = [
    {
      data: "id",
      title: "Invoice ID",
      orderable: true,
      responsivePriority: 1,
      render: (data: any) => {
        return `
          <div class="flex items-center gap-2">
            <span class="font-semibold text-purple-600">${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "invoice_prefix",
      title: "Custom ID",
      orderable: true,
      responsivePriority: 1,
      render: (data: any) => {
        if (!data) return '<span class="text-muted-foreground text-sm">-</span>';
        return `<span class="font-semibold text-purple-600 dark:text-purple-400">${data}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: "patient_name",
      title: "Patient Name",
      orderable: true,
      responsivePriority: 1,
      defaultContent: "",
    },
    {
      data: "phone",
      title: "Phone",
      orderable: true,
      responsivePriority: 2,
      defaultContent: "-",
    },
    {
      data: null,
      title: "Reference Doctor",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const doctorName = row.doctor?.doctor_name;
        return doctorName ? `<span class="font-semibold text-blue-600 dark:text-blue-400">Dr. ${doctorName}</span>` : "-";
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Department",
      orderable: true,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const deptName = row.department?.name;
        return deptName || "-";
      },
      defaultContent: "-",
    },
    {
      data: "total_amount",
      title: `Bill Amount (${currencySymbol})`,
      orderable: true,
      responsivePriority: 4,
      render: (data: any) => `<span class="font-medium text-gray-600">${Number(data || 0).toFixed(2)}</span>`,
      defaultContent: "0.00",
    },
    {
      data: null,
      title: `Discount (${currencySymbol})`,
      orderable: false,
      responsivePriority: 5,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const total = Number(row.total_amount || 0);
        const net = Number(row.net_amount || 0);
        const discount = total - net;
        return discount > 0
          ? `<span class="text-orange-600 font-medium">-${discount.toFixed(2)}</span>`
          : '<span class="text-gray-400">-</span>';
      },
      defaultContent: "-",
    },
    {
      data: "payment_amount",
      title: `Collected (${currencySymbol})`,
      orderable: true,
      responsivePriority: 2,
      render: (data: any) => `<span class="text-emerald-600 font-bold">${Number(data || 0).toFixed(2)}</span>`,
      defaultContent: "0.00",
    },
    {
      data: "payment_method",
      title: "Payment Method",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        const method = data || '-';
        const methodColors: Record<string, string> = {
          'Cash': 'bg-green-100 text-green-700',
          'Card': 'bg-blue-100 text-blue-700',
          'Mobile': 'bg-purple-100 text-purple-700',
          'Bank': 'bg-yellow-100 text-yellow-700',
        };
        const colorClass = methodColors[method] || 'bg-gray-100 text-gray-700';
        return `<span class="px-2 py-1 rounded text-xs font-semibold ${colorClass}">${method}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Collected By",
      orderable: false,
      responsivePriority: 3,
      render: (_data: any, _type: string, row: PaymentItem) => {
        const collectedBy = row.payment_created_by?.name || row.creator?.name || '-';
        return `<span class="text-sm font-medium text-gray-700">${collectedBy}</span>`;
      },
      defaultContent: "-",
    },
    {
      data: "payment_created_at",
      title: "Time",
      orderable: true,
      responsivePriority: 3,
      render: (data: any) => {
        if (!data) return "-";
        const date = new Date(data);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
      defaultContent: "-",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: PaymentItem) => {
        return `
          <div class="flex gap-2">
            <a href="/dashboard/outdoor/reception/invoices/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
              View Invoice
            </a>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  return (
    <>
      <AppHeader fixed />

      <main className=''>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today's Collection</h1>
            <p className="text-sm text-gray-500 mt-1">
              Outdoor payments collected today — all users
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <Link
            to="/dashboard/reports/my/outdoor/today-collection/print"
            search={{
              search: search || undefined
            }}
          >
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${item.gradient} p-4 md:p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
            >
              {/* Background Pattern */}
              <div className="absolute -right-4 md:-right-6 -top-4 md:-top-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-4 md:-bottom-6 -left-4 md:-left-6 h-16 w-16 md:h-24 md:w-24 rounded-full bg-black/10 blur-2xl" />

              <div className="relative flex items-center justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6rem] md:text-[0.65rem] lg:text-xs xl:text-sm font-medium text-white/90 leading-tight">{item.label}</p>
                  <h3 className="mt-1 md:mt-2 text-[0.9rem] md:text-[1.1rem] lg:text-lg xl:text-2xl font-bold text-white leading-tight break-words">
                    {item.value || 0}
                  </h3>
                </div>
                {/* Icon - hidden on mobile/tablet/laptop, visible only on large desktop (xl+) */}
                <div className="hidden xl:block rounded-xl bg-white/20 p-2.5 backdrop-blur-sm flex-shrink-0">
                  {item.icon}
                </div>
              </div>

              {/* Progress/Indicator line */}
              <div className="mt-3 md:mt-4 h-1 w-full rounded-full bg-black/10">
                <div className="h-full w-2/3 rounded-full bg-white/40" />
              </div>
            </div>
          ))}
        </div>

        {/* Collection Summary */}
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Collection Summary</CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">Today's payment breakdown</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payments</p>
                  <p className="text-xl font-bold text-gray-800">
                    {data?.data?.stats?.payment_count || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Collected</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {currencySymbol} {(data?.data?.stats?.total_collected || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Discount</p>
                  <p className="text-xl font-bold text-orange-600">
                    -{currencySymbol} {(data?.data?.stats?.total_discount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gross Bill</p>
                  <p className="text-xl font-bold text-purple-600">
                    {currencySymbol} {(data?.data?.stats?.total_bill || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading collection...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data?.data?.items || []}
            meta={data?.data?.meta}
            onPageChange={setPage}
            onLimitChange={setLimit}
            search={search}
            onSearchChange={setSearch}
            filterSlot={
              <Link
                to="/dashboard/reports/my/outdoor/today-collection/print"
                search={{
                  search: search || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            }
          />
        )}
      </main>
    </>
  )
}
