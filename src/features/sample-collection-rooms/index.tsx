import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/DataTable'
import { CreateSampleCollectionRoomForm } from './components/CreateSampleCollectionRoomForm'
import { EditSampleCollectionRoomForm } from './components/EditSampleCollectionRoomForm'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { FlaskConical, Building2, TrendingUp } from 'lucide-react'


type SampleCollectionRoomItem = {
    id: string;
    name: string;
    location: string;
    notes?: string;
    status: 'active' | 'inactive';
    created_by?: string;
    created_by_name?: string;
};

export default function SampleCollectionRooms() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);


    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["sample-collection-rooms", page, limit, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch sample collection rooms");
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
        queryKey: ["sample-collection-rooms-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms/statistics`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) return { totalRooms: 0, activeRooms: 0, totalCollections: 0 };
            const result = await res.json();
            return result.data || { totalRooms: 0, activeRooms: 0, totalCollections: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalRooms: 0, activeRooms: 0, totalCollections: 0 };

    const statCards = [
        {
            title: 'Total Rooms',
            value: stats.totalRooms || 0,
            icon: <FlaskConical className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Registered Rooms'
        },
        {
            title: 'Active Rooms',
            value: stats.activeRooms || 0,
            icon: <Building2 className='h-6 w-6' />,
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
            label: 'Currently Active'
        },
        {
            title: 'Total Collections',
            value: stats.totalCollections || 0,
            icon: <TrendingUp className='h-6 w-6' />,
            gradient: 'from-amber-600 to-orange-600',
            shadow: 'shadow-amber-500/20',
            label: 'Sample Collections'
        }
    ];

    console.log(data?.data);

    // Expose edit function to window for onclick handlers
    useEffect(() => {
        (window as any).editSampleCollectionRoom = (id: string) => {
            setSelectedRoomId(id);
            setOpenEditForm(true);
        };
    }, [setSelectedRoomId, setOpenEditForm]);

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
            const location = btn.dataset.location || '-';
            const notes = btn.dataset.notes || '-';
            const status = btn.dataset.status || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Sample Collection Room Information</h2>
                        <p class="text-blue-100 text-sm">Detailed overview of selected room</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Room ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">#${id}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Room Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Location</span>
                                <span class="font-medium text-gray-700">${location}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Status</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                    ${status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </li>

                            ${notes && notes !== '-' ? `
                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Notes</span>
                                <span class="font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-md mt-1">${notes}</span>
                            </li>
                            ` : ''}

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Created By</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                    ${createdBy}
                                </span>
                            </li>

                        </ul>

                        <!-- Actions -->
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <button onclick="window.editSampleCollectionRoom('${id.replace(/'/g, "\\'")}')"
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
            title: "Room ID",
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: SampleCollectionRoomItem) => {
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
                                data-name="${(row.name || '-').replace(/"/g, '&quot;')}"
                                data-location="${(row.location || '-').replace(/"/g, '&quot;')}"
                                data-notes="${(row.notes || '-').replace(/"/g, '&quot;')}"
                                data-status="${row.status || 'active'}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span>${data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "name",
            title: "Room Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "location",
            title: "Location",
            orderable: true,
            responsivePriority: 2,
            defaultContent: "",
        },
        {
            data: "notes",
            title: "Notes",
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => {
                if (!data) return '<span class="text-sm text-muted-foreground">-</span>';
                const truncated = data.length > 30 ? data.substring(0, 30) + '...' : data;
                return `<span class="text-sm text-gray-700" title="${data.replace(/"/g, '&quot;')}">${truncated.replace(/"/g, '&quot;')}</span>`;
            },
            defaultContent: "-",
        },
        {
            data: "status",
            title: "Status",
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => {
                const status = data || 'active';
                const colorClass = status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700';
                return `<span class="px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">
                    ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>`;
            },
            defaultContent: "Active",
        },
        {
            data: "created_by",
            title: "Created By",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: SampleCollectionRoomItem) => {
                const name = row.created_by_name || row.created_by || '-';
                return `<span class="text-sm text-muted-foreground">${name}</span>`;
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: SampleCollectionRoomItem) => {
                return `
                    <div class="flex gap-2">
                        <button onclick="window.editSampleCollectionRoom('${row.id}')" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
                            Edit
                        </button>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ];

    return <>
        <AppHeader fixed />

        <main className="p-4">
            <div className="space-y-4">
                {/* Statistics Cards */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                    {statCards.map((card, idx) => (
                        <Card key={idx} className={`p-3 relative overflow-hidden border-none text-white shadow-xl ${card.shadow} bg-gradient-to-br ${card.gradient}`}>
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <CardContent className='p-3'>
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
                <PageHeader
                    title="List of Sample Collection Rooms"
                    actions={<CreateSampleCollectionRoomForm />}
                />
                <DataTable
                    columns={columns}
                    data={data?.data?.items || []}
                    meta={data?.data?.meta}
                    onPageChange={(newPage) => setPage(newPage)}
                    onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setPage(1);
                    }}
                    search={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                />
            </div>
            <EditSampleCollectionRoomForm open={openEditForm} setOpen={setOpenEditForm} roomId={selectedRoomId} />
        </main>
    </>
}
