
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'
import { Main } from '@/components/layout/main'

import { DataTable } from '@/components/DataTable'
import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Stethoscope, Award, Globe, MapPin, Plus } from 'lucide-react'
import { formatId } from '@/lib/prefix-format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'


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
    created_by_name?: string;
    doctor_type_ids?: string | number[];
    referred_patients_outdoor?: number;
    referred_patients_indoor?: number;
    experience?: number;
    created_at?: string;
};

type DoctorsProps = {
    page: number;
    limit: number;
    search: string;
    doctorType: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
    setDoctorType: (doctorType: string) => void;
};

export default function Doctors({ page, limit, search, doctorType, setPage, setLimit, setSearch, setDoctorType }: DoctorsProps) {
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Failed to delete doctor');
            return json;
        },
        onSuccess: () => {
            toast.success('Doctor deleted');
            queryClient.invalidateQueries({ queryKey: ['doctor'] });
        },
        onError: (err: Error) => { toast.error(err.message); },
    });

    // Expose delete function to window for onclick handlers
    useEffect(() => {
        (window as any).deleteDoctor = (id: string) => {
            if (confirm('Delete this doctor? This action cannot be undone.')) {
                deleteMutation.mutate(id);
            }
        };
    }, [deleteMutation]);

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

    // Fetch doctor types
    const { data: doctorTypesData } = useQuery({
        queryKey: ["doctor-types"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor-type?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctor types");
            return res.json();
        },
        enabled: !!token,
    });

    const doctorTypes = doctorTypesData?.data?.items || doctorTypesData?.data || [];

    const { data, isFetching } = useQuery({
        queryKey: ["doctor", page, limit, search, doctorType],

        queryFn: async () => {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/doctor?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${doctorType ? `&doctor_type=${encodeURIComponent(doctorType)}` : ''}`;
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
                icon: Stethoscope,
                grad: "from-blue-500 to-indigo-500",
            },
            {
                label: "Specialties",
                value: totalSpecialties,
                icon: Award,
                grad: "from-purple-500 to-indigo-500",
            },
            {
                label: "Countries",
                value: totalCountries,
                icon: Globe,
                grad: "from-emerald-500 to-teal-500",
            },
            {
                label: "Cities",
                value: totalCities,
                icon: MapPin,
                grad: "from-amber-500 to-orange-500",
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
                btn.style.backgroundColor = '#10B981';
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
            const doctorTypesStr = btn.dataset.doctorTypes || '-';
            const country = btn.dataset.country || '-';
            const city = btn.dataset.city || '-';
            const phone = btn.dataset.phone || '-';
            const mobile = btn.dataset.mobile || '-';
            const email = btn.dataset.email || '-';
            const referredPatientsOutdoor = btn.dataset.referredPatientsOutdoor || '0';
            const referredPatientsIndoor = btn.dataset.referredPatientsIndoor || '0';
            const createdBy = btn.dataset.createdBy || '-';

            // Create card HTML
            const cardContainer = document.createElement('div');
            cardContainer.className = 'max-w-3xl mx-auto my-4';
            cardContainer.innerHTML = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Doctor Information</h2>
                        <p class="text-teal-100 text-sm">Detailed overview of selected doctor</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">

                            <li class="flex flex-col">
                                <span class="text-gray-500">Doctor ID</span>
                                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">${doctorId}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Name</span>
                                <span class="font-semibold text-gray-800 text-base">${name}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Title</span>
                                <span class="font-medium text-gray-700">${title}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Qualification</span>
                                <span class="font-medium text-gray-700">${qualification}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Speciality</span>
                                <span class="px-3 py-1 w-fit text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                    ${speciality}
                                </span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Doctor Types</span>
                                <span class="font-medium text-gray-700">${doctorTypesStr}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Location</span>
                                <span class="font-medium text-gray-700">${city}, ${country}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Phone</span>
                                <span class="font-medium text-gray-700">${phone}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Mobile</span>
                                <span class="font-medium text-gray-700">${mobile}</span>
                            </li>

                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Email</span>
                                <span class="font-medium text-blue-600">${email}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Referred Patients (Outdoor)</span>
                                <span class="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs w-fit mt-1">${referredPatientsOutdoor}</span>
                            </li>
                            
                            <li class="flex flex-col">
                                <span class="text-gray-500">Referred Patients (Indoor)</span>
                                <span class="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs w-fit mt-1">${referredPatientsIndoor}</span>
                            </li>

                            <li class="flex flex-col">
                                <span class="text-gray-500">Created By</span>
                                <span class="font-medium text-gray-700">${createdBy}</span>
                            </li>

                        </ul>

                        <!-- Actions -->
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <a href="/dashboard/outdoor/master/doctors/${id}"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition h-10 px-5">
                                View
                            </a>

                            <a href="/dashboard/outdoor/master/doctors/${id}/edit"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition h-10 px-5 shadow">
                                Edit
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Create new row
            const newRow = document.createElement('tr');
            newRow.className = 'child-row-detail';
            const cell = document.createElement('td');
            cell.className = 'p-4 bg-muted/50';
            cell.colSpan = 12;
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


    //console.log(data?.data);

    // Define columns with access to settings for formatted ID
    const columns = [
        {
            data: "id",
            title: "Doctor ID",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: DoctorItem) => {
                // Format the doctor ID for display with hardcoded DOC- prefix
                let formattedId = '';
                if (row.doctor_id) {
                    formattedId = row.doctor_id.toString().startsWith('DOC-') ? row.doctor_id : `DOC-${row.doctor_id}`;
                } else {
                    const sequence = row.sequence || parseInt(String(row.id).replace(/\D/g, '')) || 0;
                    formattedId = `DOC-${sequence}`;
                }

                // Resolve doctor types
                let typesStr = '-';
                if (row.doctor_type_ids) {
                    const ids = (typeof row.doctor_type_ids === 'string'
                        ? row.doctor_type_ids.split(',')
                        : Array.isArray(row.doctor_type_ids)
                        ? row.doctor_type_ids.map(String)
                        : []
                    ).map((id: string) => id.trim()).filter(Boolean);

                    const names = ids.map((id: string) => {
                        const matched = doctorTypes.find((t: any) => String(t.id) === id);
                        return matched ? matched.name : null;
                    }).filter(Boolean);
                    if (names.length > 0) {
                        typesStr = names.join(', ');
                    }
                }

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${row.id}"
                                data-doctor-id="${formattedId.replace(/"/g, '&quot;')}"
                                data-name="${(row.doctor_name || '-').replace(/"/g, '&quot;')}"
                                data-title="${(row.title || '-').replace(/"/g, '&quot;')}"
                                data-qualification="${(row.qualification || '-').replace(/"/g, '&quot;')}"
                                data-speciality="${(row.speciality || '-').replace(/"/g, '&quot;')}"
                                data-doctor-types="${typesStr.replace(/"/g, '&quot;')}"
                                data-country="${(row.country || '-').replace(/"/g, '&quot;')}"
                                data-city="${(row.city || '-').replace(/"/g, '&quot;')}"
                                data-phone="${(row.phone || '-').replace(/"/g, '&quot;')}"
                                data-mobile="${(row.mobile || '-').replace(/"/g, '&quot;')}"
                                data-email="${(row.email || '-').replace(/"/g, '&quot;')}"
                                data-referred-patients-outdoor="${row.referred_patients_outdoor || 0}"
                                data-referred-patients-indoor="${row.referred_patients_indoor || 0}"
                                data-created-by="${String(row.created_by_name || row.created_by || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${formattedId}</span>
                    </div>
                `;
            },
            defaultContent: "",
        },
        {
            data: "image",
            title: "Profile Image",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: DoctorItem) => {
                if (row.image) {
                    const imageUrl = row.image.startsWith('http') 
                        ? row.image 
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${row.image.startsWith('/') ? '' : '/'}${row.image}`;
                    return `<img src="${imageUrl}" alt="${row.doctor_name}" class="w-10 h-10 rounded-full object-cover border border-gray-200" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(row.doctor_name || 'Dr')}&background=random'" />`;
                }
                return `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(row.doctor_name || 'Dr')}&background=random" alt="${row.doctor_name}" class="w-10 h-10 rounded-full object-cover border border-gray-200" />`;
            },
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
            data: "doctor_name",
            title: "Doctor's Name",
            orderable: true,
            responsivePriority: 1,
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
            data: "doctor_type_ids",
            title: "Types",
            orderable: false,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: DoctorItem) => {
                if (!row.doctor_type_ids) return `<span class="text-sm text-muted-foreground">-</span>`;
                const ids = (typeof row.doctor_type_ids === 'string'
                    ? row.doctor_type_ids.split(',')
                    : Array.isArray(row.doctor_type_ids)
                    ? row.doctor_type_ids.map(String)
                    : []
                ).map((id: string) => id.trim()).filter(Boolean);

                const names = ids.map((id: string) => {
                    const matched = doctorTypes.find((t: any) => String(t.id) === id);
                    return matched ? matched.name : null;
                }).filter(Boolean);

                if (names.length === 0) return `<span class="text-sm text-muted-foreground">-</span>`;

                return names.map((name: string) => `
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        ${name}
                    </span>
                `).join(' ');
            },
            defaultContent: "-",
        },
        {
            data: "experience",
            title: "Experience (Years)",
            orderable: true,
            responsivePriority: 4,
            render: (data: any, type: string, row: DoctorItem) => {
                if (row.experience === undefined || row.experience === null) return '-';
                
                let calculatedExperience = row.experience;
                if (row.created_at) {
                    const createdDate = new Date(row.created_at);
                    if (!isNaN(createdDate.getTime())) {
                        const now = new Date();
                        let yearsElapsed = now.getFullYear() - createdDate.getFullYear();
                        
                        const monthDiff = now.getMonth() - createdDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < createdDate.getDate())) {
                            yearsElapsed--;
                        }
                        
                        if (yearsElapsed > 0) {
                            calculatedExperience += yearsElapsed;
                        }
                    }
                }
                
                return `${calculatedExperience} Yrs`;
            },
            defaultContent: "-",
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
            data: "referred_patients_outdoor",
            title: "Referred Patients (Outdoor)",
            orderable: true,
            responsivePriority: 6,
            render: (_data: any, _type: string, row: DoctorItem) => {
                return `<span class="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">${row.referred_patients_outdoor || 0}</span>`;
            },
            defaultContent: "0",
        },
        {
            data: "referred_patients_indoor",
            title: "Referred Patients (Indoor)",
            orderable: true,
            responsivePriority: 6,
            render: (_data: any, _type: string, row: DoctorItem) => {
                return `<span class="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">${row.referred_patients_indoor || 0}</span>`;
            },
            defaultContent: "0",
        },
        {
            data: "created_by",
            title: "Created By",
            orderable: true,
            responsivePriority: 7,
            render: (_data: any, _type: string, row: DoctorItem) => {
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
            render: (_data: any, _type: string, row: DoctorItem) => {
                return `
                    <div class="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                        <a href="/dashboard/outdoor/master/doctors/${row.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                        </a>
                        <a href="/dashboard/outdoor/master/doctors/${row.id}/edit" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                        </a>
                        <button onclick="window.deleteDoctor('${row.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
                        </button>
                    </div>
                `;
            },
            defaultContent: "",
        },
    ];
    return <>
        <AppHeader fixed />

        <Main>
            <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                            <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-white rounded-lg shadow-lg">
                                        <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                                    </div>
                                    <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <h3 className="text-2xl font-bold">{card.value || 0}</h3>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

              {/* Header & Table */}
             <PageHeader
                title="List of Doctor"
                actions={
                    <Link to="/dashboard/outdoor/master/doctors/create">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Add Doctor
                        </Button>
                    </Link>
                }
            />

            <DataTable
                columns={columns}
                data={doctorsData}
                meta={doctorsMeta}
                onPageChange={setPage}
                onLimitChange={setLimit}
                search={search}
                onSearchChange={setSearch}
                isLoading={isFetching}
                hideExport
                filterSlot={
                    <Select
                        value={doctorType || 'all'}
                        onValueChange={(val) => setDoctorType(val === 'all' ? '' : val)}
                    >
                        <SelectTrigger size="sm" className="h-9 w-[180px]">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {doctorTypes.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />

            </div>
        </Main>
    </>
}
