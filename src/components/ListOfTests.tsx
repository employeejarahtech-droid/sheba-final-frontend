
import { AppHeader } from '@/components/layout/app-header'



import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
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
        enabled: !!token,
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
            {
                label: "Total Tests",
                value: totalTests,
                gradient: "from-blue-600 to-blue-400",
                shadow: "shadow-blue-500/30",
                icon: <FlaskConical className="w-6 h-6 text-white" />,
            },
            {
                label: "Categories",
                value: totalCategories,
                gradient: "from-purple-600 to-purple-400",
                shadow: "shadow-purple-500/30",
                icon: <FolderTree className="w-6 h-6 text-white" />,
            },
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
                btn.style.backgroundColor = 'black';
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
                            <a href="/dashboard/outdoor/master/tests/${id}"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                View
                            </a>

                            <a href="/dashboard/outdoor/master/tests/edit/${id}"
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
            cell.colSpan = 7;
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
                const tableName = row.match_table_name ? String(row.match_table_name) : 'N/A';
                const category = row.category?.name || 'N/A';
                const department = row.category?.department?.name || '-';
                const room = row.sampleCollectionRoom
                    ? `${row.sampleCollectionRoom.name}${row.sampleCollectionRoom.location ? ` (${row.sampleCollectionRoom.location})` : ''}`
                    : '-';
                const creator = row.creator?.name || '-';

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
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
                        <span>${row.id}</span>
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
            title: "Match Table Name",
            orderable: true,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: TestItem) => {
                const value = row.match_table_name;
                return value ? String(value) : '<span class="text-red-500 font-semibold">N/A</span>';
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Category",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: TestItem) => {
                const category = row.category;
                const department = category?.department;

                return `
                    <div class="flex flex-col">
                        <span>${category?.name || '<span class="text-red-500 font-semibold">N/A</span>'}</span>
                        <span class="text-xs text-muted-foreground">
                            ${department?.name || ''}
                        </span>
                    </div>
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
                    <div class="flex gap-2">
                        <a href="/dashboard/outdoor/master/tests/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <a href="/dashboard/outdoor/master/tests/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
                            Edit
                        </a>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ], [page, limit, currencySymbol]);

    return <>
        <AppHeader fixed />

        <main className='p-4'>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                <h1 className="text-2xl font-bold tracking-tight">List of Tests</h1>
                <Link to="/dashboard/outdoor/master/tests/create"><Button>Create New Test</Button></Link>
                {/* <CreateTestForm /> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            <DataTable
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