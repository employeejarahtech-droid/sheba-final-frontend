import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { TopNav } from '@/components/layout/top-nav'
import { topNav } from '@/data/data'
import { FileText, DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react'


type InvoiceItem = {
    id: number;
    patient_name: string;
    sex: string | null;
    age: number | null;
    phone: string | null;
    reference_doctor: string | null;
    doctor?: {
        doctor_name: string;
    } | null;
    invoice_date: string | null;
    delivery_date: string | null;
    delivery_time: string | null;
    total_amount: number | null;
    net_amount: number | null;
    total_paid: number;
    due_amount: number;
    created_at: string;
    created_by: number | null;
    status: string | null;
};

export default function Invoices() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["invoices", page, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch invoices");
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
                            total: 0,
                            page: 1,
                            limit: 10
                        },
                        stats: {
                            total_bill: 0,
                            total_discount: 0,
                            total_paid: 0,
                            total_due: 0
                        }
                    },
                },
    });

    // Calculate stats
    const stats = useMemo(() => {
        const serverStats = data?.data?.stats || {};
        const totalInvoices = data?.data?.meta?.total || 0;

        return [
            {
                label: "Total Invoices",
                value: totalInvoices,
                gradient: "from-blue-600 to-blue-400",
                shadow: "shadow-blue-500/30",
                icon: <FileText className="w-6 h-6 text-white" />,
            },
            {
                label: "Total Bill",
                value: `৳${(serverStats.total_bill || 0).toLocaleString()}`,
                gradient: "from-emerald-600 to-emerald-400",
                shadow: "shadow-emerald-500/30",
                icon: <DollarSign className="w-6 h-6 text-white" />,
            },
            {
                label: "Total Discount",
                value: `৳${(serverStats.total_discount || 0).toLocaleString()}`,
                gradient: "from-purple-600 to-purple-400",
                shadow: "shadow-purple-500/30",
                icon: <TrendingUp className="w-6 h-6 text-white" />,
            },
            {
                label: "Total Paid",
                value: `৳${(serverStats.total_paid || 0).toLocaleString()}`,
                gradient: "from-amber-600 to-amber-400",
                shadow: "shadow-amber-500/30",
                icon: <Calendar className="w-6 h-6 text-white" />,
            },
            {
                label: "Total Due",
                value: `৳${(serverStats.total_due || 0).toLocaleString()}`,
                gradient: "from-red-600 to-red-400",
                shadow: "shadow-red-500/30",
                icon: <Calendar className="w-6 h-6 text-white" />,
            },
        ];
    }, [data]);


    //console.log(data?.data);

    const columns = [
        {
            data: "id",
            title: "Invoice ID",
            orderable: true,
            responsivePriority: 1, // Always visible (highest priority)
            defaultContent: "",
        },
        {
            data: "patient_name",
            title: "Patient Name",
            orderable: true,
            responsivePriority: 1, // Always visible
            defaultContent: "",
        },
        {
            data: "phone",
            title: "Phone",
            orderable: true,
            responsivePriority: 2, // Hide on small screens
            defaultContent: "-",
        },
        {
            data: null, // Use null for computed fields
            title: "Reference Doctor",
            orderable: true,
            responsivePriority: 3, // Hide earlier
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const doctorName = row.doctor?.doctor_name;
                const refDoctor = row.reference_doctor;
                return doctorName || refDoctor || "-";
            },
            defaultContent: "-",
        },
        {
            data: "total_amount",
            title: "Total Amount",
            orderable: true,
            responsivePriority: 4,
            render: (data: any) => String(data ?? "-"),
            defaultContent: "-",
        },
        {
            data: null, // Computed field
            title: "Discount",
            orderable: false,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const total = Number(row.total_amount || 0);
                const net = Number(row.net_amount || 0);
                const discount = total - net;
                return String(discount > 0 ? discount : "-");
            },
            defaultContent: "-",
        },
        {
            data: "total_paid",
            title: "Paid (৳)",
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => `<span class="text-emerald-600 font-medium">${data ?? 0}</span>`,
            defaultContent: "0",
        },
        {
            data: "due_amount",
            title: "Due (৳)",
            orderable: true,
            responsivePriority: 2, // Always show due amount
            render: (data: any) => `<span class="text-red-600 font-bold">${data ?? 0}</span>`,
            defaultContent: "0",
        },
        {
            data: "created_at",
            title: "Date",
            orderable: true,
            responsivePriority: 3,
            render: (data: any) => {
                if (!data) return "-";
                const date = new Date(data);
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
            },
            defaultContent: "-",
        },
        {
            data: null, // Computed field
            title: "Status",
            orderable: true,
            responsivePriority: 1, // Always visible
            render: (_data: any, _type: string, row: InvoiceItem) => {
                const dueAmount = Number(row.due_amount || 0);
                const isPaid = dueAmount === 0;
                const status = isPaid ? "paid" : "unpaid";
                const bgColor = isPaid ? "bg-emerald-500" : "bg-red-500";
                return `<span class="${bgColor} text-white px-2 py-1 rounded text-xs font-semibold">${status.toUpperCase()}</span>`;
            },
            defaultContent: "",
        },
        {
            data: null, // Computed field
            title: "Actions",
            orderable: false,
            responsivePriority: 1, // Always visible
            render: (_data: any, _type: string, row: InvoiceItem) => {
                return `
                    <div class="flex gap-2">
                        <a href="/outdoor/reception/invoices/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <a href="/outdoor/reception/due-collection/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-4 py-2">
                            Pay Now
                        </a>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ];
    return <>
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
                <h1 className="text-2xl font-bold tracking-tight">List of Invoices</h1>
                <Link to="/outdoor/reception/invoices/create">
                    <Button variant="default">
                        <Plus className="w-4 h-4" />
                        Create Invoice
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                {stats.map((item, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                    >
                        {/* Background Pattern */}
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/90">{item.label}</p>
                                <h3 className="mt-2 text-3xl font-bold text-white">
                                    {item.value || 0}
                                </h3>
                            </div>
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                {item.icon}
                            </div>
                        </div>

                        {/* Progress/Indicator line */}
                        <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                            <div className="h-full w-2/3 rounded-full bg-white/40" />
                        </div>
                    </div>
                ))}
            </div>

            <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
        </main>
    </>
}
