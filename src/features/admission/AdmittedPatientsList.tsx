import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { Users, Activity, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { getCookie } from '@/lib/cookies'

const API_URL = import.meta.env.VITE_API_URL

type AdmissionItem = {
    id: number
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

export function AdmittedPatientsList() {
    const searchParams: any = useSearch({ strict: false })
    const navigate = useNavigate()

    const page = Number(searchParams?.page) || 1
    const limit = Number(searchParams?.limit) || 10
    const search = searchParams?.search || ""

    const setPage = (newPage: number) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, page: newPage }),
        })
    }

    const setLimit = (newLimit: number) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }),
        })
    }

    const setSearch = (newSearch: string) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }),
        })
    }

    const token = getCookie('accessToken')

    // Fetch statistics
    const { data: statsData } = useQuery({
        queryKey: ['admission-statistics'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/admission/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                console.error('Statistics API Error:', response.status, await response.text())
                throw new Error('Failed to fetch statistics')
            }
            return response.json()
        },
    })

    // Fetch admissions list
    const { data: admissionsData, isFetching } = useQuery({
        queryKey: ['admissions', page, limit, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
            })
            const response = await fetch(`${API_URL}/api/admission?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                console.error('Admissions API Error:', response.status, await response.text())
                throw new Error('Failed to fetch admissions')
            }
            return response.json()
        },
    })

    const stats = statsData?.data || { total: 0, active: 0, discharged: 0, critical: 0 }
    const admissions = admissionsData?.data || []
    const meta = {
        page,
        limit,
        total: admissionsData?.pagination?.total || 0,
    }

    // Calculate stats for cards
    const statsCards = useMemo(() => [
        {
            label: "Total Admitted",
            value: stats.total,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <Users className="w-6 h-6 text-white" />,
        },
        {
            label: "Active Patients",
            value: stats.active,
            gradient: "from-green-600 to-green-400",
            shadow: "shadow-green-500/30",
            icon: <Activity className="w-6 h-6 text-white" />,
        },
        {
            label: "Discharged",
            value: stats.discharged,
            gradient: "from-gray-600 to-gray-400",
            shadow: "shadow-gray-500/30",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
        },
        {
            label: "Critical Cases",
            value: stats.critical,
            gradient: "from-red-600 to-red-400",
            shadow: "shadow-red-500/30",
            icon: <AlertCircle className="w-6 h-6 text-white" />,
        },
    ], [stats])

    const columns = useMemo(() => [
        {
            data: null,
            title: "SL",
            orderable: false,
            responsivePriority: 3,
            render: (_data: any, _type: string, _row: AdmissionItem, meta: any) => {
                return (page - 1) * limit + meta.row + 1
            },
            defaultContent: "",
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
                return new Date(data).toLocaleDateString()
            },
            defaultContent: "",
        },
        {
            data: null,
            title: "Status",
            orderable: true,
            responsivePriority: 2,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                const statusColors: Record<string, string> = {
                    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    discharged: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                }
                return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[row.status] || statusColors.active}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>`
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
                    <button
                        onclick="window.location.href='/admission/patients/${row.id}/billing'"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Add Billing
                    </button>
                `;
            },
            defaultContent: "",
        },
    ], [page, limit])

    return (
        <>
            <Header>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="p-6 lg:p-10 w-full flex-1 dark:bg-black/20">
                <div className="space-y-6 mx-auto">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Admitted Patients
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage and monitor all admitted patients
                            </p>
                        </div>
                        <Button
                            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40"
                            onClick={() => window.location.href = '/admission/new-admission'}
                        >
                            <UserPlus className="h-5 w-5" />
                            <span>New Admission</span>
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statsCards.map((item, idx) => (
                            <div
                                key={idx}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                            >
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

                                <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                                    <div className="h-full w-2/3 rounded-full bg-white/40" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DataTable */}
                    <DataTable
                        columns={columns}
                        data={admissions}
                        meta={meta}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        search={search}
                        isLoading={isFetching}
                        onSearchChange={setSearch}
                    />
                </div>
            </Main>
        </>
    )
}
