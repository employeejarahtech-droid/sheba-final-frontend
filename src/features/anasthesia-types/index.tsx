import { useState, useEffect } from 'react'
import { useCan } from '@/hooks/use-can'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'


import { DataTable } from '@/components/DataTable'
import { CreateAnasthesiaTypeForm } from './components/CreateAnasthesiaTypeForm'
import { EditAnasthesiaTypeForm } from './components/EditAnasthesiaTypeForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users } from 'lucide-react'

type AnasthesiaTypeItem = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    created_by?: string | number | null;
    created_by_name?: string;
};

interface AnasthesiaTypesProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export default function AnasthesiaTypes({ page, limit, search, setPage, setLimit, setSearch }: AnasthesiaTypesProps) {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);

    const can = useCan();
    const canCreate = can('indoor.master.anesthesia-types.create');
    const canEdit = can('indoor.master.anesthesia-types.edit');
    const canDelete = can('indoor.master.anesthesia-types.delete');
    const [selectedAnasthesiaTypeId, setSelectedAnasthesiaTypeId] = useState<number | null>(null);

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/anasthesia-type/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete');
            return json;
        },
        onSuccess: () => {
            toast.success('Deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['anasthesia-types'] });
            queryClient.invalidateQueries({ queryKey: ['anasthesia-types-overall-stats'] });
        },
        onError: (err: Error) => { toast.error(err.message); },
    });
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["anasthesia-types", page, limit, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/anasthesia-type?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch anasthesia types");
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
        queryKey: ["anasthesia-types-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/anasthesia-type/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { totalAnasthesiaTypes: 0, totalAnasthesia: 0 };
            const result = await res.json();
            return result.data || { totalAnasthesiaTypes: 0, totalAnasthesia: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalAnasthesiaTypes: 0, totalAnasthesia: 0 };

    const statCards = [
        {
            title: 'Total Anasthesia Types',
            value: stats.totalAnasthesiaTypes || 0,
            icon: Activity,
            grad: 'from-blue-500 to-indigo-500',
        },
        {
            title: 'Total Procedures',
            value: stats.totalAnasthesia || 0,
            icon: Users,
            grad: 'from-purple-500 to-indigo-500',
        },
    ];

    const columns = [
        {
            data: "id",
            title: "ID",
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: AnasthesiaTypeItem) => {
                const createdDate = row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-description="${(row.description || '-').replace(/"/g, '&quot;')}"
                                data-created-date="${createdDate.replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data.toString().startsWith('AT-') ? data : 'AT-' + data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Type Name",
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
            render: (_data: any, _type: string, row: AnasthesiaTypeItem) => {
                const name = row.created_by_name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
        },
        {
            data: null,
            title: "Actions",
            render: (_data: any, _type: string, row: AnasthesiaTypeItem) => {
                return `
                    <div class="flex flex-wrap items-center gap-2">
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
            const description = btn.dataset.description || '-';
            const createdDate = btn.dataset.createdDate || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Anesthesia Type Information</h2>
                        <p class="text-red-100 text-sm">Detailed overview of selected anesthesia type</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Anesthesia Type ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Type Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Description</span>
                                <span class="font-medium text-gray-700 text-sm">${description || 'No description provided'}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Created Date</span>
                                <span class="font-medium text-gray-700">${createdDate}</span>
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
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition h-10 px-5 shadow">
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
                navigate({ to: `/dashboard/indoor/master/anasthesia-types/${id}` });
            } else if (action === 'edit' && id) {
                setSelectedAnasthesiaTypeId(Number(id));
                setOpenEditForm(true);
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
                    title="List of Anasthesia Types"
                    actions={canCreate ? <CreateAnasthesiaTypeForm /> : null}
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
            <EditAnasthesiaTypeForm open={openEditForm} setOpen={setOpenEditForm} anasthesiaTypeId={selectedAnasthesiaTypeId} />
        </main>
    </>
}
