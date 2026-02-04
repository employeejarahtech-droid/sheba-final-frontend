import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ConfigDrawer } from '@/components/config-drawer';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable';
import { PlusCircle, PenLine, Trash2 } from 'lucide-react';

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

    const { data, isLoading } = useQuery({
        queryKey: ['bed-cabin-list'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch bed/cabin list');
            const result = await res.json();
            return result.data.items as BedCabinItem[];
        },
        enabled: !!token
    });
    const columns: ColumnDef<BedCabinItem>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(Boolean(value))
                    }
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "code",
            header: "Bed/Cabin Code",
            cell: ({ row }) => <span className="font-bold text-blue-600">{row.getValue("code")}</span>
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string;
                return (
                    <Badge variant="outline" className="rounded-md font-medium px-2 py-0.5 border-blue-100 bg-blue-50/30 text-blue-700">
                        {type}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "ward",
            header: "Ward/Department",
        },
        {
            accessorKey: "status",
            header: "Current Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const variants: Record<string, string> = {
                    Available: "bg-emerald-500",
                    Occupied: "bg-blue-500",
                    Maintenance: "bg-amber-500",
                };
                const color = variants[status] || "bg-gray-500";
                return <Badge className={cn(color, "text-white rounded-md")}>{status}</Badge>;
            },
        },
        {
            accessorKey: "price",
            header: "Price/Day",
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price"));
                return <span className="font-semibold text-gray-700">৳ {price.toLocaleString()}</span>;
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: () => {
                return (
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <PenLine className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-8">
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
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add New Room/Bed
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {isLoading ? (
                            <div className="p-20 text-center text-muted-foreground animate-pulse">
                                Loading Bed & Cabin data...
                            </div>
                        ) : (
                            <DataTable columns={columns} data={data || []} />
                        )}
                    </div>
                </div>
            </Main>
        </div>
    );
}

// Utility for status colors
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
