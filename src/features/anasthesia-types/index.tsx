import { useState, useEffect } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { CreateAnasthesiaTypeForm } from './components/CreateAnasthesiaTypeForm'
import { EditAnasthesiaTypeForm } from './components/EditAnasthesiaTypeForm'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Users } from 'lucide-react'

type AnasthesiaTypeItem = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    created_by?: string | number | null;
};

export default function AnasthesiaTypes() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedAnasthesiaTypeId, setSelectedAnasthesiaTypeId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["anasthesia-types", page, search],
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
            icon: <Activity className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Active Types'
        },
        {
            title: 'Total Procedures',
            value: stats.totalAnasthesia || 0,
            icon: <Users className='h-6 w-6' />,
            gradient: 'from-violet-600 to-purple-600',
            shadow: 'shadow-purple-500/20',
            label: 'Anasthesia Procedures'
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
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-description="${(row.description || '-').replace(/"/g, '&quot;')}"
                                data-created-date="${createdDate.replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span>${data}</span>
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
            render: (data: any) => {
                const value = data || '-';
                return `<span class="text-sm text-muted-foreground">${value}</span>`;
            },
        },
        {
            data: null,
            title: "Actions",
            render: (data: any, type: string, row: AnasthesiaTypeItem) => {
                return `
                    <div class="flex gap-2">
                        <button data-action="view" data-id="${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                            View
                        </button>
                        <button data-action="edit" data-id="${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3">
                            Edit
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
                btn.style.backgroundColor = 'black';
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

            // Create details HTML
            const details = document.createElement('ul');
            details.className = 'grid grid-cols-2 gap-2 text-sm';
            details.innerHTML = `
                <li><strong>Anesthesia Type ID:</strong> ${id}</li>
                <li><strong>Type Name:</strong> ${name}</li>
                <li class='col-span-2'><strong>Description:</strong> ${description}</li>
                <li><strong>Created Date:</strong> ${createdDate}</li>
                <li><strong>Created By:</strong> ${createdBy}</li>
                <li class='col-span-2'><strong>Actions:</strong>
                    <button data-action="view" data-id="${id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2">View</button>
                    <button data-action="edit" data-id="${id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">Edit</button>
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

    // Handle button clicks via event delegation
    useEffect(() => {
        const handleTableClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const button = target.closest('button[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const id = button.getAttribute('data-id');

            if (action === 'view' && id) {
                navigate({ to: `/indoor/master/anasthesia-types/${id}` });
            } else if (action === 'edit' && id) {
                setSelectedAnasthesiaTypeId(Number(id));
                setOpenEditForm(true);
            }
        };

        // Add event listener to the document
        document.addEventListener('click', handleTableClick);

        return () => {
            document.removeEventListener('click', handleTableClick);
        };
    }, [navigate]);

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
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">List of Anasthesia Types</h1>
                    <CreateAnasthesiaTypeForm />
                </div>
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={setPage}
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>
            <EditAnasthesiaTypeForm open={openEditForm} setOpen={setOpenEditForm} anasthesiaTypeId={selectedAnasthesiaTypeId} />
        </Main>
    </>
}
