import { useEffect, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
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
    created_by_name?: string;
};

export default function Services() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);

    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["services", page, limit, search],
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
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: ServiceItem) => {
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-category="${(row.category || '-').replace(/"/g, '&quot;')}"
                                data-description="${(row.description || '-').replace(/"/g, '&quot;')}"
                                data-price="${Number(row.price || 0).toFixed(2)}"
                                data-status="${(row.status || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span>${data}</span>
                    </div>
                `;
            },
            defaultContent: "",
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
            render: (_data: any, _type: string, row: ServiceItem) => {
                const name = row.created_by_name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
        },
        {
            data: null,
            title: "Actions",
            render: (_data: any, _type: string, row: ServiceItem) => {
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

    // Handle expand button clicks using event delegation
    useEffect(() => {
        const handleExpandClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.expand-btn');
            if (!button) return;

            const btn = button as HTMLButtonElement;
            const row = btn.closest('tr');
            if (!row) return;

            const isExpanded = row.classList.contains('expanded');
            const nextRow = row.nextElementSibling;

            // Toggle collapse
            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove();
                row.classList.remove('expanded');
                btn.textContent = '+';
                btn.style.backgroundColor = 'black';
                return;
            }

            // Don't expand if already expanded
            if (isExpanded) return;

            // Get data from attributes
            const id = btn.dataset.id || '';
            const name = btn.dataset.name || '-';
            const category = btn.dataset.category || '-';
            const description = btn.dataset.description || '-';
            const price = btn.dataset.price || '0';
            const status = btn.dataset.status || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Status badge color
            const statusBadgeClass = status === 'Active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Service Information</h2>
                        <p class="text-indigo-100 text-sm">Detailed overview of selected service</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Service ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Service Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Category</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                    ${category || 'N/A'}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Price</span>
                                <span class="font-bold text-lg text-indigo-600">৳${price}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Description</span>
                                <span class="font-medium text-gray-700 text-sm">${description || 'No description provided'}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Status</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full ${statusBadgeClass}">
                                    ${status}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Created By</span>
                                <span class="font-medium text-gray-700">${createdBy}</span>
                            </li>

                        </ul>

                        <!-- Actions -->
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <button data-action="view" data-id="${id}"
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                View
                            </button>

                            <button data-action="edit" data-id="${id}"
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition h-10 px-5 shadow">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 10;
            cell.appendChild(cardContainer);
            newRow.appendChild(cell);

            row.parentNode?.insertBefore(newRow, row.nextSibling);
            row.classList.add('expanded');
            btn.textContent = '−';
            btn.style.backgroundColor = '#dc2626';
        };

        // Add event listener to document for delegation
        document.addEventListener('click', handleExpandClick);

        return () => {
            document.removeEventListener('click', handleExpandClick);
        };
    }, []);

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
        <AppHeader fixed />

        <main className="p-4">
            <div className="space-y-4">
                {/* Statistics Cards */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
                    {statCards.map((card, idx) => (
                        <Card key={idx} className={`p-3 relative overflow-hidden border-none text-white shadow-xl ${card.shadow} bg-gradient-to-br ${card.gradient}`}>
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <CardContent className='p-3'>
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
                <PageHeader
                    title="List of Services"
                    actions={
                        <Button
                            onClick={() => navigate({ to: '/indoor/master/services/create' })}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Button>
                    }
                />
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setPage(1);
                    }}
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>
        </main>
    </>
}
