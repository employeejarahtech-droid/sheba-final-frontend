import { useEffect, useState } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { FolderOpen, Activity, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ServiceItem = {
    id: number;
    name: string;
    category: string | null;
    description: string | null;
    price: number;
    status: string;
    created_at: string;
    created_by?: string | number | null;
};

export default function Services() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["services", page, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch services");
            return res.json();
        },
        enabled: !!token,
        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        meta: { page, limit, total: 0 },
                    },
                },
    });

    // Fetch overall statistics
    const { data: statsData } = useQuery({
        queryKey: ["services-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { totalServices: 0, activeServices: 0 };
            const result = await res.json();
            return result.data || { totalServices: 0, activeServices: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalServices: 0, activeServices: 0 };

    const statCards = [
        {
            title: 'Total Services',
            value: stats.totalServices || 0,
            icon: <FolderOpen className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'All Services'
        },
        {
            title: 'Active Services',
            value: stats.activeServices || 0,
            icon: <Activity className='h-6 w-6' />,
            gradient: 'from-green-600 to-emerald-600',
            shadow: 'shadow-green-500/20',
            label: 'Currently Available'
        },
    ];

    const columns = [
        {
            data: "id",
            title: "ID",
        },
        {
            data: "category",
            title: "Category",
            render: (data: any) => data || '-',
        },
        {
            data: "name",
            title: "Service Name",
        },
        {
            data: "description",
            title: "Description",
            render: (data: any) => data || '-',
        },
        {
            data: "price",
            title: "Price",
            render: (data: any) => `৳${parseFloat(data).toFixed(2)}`,
        },
        {
            data: "status",
            title: "Status",
            render: (data: any) => {
                const status = data;
                const badgeClass = status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800';
                return `<span class="px-2 py-1 rounded-full text-xs font-medium ${badgeClass}">${status}</span>`;
            },
        },
        {
            data: "created_by",
            title: "Created By",
            render: (data: any) => {
                const value = data || '-';
                return `<span class="text-sm text-muted-foreground">${value}</span>`;
            },
        },
        {
            data: null,
            title: "Actions",
            render: (data: any, type: string, row: ServiceItem) => {
                return `
                    <div class="flex gap-2">
                        <button data-action="view" data-id="${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                            View
                        </button>
                        <button data-action="edit" data-id="${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
                            Edit
                        </button>
                    </div>
                `;
            },
        },
    ];

    // Handle button clicks via event delegation
    useEffect(() => {
        const handleTableClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const button = target.closest('button[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const id = button.getAttribute('data-id');

            if (action === 'view' && id) {
                navigate({ to: `/indoor/master/services/${id}` });
            } else if (action === 'edit' && id) {
                navigate({ to: `/indoor/master/services/edit/${id}` });
            }
        };

        // Add event listener to the document
        document.addEventListener('click', handleTableClick);

        return () => {
            document.removeEventListener('click', handleTableClick);
        };
    }, [navigate]);

    return <>
        <Header fixed>
            <Search />
            <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
                <ConfigDrawer />
                <ProfileDropdown />
            </div>
        </Header>

        <Main className="p-6 lg:p-10">
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
                    {statCards.map((card, idx) => (
                        <Card key={idx} className={`relative overflow-hidden border-none text-white shadow-xl ${card.shadow} bg-gradient-to-br ${card.gradient}`}>
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <CardContent className='p-6'>
                                <div className='flex items-center justify-between relative z-10'>
                                    <div className='space-y-1'>
                                        <p className='text-sm font-medium text-white/80'>{card.title}</p>
                                        <h3 className='text-3xl font-bold tracking-tighter'>
                                            {card.value}
                                        </h3>
                                        <p className='text-[10px] font-bold uppercase tracking-wider text-white/60'>{card.label}</p>
                                    </div>
                                    <div className='rounded-2xl bg-white/20 p-4 backdrop-blur-md border border-white/20 shadow-inner'>
                                        {card.icon}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Header & Table */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">List of Services</h1>
                    <Button
                        onClick={() => navigate({ to: '/indoor/master/services/create' })}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={setPage}
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>
        </Main>
    </>
}
