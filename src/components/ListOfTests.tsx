import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FlaskConical, CheckCircle, FolderTree, DollarSign } from 'lucide-react'

type TestItem = {
    id: number
    name: string
    category_id: number
    match_table_name: number
    status: string
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
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["tests", page, search],
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
        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        total: 0,
                    },
                },
    });

    // Calculate stats
    const stats = useMemo(() => {
        const tests = data?.data?.items || [];
        const totalTests = data?.data?.meta?.total || 0;
        const activeTests = tests.filter((t: TestItem) => t.status === 'active').length;

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
                label: "Active Tests",
                value: activeTests,
                gradient: "from-emerald-600 to-emerald-400",
                shadow: "shadow-emerald-500/30",
                icon: <CheckCircle className="w-6 h-6 text-white" />,
            },
            {
                label: "Categories",
                value: totalCategories,
                gradient: "from-purple-600 to-purple-400",
                shadow: "shadow-purple-500/30",
                icon: <FolderTree className="w-6 h-6 text-white" />,
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

    const columns: ColumnDef<TestItem>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => (
                <div className="">
                    {row.index + 1}
                </div>
            ),
            enableSorting: false,
        },
        {
            accessorKey: "id",
            header: "Test ID",
        },
        {
            accessorKey: "name",
            header: "Test Name",
        },
        {
            accessorKey: "match_table_name",
            header: "Match Table Name",
            cell: ({ row }) => {
                const matchTableName = row.original.match_table_name;
                return matchTableName ? (
                    matchTableName
                ) : (
                    <span className="text-red-500 font-semibold">N/A</span>
                );
            }
        },
        {
            accessorKey: "category_id",
            header: "Category",
            cell: ({ row }) => {
                const category = row.original.category;
                const department = category?.department;

                return (
                    <div className="flex flex-col">
                        <span>{category?.name ?? <span className="text-red-500 font-semibold">N/A</span>}</span>
                        <span className="text-xs text-muted-foreground">
                            {department?.name}
                        </span>
                    </div>
                );
            }

        },
        {
            accessorKey: "price",
            header: "Price (BDT)",
            cell: ({ row }) => {
                const price = Number(row.original.price);
                return `${price.toFixed(2)}`;
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex gap-2">
                        <Link to={`/outdoor/master/tests/$id`} params={{ id: String(item.id) }}>
                            <Button size="sm" variant="outline">
                                View
                            </Button>
                        </Link>
                        <Link to={`/outdoor/master/tests/edit/$id`} params={{ id: String(item.id) }}>
                            <Button size="sm" variant="default">
                                Edit
                            </Button>
                        </Link>
                    </div>
                );
            },
        },
    ];

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
                onPageChange={(newPage) => setPage(newPage)} search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1); // reset page when searching
                }}
            />
        </main>
    </>
}