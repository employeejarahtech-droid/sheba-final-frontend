import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Stethoscope, Award, Globe, MapPin, Plus } from 'lucide-react'


type DoctorItem = {
    id: string;
    doctor_name: string;
    title: string;
    qualification: string;
    speciality: string;
    country: string;
    city: string;
    phone: string;
    mobile: string;
    email: string;
};

export default function Doctors() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');

    const { data } = useQuery({
        queryKey: ["doctor", page, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch doctors");
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

    // Calculate stats
    const stats = useMemo(() => {
        const doctors = data?.data?.rows || data?.data?.items || [];
        const totalDoctors = data?.data?.meta?.total || data?.data?.total || 0;

        // Get unique specialties
        const uniqueSpecialties = new Set(doctors.map((d: DoctorItem) => d.speciality).filter(Boolean));
        const totalSpecialties = uniqueSpecialties.size;

        // Get unique countries
        const uniqueCountries = new Set(doctors.map((d: DoctorItem) => d.country).filter(Boolean));
        const totalCountries = uniqueCountries.size;

        // Get unique cities
        const uniqueCities = new Set(doctors.map((d: DoctorItem) => d.city).filter(Boolean));
        const totalCities = uniqueCities.size;

        return [
            {
                label: "Total Doctors",
                value: totalDoctors,
                gradient: "from-blue-600 to-blue-400",
                shadow: "shadow-blue-500/30",
                icon: <Stethoscope className="w-6 h-6 text-white" />,
            },
            {
                label: "Specialties",
                value: totalSpecialties,
                gradient: "from-purple-600 to-purple-400",
                shadow: "shadow-purple-500/30",
                icon: <Award className="w-6 h-6 text-white" />,
            },
            {
                label: "Countries",
                value: totalCountries,
                gradient: "from-emerald-600 to-emerald-400",
                shadow: "shadow-emerald-500/30",
                icon: <Globe className="w-6 h-6 text-white" />,
            },
            {
                label: "Cities",
                value: totalCities,
                gradient: "from-amber-600 to-amber-400",
                shadow: "shadow-amber-500/30",
                icon: <MapPin className="w-6 h-6 text-white" />,
            },
        ];
    }, [data]);



    //console.log(data?.data);

    const columns: ColumnDef<DoctorItem>[] = [
        // Row selection
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
            accessorKey: "id",
            header: "ID",
        },
        {
            accessorKey: "doctor_name",
            header: "Doctor's Name",
        },
        {
            accessorKey: "title",
            header: "Title",
        },
        {
            accessorKey: "qualification",
            header: "Qualification",
        },
        {
            accessorKey: "speciality",
            header: "Speciality",
        },
        {
            accessorKey: "country",
            header: "Country",
        },
        {
            accessorKey: "city",
            header: "City",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "mobile",
            header: "Mobile",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "score",
            header: "Score",
        },

        // Actions Column
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex gap-2">
                        <Link to={`/outdoor/master/doctors/$doctorId`} params={{ doctorId: item.id }}>
                            <Button size="sm" variant="outline">
                                View
                            </Button>
                        </Link>
                        <Link to={`/outdoor/master/doctors/$doctorId/edit`} params={{ doctorId: item.id }}>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <h1 className="text-2xl font-bold tracking-tight">List of Doctor</h1>
                <Link to="/outdoor/master/doctors/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Doctor
                    </Button>
                </Link>
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
                data={data?.data?.rows || data?.data?.items || []}
                meta={data?.data?.meta || { page, limit, total: data?.data?.total || 0 }}
                onPageChange={setPage}
                search={search}
                onSearchChange={setSearch}
            />

        </main>
    </>
}