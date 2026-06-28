import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header';
import { DataTable } from '@/components/DataTable';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCookie } from '@/lib/cookies';
import { PageHeader } from '@/components/layout/page-header';
import { useCurrency } from '@/hooks/use-currency';

const bedCabinSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/indoor/master/bed-cabin-list/')({
    validateSearch: (search) => bedCabinSearchSchema.parse(search),
    component: BedCabinList,
})

type BedCabinItem = {
    id: string;
    code: string;
    type: "Cabin" | "Bed" | "Special";
    ward: string;
    status: "Available" | "Occupied" | "Maintenance";
    price: number;
    created_by?: string | number | null;
    created_by_name?: string;
};

function BedCabinList() {
    const navigate = useNavigate();
    const searchParams: any = Route.useSearch();
    const routeNavigate = Route.useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete bed/cabin');
            return json;
        },
        onSuccess: () => {
            toast.success('Bed/Cabin deleted');
            queryClient.invalidateQueries({ queryKey: ['bed-cabin-list'] });
        },
        onError: (err: Error) => { toast.error(err.message); },
    });
    const { currencySymbol } = useCurrency();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const setPage = (newPage: number) => {
        routeNavigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        routeNavigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        routeNavigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['bed-cabin-list', page, limit, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-cabin?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch bed/cabin list: ${res.status} - ${errorText}`);
            }
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

    const columns = [
        {
            data: 'id',
            title: 'ID',
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: BedCabinItem) => {
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${data}"
                                data-code="${(row.code || "-").replace(/"/g, "&quot;")}"
                                data-type="${(row.type || "-").replace(/"/g, "&quot;")}"
                                data-ward="${(row.ward || "-").replace(/"/g, "&quot;")}"
                                data-status="${(row.status || "-").replace(/"/g, "&quot;")}"
                                data-price="${Number(row.price || 0).toLocaleString()}"
                                data-created-by="${String(row.created_by_name || row.created_by || "-").replace(/"/g, "&quot;")}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data.toString().startsWith('BC-') ? data : 'BC-' + data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: 'code',
            title: 'Bed/Cabin Code',
            render: (data: string) => `<span class="font-bold text-blue-600">${data}</span>`,
        },
        {
            data: 'type',
            title: 'Type',
            render: (data: string) => {
                const colors: Record<string, string> = {
                    'Bed': 'bg-blue-100 text-blue-700 border-blue-200',
                    'Cabin': 'bg-purple-100 text-purple-700 border-purple-200',
                    'Special': 'bg-amber-100 text-amber-700 border-amber-200',
                };
                const colorClass = colors[data] || 'bg-gray-100 text-gray-700 border-gray-200';
                return `<span class="px-2 py-1 rounded-md text-xs font-medium border ${colorClass}">${data}</span>`;
            },
        },
        {
            data: 'ward',
            title: 'Ward/Department',
        },
        {
            data: 'status',
            title: 'Status',
            render: (data: string) => {
                const colors: Record<string, string> = {
                    'Available': 'bg-emerald-500',
                    'Occupied': 'bg-blue-500',
                    'Maintenance': 'bg-amber-500',
                };
                const colorClass = colors[data] || 'bg-gray-500';
                return `<span class="px-2 py-1 rounded-md text-xs font-medium text-white ${colorClass}">${data}</span>`;
            },
        },
        {
            data: 'price',
            title: `Price/Day (${currencySymbol})`,
            render: (data: string) => {
                const price = parseFloat(data);
                return `<span class="font-semibold text-gray-700">${price.toLocaleString()}</span>`;
            },
        },
        {
            data: 'created_by',
            title: 'Created By',
            render: (_data: any, _type: string, row: BedCabinItem) => {
                const name = row.created_by_name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
        },
        {
            data: null,
            title: 'Actions',
            render: (_data: any, _type: string, row: BedCabinItem) => {
                return `
                    <div class="flex flex-nowrap items-center gap-2">
                        <button data-action="edit" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                        </button>
                        <button data-action="delete" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
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
                btn.style.backgroundColor = '#10B981';
                return;
            }

            // Don't expand if already expanded
            if (isExpanded) return;

            // Get data from attributes
            const id = btn.dataset.id || '';
            const code = btn.dataset.code || '-';
            const type = btn.dataset.type || '-';
            const ward = btn.dataset.ward || '-';
            const status = btn.dataset.status || '-';
            const price = btn.dataset.price || '0';
            const createdBy = btn.dataset.createdBy || '-';

            // Status badge color
            const statusBadgeClass = status === 'Available'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'Occupied'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700';

            // Type badge color
            const typeBadgeClass = type === 'Bed'
                ? 'bg-blue-100 text-blue-700'
                : type === 'Cabin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-amber-100 text-amber-700';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Bed/Cabin Information</h2>
                        <p class="text-blue-100 text-sm">Detailed overview of selected room/bed</p>
                    </div>

                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">
                            <li class="flex flex-col">
                                <span class="text-gray-500">Bed/Cabin ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Code</span>
                                <span class="font-bold text-blue-600 text-base">${code}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Type</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full ${typeBadgeClass}">${type}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Ward/Department</span>
                                <span class="font-medium text-gray-700">${ward}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Status</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full ${statusBadgeClass}">${status}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Price/Day</span>
                                <span class="font-bold text-lg text-blue-600">${currencySymbol} ${price}</span>
                            </li>
                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Created By</span>
                                <span class="font-medium text-gray-700">${createdBy}</span>
                            </li>
                        </ul>

                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <button data-action="edit" data-id="${id}"
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition h-10 px-5 shadow">
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

            if (action === 'edit' && id) {
                navigate({ to: `/dashboard/indoor/master/bed-cabin-list/${id}` });
            } else if (action === 'delete' && id) {
                if (confirm('Delete this bed/cabin? This action cannot be undone.')) {
                    deleteMutation.mutate(id);
                }
            }
        };

        document.addEventListener('click', handleTableClick);
        return () => {
            document.removeEventListener('click', handleTableClick);
        };
    }, [navigate]);

    return (
        <>
            <AppHeader fixed />
            <main className="p-4">
                <div className="space-y-4">
                    <PageHeader
                        title="Bed & Cabin Management"
                        actions={
                            <Button
                                onClick={() => navigate({ to: '/dashboard/indoor/master/bed-cabin-list/create' })}
                            >
                                <PlusCircle className="h-4 w-4" />
                                Add New Room/Bed
                            </Button>
                        }
                    />
                    {isLoading ? (
                        <div className="p-20 text-center text-muted-foreground animate-pulse">
                            Loading Bed & Cabin data...
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center">
                            <div className="text-red-500 font-semibold mb-2">Error loading data</div>
                            <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
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
                        />
                    )}
                </div>
            </main>
        </>
    );
}
