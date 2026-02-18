import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearch, useNavigate } from '@tanstack/react-router'
import { FlaskConical, CheckCircle, FolderTree, DollarSign } from 'lucide-react'

type TestItem = {
    id: number
    name: string
    category_id: number
    match_table_name: number
    price: number
    category: {
        id: number;
        name: string;
        department_id: number;
        department: {
            id: number;
            name: string;
        } | null;
    };
};

export default function ListOfTests() {
    const searchParams: any = useSearch({ strict: false });
    const navigate = useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const setPage = (newPage: number) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, page: newPage }),
        });
    };

    const setLimit = (newLimit: number) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }),
        });
    };

    const setSearch = (newSearch: string) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }),
        });
    };

    const token = getCookie('accessToken');

    const { data, isFetching } = useQuery({
        queryKey: ["tests", page, limit, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tests?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch tests");
            return res.json();
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
            {
                label: "Avg Price",
                value: totalTests > 0 ? `৳${(totalRevenue / totalTests).toFixed(0)}` : '৳0',
                gradient: "from-emerald-600 to-emerald-400",
                shadow: "shadow-emerald-500/30",
                icon: <CheckCircle className="w-6 h-6 text-white" />,
            },
            {
                label: "Total Revenue",
                value: `৳${totalRevenue.toLocaleString()}`,
                gradient: "from-amber-600 to-amber-400",
                shadow: "shadow-amber-500/30",
                icon: <DollarSign className="w-6 h-6 text-white" />,
            },
        ];
    }, [data]);

    //console.log(data);

    const columns = useMemo(() => [
        {
            data: null,
            title: "SL",
            orderable: false,
            responsivePriority: 3,
            render: (_data: any, _type: string, _row: TestItem, meta: any) => {
                return (page - 1) * limit + meta.row + 1;
            },
            defaultContent: "",
        },
        {
            data: "id",
            title: "Test ID",
            orderable: true,
            responsivePriority: 4,
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
            title: "Price (BDT)",
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
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: TestItem) => {
                return `
                    <div class="flex gap-2">
                        <a href="/outdoor/master/tests/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <a href="/outdoor/master/tests/edit/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
                            Edit
                        </a>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ], [page, limit]);

    return <>
        <Header fixed>
            <Search />
            <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
                <ConfigDrawer />
                <ProfileDropdown />
            </div>
        </Header>

        <main className='p-6 lg:p-10'>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
                <h1 className="text-2xl font-bold tracking-tight">List of Tests</h1>
                <Link to="/outdoor/master/tests/create"><Button>Create New Test</Button></Link>
                {/* <CreateTestForm /> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1); // reset page when changing page size
                }}
                search={search}
                isLoading={isFetching}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1); // reset page when searching
                }}
            />
        </main>
    </>
}