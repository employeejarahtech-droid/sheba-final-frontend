import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Users, FileText } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { getCookie } from '@/lib/cookies'

const API_URL = import.meta.env.VITE_API_URL

type AdmissionItem = {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    sex: string
    phone: string
    admission_date: string
    discharge_date: string | null
    status: 'active' | 'discharged' | 'critical'
    bed_cabin_id: number | null
    doctor_id: number | null
    diagnosis: string | null
    created_at: string
    created_by?: string | number | null
    created_by_user?: {
        id: number
        name: string
        email?: string
    }
    bill_created?: number
    bedCabin?: {
        id: number
        code: string
        type: string
        ward: string
    }
    doctor?: {
        id: number
        doctor_name: string
        speciality: string
    }
}

export function BillNotCreatedListPage() {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState('')

    const { data: admissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'bill-not-created', page, limit, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
            })
            const res = await fetch(`${API_URL}/api/admission/bill-not-created?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    const admissions = admissionsData?.data || []
    const meta = admissionsData?.pagination || { page, limit, total: 0 }

    const columns = useMemo(() => [
        {
            data: "admission_prefix",
            title: "Custom ID",
            orderable: true,
            responsivePriority: 1,
            render: (data: any, _type: string, row: AdmissionItem) => {
                const displayId = data || row.id;
                const admissionDate = row.admission_date ? new Date(row.admission_date).toLocaleDateString() : '-';
                const dischargeDate = row.discharge_date ? new Date(row.discharge_date).toLocaleDateString() : '-';
                const bedCabinInfo = row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-';
                const doctorName = row.doctor?.doctor_name || '-';

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${row.id}"
                                data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                                data-age="${row.age || 0}"
                                data-sex="${row.sex || '-'}"
                                data-phone="${row.phone || '-'}"
                                data-admission-date="${admissionDate}"
                                data-discharge-date="${dischargeDate}"
                                data-bed-cabin="${bedCabinInfo.replace(/"/g, '&quot;')}"
                                data-doctor="${doctorName.replace(/"/g, '&quot;')}"
                                data-diagnosis="${(row.diagnosis || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${(row.created_by_user?.name || '-').replace(/"/g, '&quot;')}">+</button>
                        <span class="font-semibold text-blue-600">${displayId}</span>
                    </div>
                `;
            },
            defaultContent: "-",
        },
        {
            data: "patient_name",
            title: "Patient Name",
            orderable: true,
            responsivePriority: 1,
            defaultContent: "",
        },
        {
            data: null,
            title: "Age/Sex",
            orderable: true,
            responsivePriority: 4,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.age && row.sex ? `${row.age}/${row.sex.charAt(0).toUpperCase()}` : '-'
            },
            defaultContent: "",
        },
        {
            data: "phone",
            title: "Phone",
            orderable: true,
            responsivePriority: 5,
            defaultContent: "-",
        },
        {
            data: "admission_date",
            title: "Admission Date",
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => {
                if (!data) return '-';
                return new Date(data).toLocaleDateString()
            },
            defaultContent: "",
        },
        {
            data: "discharge_date",
            title: "Discharge Date",
            orderable: true,
            responsivePriority: 2,
            render: (data: any) => {
                if (!data) return '-';
                return new Date(data).toLocaleDateString()
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Bed/Cabin",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-'
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Doctor",
            orderable: true,
            responsivePriority: 4,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.doctor?.doctor_name || '-'
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Actions",
            orderable: false,
            responsivePriority: 1,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return `
                    <a href="/dashboard/admission/patients/${row.id}/billing"
                       class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 no-underline">
                        Add Billing
                    </a>
                `;
            },
            defaultContent: "",
        },
    ], [page, limit])

    // Handle expand button clicks
    useEffect(() => {
        const handleExpandClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.expand-btn')
            if (!button) return

            const btn = button as HTMLButtonElement
            const row = btn.closest('tr')
            if (!row) return

            const isExpanded = row.classList.contains('expanded')
            const nextRow = row.nextElementSibling

            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove()
                row.classList.remove('expanded')
                btn.textContent = '+'
                btn.style.backgroundColor = 'black'
                return
            }

            if (isExpanded) return

            const id = btn.dataset.id || ''
            const patientName = btn.dataset.patientName || '-'
            const age = btn.dataset.age || '-'
            const sex = btn.dataset.sex || '-'
            const phone = btn.dataset.phone || '-'
            const admissionDate = btn.dataset.admissionDate || '-'
            const dischargeDate = btn.dataset.dischargeDate || '-'
            const bedCabin = btn.dataset.bedCabin || '-'
            const doctor = btn.dataset.doctor || '-'
            const diagnosis = btn.dataset.diagnosis || '-'
            const createdBy = btn.dataset.createdBy || '-'

            const detailsHtml = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                        <h2 class="text-lg font-semibold text-white">Bill Not Created - Patient Details</h2>
                        <p class="text-orange-100 text-sm">Admission #${id} - ${patientName}</p>
                    </div>
                    <div class="p-6">
                        <ul class="grid md:grid-cols-2 gap-6 text-sm">
                            <li class="flex flex-col">
                                <span class="text-gray-500">Patient Name</span>
                                <span class="font-semibold text-gray-800 text-base">${patientName}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Age / Sex</span>
                                <span class="font-medium text-gray-700">${age} / ${sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase()}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Phone</span>
                                <span class="font-medium text-gray-700">${phone}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Doctor</span>
                                <span class="font-medium text-gray-700">${doctor}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Bed/Cabin</span>
                                <span class="font-medium text-gray-700">${bedCabin}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Diagnosis</span>
                                <span class="font-medium text-gray-700">${diagnosis}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Admission Date</span>
                                <span class="font-medium text-gray-700">${admissionDate}</span>
                            </li>
                            <li class="flex flex-col">
                                <span class="text-gray-500">Discharge Date</span>
                                <span class="font-medium text-gray-700">${dischargeDate}</span>
                            </li>
                            <li class="flex flex-col md:col-span-2">
                                <span class="text-gray-500">Admitted By</span>
                                <span class="font-medium text-gray-700">${createdBy}</span>
                            </li>
                        </ul>
                        <div class="mt-8 flex justify-end gap-3 border-t pt-5">
                            <a href="/dashboard/admission/patients/${id}/billing"
                               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition h-10 px-5 shadow no-underline">
                                Add Billing
                            </a>
                        </div>
                    </div>
                </div>
            `

            const details = document.createElement('div')
            details.innerHTML = detailsHtml

            const newRow = document.createElement('tr')
            newRow.className = 'child-row-detail'
            const cell = document.createElement('td')
            cell.className = 'p-4 bg-muted/50'
            cell.colSpan = 10
            cell.appendChild(details)
            newRow.appendChild(cell)

            row.parentNode?.insertBefore(newRow, row.nextSibling)
            row.classList.add('expanded')
            btn.textContent = '−'
            btn.style.backgroundColor = '#dc2626'
        }

        document.addEventListener('click', handleExpandClick)
        return () => { document.removeEventListener('click', handleExpandClick) }
    }, [])

    return (
        <>
            <AppHeader fixed />
            <Main fluid className="p-4 w-full flex-1 dark:bg-black/20">
                <div className="space-y-4 mx-auto">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Bill Not Created
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Discharged patients whose bills have not been created yet
                            </p>
                        </div>
                    </div>
                    <DataTable
                        columns={columns}
                        data={admissions}
                        meta={meta}
                        onPageChange={setPage}
                        onLimitChange={(newLimit) => {
                            setLimit(newLimit)
                            setPage(1)
                        }}
                        search={search}
                        isLoading={isFetching}
                        onSearchChange={setSearch}
                    />
                </div>
            </Main>
        </>
    )
}
