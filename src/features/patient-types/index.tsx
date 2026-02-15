import { useState } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { CreatePatientTypeForm } from './components/CreatePatientTypeForm'
import { EditPatientTypeForm } from './components/EditPatientTypeForm'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent } from '@/components/ui/card'
import { Layers, Users } from 'lucide-react'

type PatientTypeItem = {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
};

export default function PatientTypes() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedPatientTypeId, setSelectedPatientTypeId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["patient-types", page, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient-type?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch patient types");
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
        queryKey: ["patient-types-overall-stats"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient-type/statistics/overall`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { totalPatientTypes: 0, totalPatients: 0 };
            const result = await res.json();
            return result.data || { totalPatientTypes: 0, totalPatients: 0 };
        },
        enabled: !!token,
    });

    const stats = statsData || { totalPatientTypes: 0, totalPatients: 0 };

    const statCards = [
        {
            title: 'Total Patient Types',
            value: stats.totalPatientTypes || 0,
            icon: <Layers className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Active Types'
        },
        {
            title: 'Total Patients',
            value: stats.totalPatients || 0,
            icon: <Users className='h-6 w-6' />,
            gradient: 'from-violet-600 to-purple-600',
            shadow: 'shadow-purple-500/20',
            label: 'Registered Patients'
        },
    ];

    const columns: ColumnDef<PatientTypeItem>[] = [
        {
            accessorKey: "id",
            header: "ID",
        },
        {
            accessorKey: "name",
            header: "Type Name",
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => row.original.description || '-',
        },
        {
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ row }) => {
                const date = row.original.created_at;
                if (!date) return '-';
                const parsedDate = new Date(date);
                return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString();
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/indoor/master/patient-types/${item.id}` })}
                        >
                            View
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                                setSelectedPatientTypeId(item.id);
                                setOpenEditForm(true);
                            }}
                        >
                            Edit
                        </Button>
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
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">List of Patient Types</h1>
                    <CreatePatientTypeForm />
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
            <EditPatientTypeForm open={openEditForm} setOpen={setOpenEditForm} patientTypeId={selectedPatientTypeId} />
        </Main>
    </>
}
