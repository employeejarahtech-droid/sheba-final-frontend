import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ConfigDrawer } from '@/components/config-drawer';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable';
import { PlusCircle } from 'lucide-react';

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

    const columns = [
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
            data: null,
            title: 'Actions',
            render: (data: any, type: string, row: BedCabinItem) => `
                <div class="flex gap-2">
                    <button class="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded flex items-center justify-center" onclick="window.editBedCabin('${row.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded flex items-center justify-center" onclick="deleteBedCabin(${row.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            `,
            orderable: false,
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <Header>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

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

// Global delete function for inline button clicks
declare global {
    interface Window {
        deleteBedCabin?: (id: number) => void;
        editBedCabin?: (id: string) => void;
    }
}

if (typeof window !== 'undefined') {
    window.deleteBedCabin = async (id: number) => {
        if (!confirm('Are you sure you want to delete this bed/cabin?')) return;

        const token = getCookie('accessToken');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert('Bed/Cabin deleted successfully');
                window.location.reload();
            } else {
                alert('Failed to delete bed/cabin');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting bed/cabin');
        }
    };

    window.editBedCabin = (id: string) => {
        window.location.href = `/indoor/master/bed-cabin-list/${id}`;
    };
}
