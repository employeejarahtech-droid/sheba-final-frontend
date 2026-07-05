import { useEffect } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/DataTable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Activity, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { useCan } from '@/hooks/use-can'

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

interface ServicesProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export default function Services({ page, limit, search, setPage, setLimit, setSearch }: ServicesProps) {
    const can = useCan();
    const canCreate = can('indoor.master.services.create');
    const canEdit = can('indoor.master.services.edit');
    const canDelete = can('indoor.master.services.delete');

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/service/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete');
            return json;
        },
        onSuccess: () => {
            toast.success('Deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['services-overall-stats'] });
        },
        onError: (err: Error) => { toast.error(err.message); },
    });
    const navigate = useNavigate();
    const { currencySymbol } = useCurrency();

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
        // Global default is refetchOnMount: false; override so the list refetches
        // when remounting with stale data (e.g. after creating/editing a service,
        // which invalidates this query before navigating back).
        refetchOnMount: true,
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
        refetchOnMount: true,
    });

    const stats = statsData || { totalServices: 0, activeServices: 0 };

    const statCards = [
        {
            title: 'Total Services',
            value: stats.totalServices || 0,
            icon: FolderOpen,
            grad: 'from-blue-500 to-indigo-500',
        },
        {
            title: 'Active Services',
            value: stats.activeServices || 0,
            icon: Activity,
            grad: 'from-emerald-500 to-teal-500',
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
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-category="${(row.category || '-').replace(/"/g, '&quot;')}"
                                data-description="${(row.description || '-').replace(/"/g, '&quot;')}"
                                data-price="${Number(row.price || 0).toFixed(2)}"
                                data-status="${(row.status || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data.toString().startsWith('SE-') ? data : 'SE-' + data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Service Name",
        },
        {
            data: "category",
            title: "Category",
            render: (data: any) => data || '-',
        },
        {
            data: "description",
            title: "Description",
            render: (data: any) => data || '-',
        },
        {
            data: "price",
            title: `Price (${currencySymbol})`,
            render: (data: any) => parseFloat(data).toFixed(2),
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
                    <div class="flex flex-nowrap items-center gap-2">
                        <button data-action="view" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                        </button>
                        ${canEdit ? `<button data-action="edit" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                        </button>` : ''}
                        ${canDelete ? `<button data-action="delete" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
                        </button>` : ''}
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
                btn.style.backgroundColor = '#10B981';
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
                                 <span class="font-bold text-lg text-indigo-600">${currencySymbol} ${price}</span>
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

                            ${canEdit ? `<button data-action="edit" data-id="${id}"
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition h-10 px-5 shadow">
                                Edit
                            </button>` : ''}
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
                navigate({ to: `/dashboard/indoor/master/services/${id}` });
            } else if (action === 'edit' && id) {
                navigate({ to: `/dashboard/indoor/master/services/edit/${id}` });
            } else if (action === 'delete' && id) {
                if (confirm('Delete this item? This action cannot be undone.')) {
                    deleteMutation.mutate(Number(id));
                }
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

        <main className="">
            <div className="space-y-4">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.title} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white rounded-lg shadow-lg">
                                            <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-white/90">{card.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="text-2xl font-bold">{card.value}</h3>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Header & Table */}
                <PageHeader
                    title="List of Services"
                    actions={canCreate ? ( <Button
                            onClick={() => navigate({ to: '/dashboard/indoor/master/services/create' })}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Button> ) : null}
                />
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>
        </main>
    </>
}
