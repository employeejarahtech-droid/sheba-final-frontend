import { useState, useEffect } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { CreateDepartmentForm } from './components/CreateDepartmentForm'
import { EditDepartmentForm } from './components/EditDepartmentForm'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Layers, Database, TrendingUp } from 'lucide-react'


type DepartmentItem = {
    id: string;
    name: string;
    created_by?: string;
};

export default function Departments() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;


    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["deparmtent", page, search],

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
        {
            title: 'Total Departments',
            value: stats.totalDepartments || 0,
            icon: <Building2 className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Active Departments'
        },
        {
            title: 'Total Categories',
            value: stats.totalCategories || 0,
            icon: <Layers className='h-6 w-6' />,
            gradient: 'from-violet-600 to-purple-600',
            shadow: 'shadow-purple-500/20',
            label: 'Test Categories'
        },
        {
            title: 'Total Tests',
            value: stats.totalTests || 0,
            icon: <Database className='h-6 w-6' />,
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
            label: 'Mapped Tests'
        },
        {
            title: 'Total Reports',
            value: stats.totalReports || 0,
            icon: <TrendingUp className='h-6 w-6' />,
            gradient: 'from-amber-600 to-orange-600',
            shadow: 'shadow-amber-500/20',
            label: 'Record Entries'
        }
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

    const columns = [
        {
            data: "id",
            title: "Department ID",
            orderable: true,
            responsivePriority: 2,
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
            render: (data: any) => {
                return `<span class="text-sm text-muted-foreground">${data || '-'}</span>`;
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
                    <div class="flex gap-2">
                        <a href="/outdoor/master/departments/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <button onclick="window.editDepartment('${row.id}')" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
                            Edit
                        </button>
                    </div>
                `;
            },
            defaultContent: "",
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

        <Main className="p-6 lg:p-10">
            <div className="space-y-8">
                {/* Statistics Cards */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
                    {statCards.map((card, idx) => (
                        <Card key={idx} className={`relative overflow-hidden border-none text-white shadow-xl ${card.shadow} bg-gradient-to-br ${card.gradient}`}>
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <CardContent className='p-6'>
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
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">List of Departments</h1>
                    <CreateDepartmentForm />
                </div>
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={(newPage) => setPage(newPage)}
                    search={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1); // reset page when searching
                    }}
                />
            </div>
            <EditDepartmentForm open={openEditForm} setOpen={setOpenEditForm} departmentId={selectedDepartmentId} />
        </Main>
    </>
}