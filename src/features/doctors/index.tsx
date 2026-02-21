import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Stethoscope, Award, Globe, MapPin, Plus } from 'lucide-react'
import { formatId } from '@/lib/prefix-format'


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
    doctor_id?: string;
    sequence?: number;
};

export default function Doctors() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const token = getCookie('accessToken');

    // Fetch app settings for doctor prefix format
    const { data: settings } = useQuery({
        queryKey: ['app-settings'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch settings');
            const json = await res.json();
            return json.data || {};
        },
        enabled: !!token,
    });

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

    // Define columns with access to settings for formatted ID
    const columns = [
        {
            data: "id",
            title: "Doctor ID",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: DoctorItem) => {
                // If API returns formatted doctor_id, use it
                if (row.doctor_id) {
                    return `<span class="font-mono font-medium">${row.doctor_id}</span>`;
                }

                // Otherwise, format using prefix settings
                // Use sequence if available, otherwise use numeric part of id
                const sequence = row.sequence || parseInt(String(row.id).replace(/\D/g, '')) || 0;
                const doctorPrefix = settings?.doctorPrefix || 'DOC-{0000}';

                return `<span class="font-mono font-medium">${formatId(doctorPrefix, sequence)}</span>`;
            },
            defaultContent: "",
        },
        {
            data: "doctor_name",
            title: "Doctor's Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: "title",
            title: "Title",
            orderable: true,
            responsivePriority: 3,
            defaultContent: "",
        },
        {
            data: "qualification",
            title: "Qualification",
            orderable: true,
            responsivePriority: 4,
            defaultContent: "",
        },
        {
            data: "speciality",
            title: "Speciality",
            orderable: true,
            responsivePriority: 3,
            defaultContent: "",
        },
        {
            data: "country",
            title: "Country",
            orderable: true,
            responsivePriority: 5,
            defaultContent: "",
        },
        {
            data: "city",
            title: "City",
            orderable: true,
            responsivePriority: 5,
            defaultContent: "",
        },
        {
            data: "phone",
            title: "Phone",
            orderable: true,
            responsivePriority: 6,
            defaultContent: "",
        },
        {
            data: "mobile",
            title: "Mobile",
            orderable: true,
            responsivePriority: 6,
            defaultContent: "",
        },
        {
            data: "email",
            title: "Email",
            orderable: true,
            responsivePriority: 6,
            defaultContent: "",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: DoctorItem) => {
                return `
                    <div class="flex gap-2">
                        <a href="/outdoor/master/doctors/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2">
                            View
                        </a>
                        <a href="/outdoor/master/doctors/${row.id}/edit" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2">
                            Edit
                        </a>
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

        <main className='p-6 lg:p-10'>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <h1 className="text-2xl font-bold tracking-tight">List of Doctor</h1>
                <Link to="/outdoor/master/doctors/create">
                    <Button>
                        <Plus className="h-4 w-4" />
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