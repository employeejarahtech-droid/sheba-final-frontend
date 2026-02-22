import { useState, useEffect, useMemo } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { CreateCategoryForm } from './components/CreateCategoryForm'
import { EditCategoryForm } from './components/EditCategoryForm'
import { useQuery } from '@tanstack/react-query'
//import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Layers, Database, TrendingUp } from 'lucide-react'

type CategoryItem = {
    id: number;
    name: string;
    department_id: number;
    department_name: string;
    created_at: string;
    created_by?: string;
};

export default function Categories() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;


    const token = getCookie('accessToken');
    //const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["category", page, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },

        enabled: !!token,

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
        queryKey: ["categories-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) return { totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };
            const result = await res.json();
            return result.data || { totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalCategories: 0, totalTests: 0, totalReports: 0, totalRevenue: 0 };

    const statCards = [
        {
            title: 'Total Categories',
            value: stats.totalCategories || 0,
            icon: <Layers className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Active Categories'
        },
        {
            title: 'Total Tests',
            value: stats.totalTests || 0,
            icon: <Activity className='h-6 w-6' />,
            gradient: 'from-violet-600 to-purple-600',
            shadow: 'shadow-purple-500/20',
            label: 'Mapped Tests'
        },
        {
            title: 'Total Reports',
            value: stats.totalReports || 0,
            icon: <Database className='h-6 w-6' />,
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
            label: 'Record Entries'
        },
        {
            title: 'Total Revenue',
            value: `৳${(stats.totalRevenue || 0).toLocaleString()}`,
            icon: <TrendingUp className='h-6 w-6' />,
            gradient: 'from-amber-600 to-orange-600',
            shadow: 'shadow-amber-500/20',
            label: 'Revenue Generated'
        }
    ];

    console.log('data', data);

    // Expose edit function to window for onclick handlers
    useEffect(() => {
        (window as any).editCategory = (id: number) => {
            setSelectedCategoryId(id);
            setOpenEditForm(true);
        };
    }, [setSelectedCategoryId, setOpenEditForm]);

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
            const id = btn.dataset.id || '';
            const name = btn.dataset.name || '-';
            const department = btn.dataset.department || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create details HTML
            const details = document.createElement('ul');
            details.className = 'grid grid-cols-2 gap-2 text-sm';
            details.innerHTML = `
                <li><strong>Category ID:</strong> ${id}</li>
                <li><strong>Category Name:</strong> ${name}</li>
                <li><strong>Department:</strong> ${department}</li>
                <li><strong>Created By:</strong> ${createdBy}</li>
                <li class='col-span-2'><strong>Actions:</strong>
                    <a href='/outdoor/master/categories/${id}' class='inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2'>View</a>
                    <button onclick="window.editCategory(${id})" class='inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2'>Edit</button>
                </li>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 10;
            cell.appendChild(details);
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

    // Delete mutation




    console.log(data?.data);

    const columns = [
        {
            data: "id",
            title: "Category ID",
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: CategoryItem) => {
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-department="${(row.department_name || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span>${data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Category Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "department_name",
            title: "Department Name",
            orderable: true,
            responsivePriority: 2,
            defaultContent: "",
        },
        {
            data: "created_by",
            title: "Created By",
            orderable: true,
            responsivePriority: 3,
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
            render: (_data: any, _type: string, row: CategoryItem) => {
                return `
                    <div class="flex gap-2">
                        <a href="/outdoor/master/categories/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <button onclick="window.editCategory(${row.id})" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
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
                    <h1 className="text-2xl font-bold tracking-tight">List of Categories</h1>
                    <CreateCategoryForm />
                </div>
                <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
                <EditCategoryForm open={openEditForm} setOpen={setOpenEditForm} categoryId={selectedCategoryId} />
            </div>
        </Main>
    </>
}
