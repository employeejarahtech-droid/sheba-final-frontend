import { createFileRoute, useNavigate } from '@tanstack/react-router';
;
import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
;
;
;
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable';
import { PlusCircle } from 'lucide-react';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';

export const Route = createFileRoute('/_authenticated/indoor/master/bed-cabin-list/')({
    component: BedCabinList,
})

type BedCabinItem = {
    id: string;
    code: string;
    type: "Cabin" | "Bed" | "Special";
    ward: string;
    status: "Available" | "Occupied" | "Maintenance";
    price: number;
    created_by?: string | number | null;
};

function BedCabinList() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');

    const { data, isLoading, error } = useQuery({
        queryKey: ['bed-cabin-list'],
        queryFn: async () => {
            console.log('Fetching bed/cabin list from:', `${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=100`);
            console.log('Token exists:', !!token);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API Error:', res.status, errorText);
                throw new Error(`Failed to fetch bed/cabin list: ${res.status} - ${errorText}`);
            }

            const result = await res.json();
            console.log('Full API Response:', JSON.stringify(result, null, 2));

            // Return the full result, not just items - we'll access .data?.items in the render
            return result;
        },
        enabled: !!token,
        placeholderData: (prev) => prev || { data: { items: [], meta: { total: 0, page: 1, limit: 100 } } }
    });

    // Log current data state
    console.log('Current data state:', data);
    console.log('Loading:', isLoading, 'Error:', error);

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
            const code = btn.dataset.code || '-';
            const type = btn.dataset.type || '-';
            const ward = btn.dataset.ward || '-';
            const status = btn.dataset.status || '-';
            const price = btn.dataset.price || '0';
            const createdBy = btn.dataset.createdBy || '-';

            // Create details HTML
            const details = document.createElement('ul');
            details.className = 'grid grid-cols-2 gap-2 text-sm';
            details.innerHTML = `
                <li><strong>Bed/Cabin ID:</strong> ${id}</li>
                <li><strong>Code:</strong> ${code}</li>
                <li><strong>Type:</strong> ${type}</li>
                <li><strong>Ward/Department:</strong> ${ward}</li>
                <li><strong>Status:</strong> ${status}</li>
                <li><strong>Price/Day:</strong> ৳${price}</li>
                <li><strong>Created By:</strong> ${createdBy}</li>
                <li class='col-span-2'><strong>Actions:</strong>
                    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2" onclick="window.editBedCabin('${id}')">Edit</button>
                </li>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 9;
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

    const columns = [
        {
            data: 'id',
            title: 'ID',
            orderable: true,
            responsivePriority: 2,
            render: (data: any, _type: string, row: BedCabinItem) => {
                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
                                data-code="${(row.code || '-').replace(/"/g, '&quot;')}"
                                data-type="${(row.type || '-').replace(/"/g, '&quot;')}"
                                data-ward="${(row.ward || '-').replace(/"/g, '&quot;')}"
                                data-status="${(row.status || '-').replace(/"/g, '&quot;')}"
                                data-price="${Number(row.price || 0).toLocaleString()}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span>${data}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: 'code',
            title: 'Bed/Cabin Code',
            render: (data: string) => `<span class="font-bold text-blue-600">${data}</span>`,
        },
        {
            data: 'type',
            title: 'Type',
            render: (data: string) => {
                const colors: Record<string, string> = {
                    'Bed': 'bg-blue-100 text-blue-700 border-blue-200',
                    'Cabin': 'bg-purple-100 text-purple-700 border-purple-200',
                    'Special': 'bg-amber-100 text-amber-700 border-amber-200',
                };
                const colorClass = colors[data] || 'bg-gray-100 text-gray-700 border-gray-200';
                return `<span class="px-2 py-1 rounded-md text-xs font-medium border ${colorClass}">${data}</span>`;
            },
        },
        {
            data: 'ward',
            title: 'Ward/Department',
        },
        {
            data: 'status',
            title: 'Status',
            render: (data: string) => {
                const colors: Record<string, string> = {
                    'Available': 'bg-emerald-500',
                    'Occupied': 'bg-blue-500',
                    'Maintenance': 'bg-amber-500',
                };
                const colorClass = colors[data] || 'bg-gray-500';
                return `<span class="px-2 py-1 rounded-md text-xs font-medium text-white ${colorClass}">${data}</span>`;
            },
        },
        {
            data: 'price',
            title: 'Price/Day',
            render: (data: string) => {
                const price = parseFloat(data);
                return `<span class="font-semibold text-gray-700">৳ ${price.toLocaleString()}</span>`;
            },
        },
        {
            data: 'created_by',
            title: 'Created By',
            render: (data: any) => {
                const value = data || '-';
                return `<span class="text-sm text-muted-foreground">${value}</span>`;
            },
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <AppHeader fixed />

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="space-y-6 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent uppercase flex items-center gap-3">
                                Bed & Cabin Management
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Manage hospital rooms, beds, and allocation pricing
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 border-none px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                                onClick={() => navigate({ to: '/indoor/master/bed-cabin-list/create' })}
                            >
                                <PlusCircle className="h-4 w-4" />
                                Add New Room/Bed
                            </Button>
                        </div>
                    </div>

                    <div className="">
                        {isLoading ? (
                            <div className="p-20 text-center text-muted-foreground animate-pulse">
                                Loading Bed & Cabin data...
                            </div>
                        ) : error ? (
                            <div className="p-10 text-center">
                                <div className="text-red-500 font-semibold mb-2">Error loading data</div>
                                <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Please check browser console for details
                                </div>
                            </div>
                        ) : (
                            <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} />
                        )}
                    </div>
                </div>
            </Main>
        </div>
    );
}

// Global edit function for inline button clicks
declare global {
    interface Window {
        editBedCabin?: (id: string) => void;
    }
}

if (typeof window !== 'undefined') {
    window.editBedCabin = (id: string) => {
        window.location.href = `/indoor/master/bed-cabin-list/${id}`;
    };
}
