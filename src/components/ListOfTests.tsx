
import { AppHeader } from '@/components/layout/app-header'



import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from '@/components/DataTable'
import { useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link, useNavigate } from '@tanstack/react-router'
import { FlaskConical, CheckCircle, FolderTree, DollarSign } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type TestItem = {
    id: number
    name: string
    category_id: number
    match_table_name: number
    price: number
    sample_collection_room_id?: number;
    sample_normal_range?: string;
    sampleCollectionRoom?: {
        id: number;
        name: string;
        location: string;
    };
    category: {
        id: number;
        name: string;
        department_id: number;
        department: {
            id: number;
            name: string;
        } | null;
    };
    creator?: {
        id: number;
        name: string;
    };
};

interface ListOfTestsProps {
    page: number;
    limit: number;
    search: string;
    categoryId?: number;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
    setCategoryId: (categoryId: number | undefined) => void;
}

export default function ListOfTests({ page, limit, search, categoryId, setPage, setLimit, setSearch, setCategoryId }: ListOfTestsProps) {
    const { currencySymbol } = useCurrency();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tests/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete test');
            return json;
        },
        onSuccess: () => {
            toast.success('Test deleted');
            queryClient.invalidateQueries({ queryKey: ['tests'] });
        },
        onError: (err: Error) => { toast.error(err.message); },
    });

    // Expose delete function to window for onclick handlers
    useEffect(() => {
        (window as any).deleteTest = (id: string) => {
            if (confirm('Delete this test? This action cannot be undone.')) {
                deleteMutation.mutate(id);
            }
        };
    }, [deleteMutation]);

    // Client-side navigation for the DataTable action buttons. They are rendered
    // as raw <a href> HTML strings, and plain anchors are NOT intercepted by
    // TanStack Router — so they trigger full document navigations. That destroys
    // the SPA/React-Query state (the list cache is gone on the edit page) and
    // makes window.history.back() restore the list from bfcache with STALE rows.
    // Expose helpers (matching window.deleteTest) so View/Edit route client-side.
    useEffect(() => {
        (window as any).viewTest = (testId: string | number) => {
            navigate({ to: '/dashboard/outdoor/master/tests/$id', params: { id: String(testId) } });
        };
        (window as any).editTest = (testId: string | number) => {
            navigate({ to: '/dashboard/outdoor/master/tests/edit/$id', params: { id: String(testId) } });
        };
    }, [navigate]);

    // Safety net: if the list is ever restored from the browser back/forward
    // cache (bfcache) — e.g. a full-document back navigation — the frozen page
    // shows stale rows and no React lifecycle runs. Refetch on restore.
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                queryClient.invalidateQueries({ queryKey: ['tests'] });
            }
        };
        window.addEventListener('pageshow', onPageShow);
        return () => window.removeEventListener('pageshow', onPageShow);
    }, [queryClient]);

    // Fetch test tables FIRST (needed to resolve match_table_name → display_name)
    const { data: testTablesData } = useQuery({
        queryKey: ["test-tables-list"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables?limit=1000`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch test tables");
            return res.json();
        },
        enabled: !!token,
    });
    const testTables = testTablesData?.data?.items || [];

    // Fetch tests — gated on testTables loaded so display names resolve on first render
    const { data, isFetching } = useQuery({
        queryKey: ["tests", page, limit, search, categoryId],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                search: search,
            });
            if (categoryId) params.set('category_id', String(categoryId));

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tests?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch tests");
            return res.json();
        },
        enabled: !!token && testTables.length > 0,
        // Global default is refetchOnMount: false, so returning to the list
        // (e.g. via window.history.back() from the edit page) would otherwise
        // keep showing cached rows. 'always' guarantees a refetch every time
        // the list mounts, so back-navigation always shows fresh data — with
        // or without a prior save/invalidation.
        refetchOnMount: 'always',
    });

    // Fetch categories for filter dropdown
    const { data: categoriesData } = useQuery({
        queryKey: ["test-category"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch categories");
            const result = await res.json();
            return result.data?.rows || result.data?.items || result.data || [];
        },
        enabled: !!token,
    });

    // Calculate stats
    const stats = useMemo(() => {
        const tests = data?.data?.items || [];
        const totalTests = data?.data?.meta?.total || 0;

        // Get unique categories
        const uniqueCategories = new Set(tests.map((t: TestItem) => t.category?.name).filter(Boolean));
        const totalCategories = uniqueCategories.size;

        // Calculate total revenue (sum of all test prices)
        const totalRevenue = tests.reduce((sum: number, t: TestItem) => sum + Number(t.price || 0), 0);

        return [
            { label: "Total Tests", value: totalTests, icon: FlaskConical, headerBg: "#3B82F6", iconColor: "#3B82F6" },
            { label: "Categories", value: totalCategories, icon: FolderTree, headerBg: "#10B981", iconColor: "#10B981" },
        ];
    }, [data]);

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
            const name = btn.dataset.name || '-';
            const tableName = btn.dataset.tableName || '-';
            const category = btn.dataset.category || '-';
            const department = btn.dataset.department || '-';
            const room = btn.dataset.room || '-';
            const creator = btn.dataset.creator || '-';
            const price = btn.dataset.price || '0';
            const id = btn.dataset.id || '';
            const currency = btn.dataset.currency || '$';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Test Information</h2>
                        <p class="text-blue-100 text-sm">Detailed overview of selected test</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Test Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Report Template</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">${tableName}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Category</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                    ${category}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Department</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                    ${department}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Sample Collection Room</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-teal-100 text-teal-700">
                                    ${room}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Price</span>
                                <span class="font-bold text-lg text-blue-600">${currency}${price}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Created By</span>
                                <span class="font-medium text-gray-700">${creator}</span>
                            </li>

                        </ul>

                        <!-- Actions -->
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <a href="/dashboard/outdoor/master/tests/${id}" onclick="window.viewTest('${id}'); return false;"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                View
                            </a>

                            <a href="/dashboard/outdoor/master/tests/edit/${id}" onclick="window.editTest('${id}'); return false;"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition h-10 px-5 shadow">
                                Edit
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 9;
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
    }, [currencySymbol]);

    //console.log(data);

    const columns = useMemo(() => [
        {
            data: "id",
            title: "ID",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: TestItem, meta: any) => {
                const rawTableName = row.match_table_name ? String(row.match_table_name) : '';
                const matchedTable = testTables.find(
                    (t: any) => t.table_name === rawTableName || t.display_name === rawTableName
                );
                const tableName = matchedTable ? matchedTable.display_name : (rawTableName || 'N/A');
                const category = row.category?.name || 'N/A';
                const department = row.category?.department?.name || '-';
                const room = row.sampleCollectionRoom
                    ? `${row.sampleCollectionRoom.name}${row.sampleCollectionRoom.location ? ` (${row.sampleCollectionRoom.location})` : ''}`
                    : '-';
                const creator = row.creator?.name || '-';

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#3B82F6;"
                                type="button"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-table-name="${tableName.replace(/"/g, '&quot;')}"
                                data-category="${category.replace(/"/g, '&quot;')}"
                                data-department="${department.replace(/"/g, '&quot;')}"
                                data-room="${room.replace(/"/g, '&quot;')}"
                                data-creator="${creator.replace(/"/g, '&quot;')}"
                                data-price="${Number(row.price || 0).toFixed(2)}"
                                data-currency="${currencySymbol}"
                                data-id="${row.id}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.id.toString().startsWith('T-') ? row.id : 'T-' + row.id}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Test Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "match_table_name",
            title: "Report Template Format",
            orderable: true,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: TestItem) => {
                const value = row.match_table_name;
                if (!value) return '<span class="text-red-500 font-semibold">N/A</span>';

                const matchedTable = testTables.find(
                    (t: any) => t.table_name === String(value) || t.display_name === String(value)
                );

                return matchedTable
                    ? `<span class="font-medium text-blue-600 dark:text-blue-400">${matchedTable.display_name}</span>`
                    : `<span>${String(value)}</span>`;
            },
            defaultContent: "",
        },
        {
            data: "sample_normal_range",
            title: "Normal Range",
            orderable: true,
            responsivePriority: 4,
            render: (data: any) => {
                const range = data;
                if (!range) return '<span class="text-muted-foreground">-</span>';
                return `<span class="text-sm font-medium text-gray-700 dark:text-gray-300">${range}</span>`;
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Category",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: TestItem) => {
                const category = row.category;
                return `<span class="font-medium">${category?.name || '<span class="text-red-500 font-semibold">N/A</span>'}</span>`;
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Department",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: TestItem) => {
                const category = row.category;
                const department = category?.department;

                if (!department) {
                    return '<span class="text-red-500 font-semibold">N/A</span>';
                }

                return `
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ${department.name || 'N/A'}
                    </span>
                `;
            },
            defaultContent: "",
        },
        {
            data: "price",
            title: `Price (${currencySymbol})`,
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => {
                const price = Number(data || 0);
                return price.toFixed(2);
            },
            defaultContent: "0.00",
        },
        {
            data: null,
            title: "Room No",
            orderable: false,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: TestItem) => {
                const room = row.sampleCollectionRoom;
                if (!room) return '<span class="text-muted-foreground">-</span>';
                return `
                    <div class="flex flex-col">
                        <span class="font-medium">${room.name}</span>
                        ${room.location ? `<span class="text-xs text-muted-foreground">${room.location}</span>` : ''}
                    </div>
                `;
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: TestItem) => {
                return `
                    <div class="flex flex-nowrap items-center gap-2">
                        <a href="/dashboard/outdoor/master/tests/${row.id}" onclick="window.viewTest('${row.id}'); return false;"
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                        </a>
                        <a href="/dashboard/outdoor/master/tests/edit/${row.id}" onclick="window.editTest('${row.id}'); return false;"
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                        </a>
                        <button onclick="window.deleteTest('${row.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
                        </button>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ], [page, limit, currencySymbol, testTables]);

    return <>
        <AppHeader fixed />

        <main className=''>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                <h1 className="text-2xl font-bold tracking-tight">List of Tests</h1>
                <Link to="/dashboard/outdoor/master/tests/create"><Button>Create New Test</Button></Link>
                {/* <CreateTestForm /> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {stats.map((card) => {
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

            <DataTable
                key={`tt-${testTables.length}`}
                columns={columns}
                data={data?.data?.items || []}
                meta={data?.data?.meta}
                onPageChange={setPage}
                onLimitChange={setLimit}
                search={search}
                isLoading={isFetching}
                onSearchChange={setSearch}
                filterSlot={
                    <Select
                        value={categoryId ? String(categoryId) : 'all'}
                        onValueChange={(val) => setCategoryId(val === 'all' ? undefined : Number(val))}
                    >
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categoriesData?.map((cat: any) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />
        </main>
    </>
}