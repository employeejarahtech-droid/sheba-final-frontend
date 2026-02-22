
import { AppHeader } from '@/components/layout/app-header'



import { DataTable } from '@/components/DataTable'
import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
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
    created_by?: string;
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

    const { data, error, isLoading } = useQuery({
        queryKey: ["doctor", page, search],

        queryFn: async () => {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/doctor?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            console.log('Fetching from:', apiUrl);

            const res = await fetch(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch doctors: ${res.status} ${errorText}`);
            }

            const json = await res.json();
            console.log('Parsed JSON:', JSON.stringify(json, null, 2));
            return json;
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

    // Debug logging
    console.log('Doctors data:', data);
    console.log('Doctors items:', data?.data?.items);
    console.log('Doctors rows:', data?.data?.rows);
    console.log('Full response:', JSON.stringify(data, null, 2));

    // Extract data with fallbacks for different response structures
    const doctorsData = data?.data?.items || data?.data?.rows || data?.items || data?.rows || [];
    const doctorsMeta = data?.data?.meta || data?.meta || { page, limit, total: data?.data?.total || data?.total || 0 };

    console.log('Extracted doctorsData:', doctorsData);
    console.log('Extracted doctorsMeta:', doctorsMeta);

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
            const doctorId = btn.dataset.doctorId || '';
            const name = btn.dataset.name || '-';
            const title = btn.dataset.title || '-';
            const qualification = btn.dataset.qualification || '-';
            const speciality = btn.dataset.speciality || '-';
            const country = btn.dataset.country || '-';
            const city = btn.dataset.city || '-';
            const phone = btn.dataset.phone || '-';
            const mobile = btn.dataset.mobile || '-';
            const email = btn.dataset.email || '-';
            const createdBy = btn.dataset.createdBy || '-';

            // Create details HTML
            const details = document.createElement('ul');
            details.className = 'grid grid-cols-2 gap-2 text-sm';
            details.innerHTML = `
                <li><strong>Doctor ID:</strong> ${doctorId}</li>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Qualification:</strong> ${qualification}</li>
                <li><strong>Speciality:</strong> ${speciality}</li>
                <li><strong>Country:</strong> ${country}</li>
                <li><strong>City:</strong> ${city}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Mobile:</strong> ${mobile}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Created By:</strong> ${createdBy}</li>
                <li class='col-span-2'><strong>Actions:</strong>
                    <a href='/outdoor/master/doctors/${id}' class='inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2 mr-2'>View</a>
                    <a href='/outdoor/master/doctors/${id}/edit' class='inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2'>Edit</a>
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


    //console.log(data?.data);

    // Define columns with access to settings for formatted ID
    const columns = [
        {
            data: "id",
            title: "Doctor ID",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: DoctorItem) => {
                // Format the doctor ID for display
                let formattedId = '';
                if (row.doctor_id) {
                    formattedId = row.doctor_id;
                } else {
                    const sequence = row.sequence || parseInt(String(row.id).replace(/\D/g, '')) || 0;
                    const doctorPrefix = settings?.doctorPrefix || 'DOC-{0000}';
                    formattedId = formatId(doctorPrefix, sequence);
                }

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${row.id}"
                                data-doctor-id="${formattedId.replace(/"/g, '&quot;')}"
                                data-name="${(row.doctor_name || '-').replace(/"/g, '&quot;')}"
                                data-title="${(row.title || '-').replace(/"/g, '&quot;')}"
                                data-qualification="${(row.qualification || '-').replace(/"/g, '&quot;')}"
                                data-speciality="${(row.speciality || '-').replace(/"/g, '&quot;')}"
                                data-country="${(row.country || '-').replace(/"/g, '&quot;')}"
                                data-city="${(row.city || '-').replace(/"/g, '&quot;')}"
                                data-phone="${(row.phone || '-').replace(/"/g, '&quot;')}"
                                data-mobile="${(row.mobile || '-').replace(/"/g, '&quot;')}"
                                data-email="${(row.email || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono font-medium">${formattedId}</span>
                    </div>
                `;
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
            data: "created_by",
            title: "Created By",
            orderable: true,
            responsivePriority: 7,
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
        <AppHeader fixed />

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
                data={doctorsData}
                meta={doctorsMeta}
                onPageChange={setPage}
                search={search}
                onSearchChange={setSearch}
                isLoading={isLoading}
            />

        </main>
    </>
}