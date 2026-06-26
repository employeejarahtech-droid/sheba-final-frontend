import { useState, useEffect } from 'react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'

import { DataTable } from '@/components/DataTable'
import { CreateBedWardForm } from './components/CreateBedWardForm'
import { EditBedWardForm } from './components/EditBedWardForm'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BedDouble, Layers } from 'lucide-react'

type BedWardItem = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    created_by?: string | number | null;
    created_by_name?: string;
};

interface BedWardsProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export default function BedWards({ page, limit, search, setPage, setLimit, setSearch }: BedWardsProps) {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedBedWardId, setSelectedBedWardId] = useState<number | null>(null);

    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["bed-wards", page, limit, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-ward?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch bed wards");
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
        queryKey: ["bed-wards-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-ward/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { totalWards: 0, totalBeds: 0 };
            const result = await res.json();
            return result.data || { totalWards: 0, totalBeds: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalWards: 0, totalBeds: 0 };

    const statCards = [
        {
            title: 'Total Wards / Departments',
            value: stats.totalWards || 0,
            icon: Layers,
            grad: 'from-blue-500 to-indigo-500',
        },
        {
            title: 'Total Bed/Cabin Capacity',
            value: stats.totalBeds || 0,
            icon: BedDouble,
            grad: 'from-purple-500 to-indigo-500',
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
            const description = btn.dataset.description || '-';
            const createdAt = btn.dataset.createdAt || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Ward / Department Information</h2>
                        <p class="text-blue-100 text-sm">Detailed overview of selected ward or department</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Ward ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Ward Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Description</span>
                                <span class="font-medium text-gray-700 text-sm">${description || 'No description provided'}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Created Date</span>
                                <span class="font-medium text-gray-700">${createdAt}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Created By</span>
                                <span class="font-medium text-gray-700">${createdBy}</span>
                            </li>

                        </ul>

                        <!-- Actions -->
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

        // Add event listener to document for delegation
        document.addEventListener('click', handleExpandClick);

        return () => {
            document.removeEventListener('click', handleExpandClick);
        };
    }, []);

    const columns = [
        {
            data: "id",
            title: "ID",
            render: (data: any, _type: string, row: BedWardItem) => {
                const createdAt = row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-description="${(row.description || '-').replace(/"/g, '&quot;')}"
                                data-created-at="${createdAt}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data.toString().startsWith('WD-') ? data : 'WD-' + data}</span>
                    </div>
                `;
            },
        },
        {
            data: "name",
            title: "Ward Name",
        },
        {
            data: "description",
            title: "Description",
            render: (data: any) => data || '-',
        },
        {
            data: "created_at",
            title: "Created Date",
            render: (data: any) => {
                if (!data) return '-';
                const parsedDate = new Date(data);
                return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString();
            },
        },
        {
            data: "created_by",
            title: "Created By",
            render: (_data: any, _type: string, row: BedWardItem) => {
                const name = row.created_by_name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
        },
        {
            data: null,
            title: "Actions",
            render: (_data: any, _type: string, row: BedWardItem) => {
                return `
                    <div class="flex flex-wrap items-center gap-2">
                        <button data-action="edit" data-id="${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
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

            if (action === 'edit' && id) {
                setSelectedBedWardId(Number(id));
                setOpenEditForm(true);
            }
        };

        // Add event listener to the document
        document.addEventListener('click', handleTableClick);

        return () => {
            document.removeEventListener('click', handleTableClick);
        };
    }, [setSelectedBedWardId, setOpenEditForm]);

    return <>
        <AppHeader fixed />

        <main className="p-4">
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
                    title="List of Wards & Departments"
                    actions={<CreateBedWardForm />}
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
            <EditBedWardForm open={openEditForm} setOpen={setOpenEditForm} bedWardId={selectedBedWardId} />
        </main>
    </>
}
