import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/DataTable'
import { CreateDepartmentForm } from './components/CreateDepartmentForm'
import { EditDepartmentForm } from './components/EditDepartmentForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Layers, Database, TrendingUp } from 'lucide-react'


type DepartmentItem = {
    id: string;
    name: string;
    created_by?: string;
    creator?: { id: number; name: string };
};

type DepartmentsProps = {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
};

export default function Departments({ page, limit, search, setPage, setLimit, setSearch }: DepartmentsProps) {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);


    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    // Delete department (blocked by the API with a 409 if it is referenced)
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/department/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete department');
            return json;
        },
        onSuccess: () => {
            toast.success('Department deleted');
            queryClient.invalidateQueries({ queryKey: ['deparmtent'] });
            queryClient.invalidateQueries({ queryKey: ['departments-overall-stats'] });
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const { data, isFetching } = useQuery({
        queryKey: ["deparmtent", page, limit, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch departments");
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

    // Fetch overall statistics
    const { data: statsData } = useQuery({
        queryKey: ["departments-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) return { totalDepartments: 0, totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };
            const result = await res.json();
            return result.data || { totalDepartments: 0, totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalDepartments: 0, totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };

    const statCards = [
        { label: 'Total Departments', value: stats.totalDepartments || 0, icon: Building2,  headerBg: '#10B981', iconColor: '#10B981' },
        { label: 'Total Categories',  value: stats.totalCategories  || 0, icon: Layers,     headerBg: '#F97316', iconColor: '#F97316' },
        { label: 'Total Tests',       value: stats.totalTests       || 0, icon: Database,   headerBg: '#EC4899', iconColor: '#EC4899' },
        { label: 'Total Reports',     value: stats.totalReports     || 0, icon: TrendingUp, headerBg: '#14B8A6', iconColor: '#14B8A6' },
    ];

    // Delete mutation




    console.log(data?.data);

    // Expose edit function to window for onclick handlers
    useEffect(() => {
        (window as any).editDepartment = (id: string) => {
            setSelectedDepartmentId(id);
            setOpenEditForm(true);
        };
    }, [setSelectedDepartmentId, setOpenEditForm]);

    // Expose delete function to window for onclick handlers
    useEffect(() => {
        (window as any).deleteDepartment = (id: string) => {
            if (confirm('Delete this department? This cannot be undone.')) {
                deleteMutation.mutate(id);
            }
        };
    }, [deleteMutation]);

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
                btn.style.backgroundColor = '#3B82F6';
                return;
            }

            // Don't expand if already expanded
            if (isExpanded) return;

            // Get data from attributes
            const id = btn.dataset.id || '';
            const name = btn.dataset.name || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Department Information</h2>
                        <p class="text-violet-100 text-sm">Detailed overview of selected department</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Department ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Department Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Created By</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                    ${createdBy}
                                </span>
                            </li>

                        </ul>

                        <!-- Actions -->
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <a href="/dashboard/outdoor/master/departments/${id}"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                View
                            </a>

                            <button onclick="window.editDepartment('${id.replace(/'/g, "\\'")}')"
                                    class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition h-10 px-5 shadow">
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
            title: "Department ID",
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: DepartmentItem) => {
                const displayId = data.toString().startsWith('DP-') ? data : `DP-${data}`;
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#3B82F6;"
                                type="button"
                                data-id="${displayId}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${(row.creator?.name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${displayId}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Department Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "created_by",
            title: "Created By",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: DepartmentItem) => {
                const name = row.creator?.name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: DepartmentItem) => {
                return `
                    <div class="flex flex-wrap items-center gap-2">
                        <a href="/dashboard/outdoor/master/departments/${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                        </a>
                        <button onclick="window.editDepartment('${row.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                        </button>
                        <button onclick="window.deleteDepartment('${row.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
                        </button>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ];

    return <>
        <AppHeader fixed />

  <main className=''>
            <div className="space-y-4">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: card.headerBg }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white rounded-lg shadow-lg">
                                            <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="text-2xl font-bold">{card.value || 0}</h3>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Header & Table */}
                <PageHeader
                    title="List of Departments"
                    actions={<CreateDepartmentForm />}
                />
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    search={search}
                    onSearchChange={setSearch}
                    isLoading={isFetching}
                />
            </div>
            <EditDepartmentForm open={openEditForm} setOpen={setOpenEditForm} departmentId={selectedDepartmentId} />
        </main>
    </>
}