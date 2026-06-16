import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Users, CheckCircle, DollarSign, Eye, CreditCard, X } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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
    finalBill?: {
        id: number
        total_bill_amount: number
        total_discount: number
        total_discounted_amount: number
        paid_amount: number
        due_amount: number
        status: 'pending' | 'partial' | 'paid' | 'cancelled'
    }
    // Status tracking
    payment_completed?: number
    payment_completed_date?: string | null
    payment_completed_by_user?: {
        id: number
        name: string
    }
    bills_distributed?: number
    balance_distributed?: number
}

interface PaymentCompletedListPageProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export function PaymentCompletedListPage({ page, limit, search, setPage, setSearch }: PaymentCompletedListPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')

    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'payment_completed', page, limit, search, statusFilter, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
                ...(paymentFilter && paymentFilter !== 'all' && { payment_status: paymentFilter }),
            })
            const res = await fetch(`${API_URL}/api/admission/payment-completed?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch payment completed admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    // Fetch statistics for all-time totals
    const { data: statsData } = useQuery({
        queryKey: ['admissions', 'payment_completed', 'stats'],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: '10000',
            })
            const res = await fetch(`${API_URL}/api/admission/payment-completed?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch statistics')
            return await res.json()
        },
        enabled: !!token,
    })

    const admissions = allAdmissionsData?.data?.items || []
    const allAdmissions = statsData?.data?.items || []
    const total = allAdmissionsData?.data?.meta?.total || allAdmissionsData?.data?.pagination?.total || 0
    const meta = { page, limit, total }

    const columns = useMemo(() => [
        { data: "id", title: "ID", orderable: true, responsivePriority: 1 },
        { data: "patient_name", title: "Patient Name", orderable: true, responsivePriority: 2 },
        { data: "phone", title: "Phone", orderable: false, responsivePriority: 3 },
        {
            data: "doctor",
            title: "Doctor",
            orderable: false,
            responsivePriority: 4,
            render: (_: any, __: any, row: AdmissionItem) => row.doctor?.doctor_name || '-'
        },
        {
            data: "admission_date",
            title: "Admission Date",
            orderable: true,
            responsivePriority: 5,
            render: (data: any) => new Date(data).toLocaleDateString()
        },
        {
            data: "payment_date",
            title: "Payment Date",
            orderable: true,
            responsivePriority: 6,
            render: (_: any, __: any, row: AdmissionItem) =>
                row.payment_completed_date ? new Date(row.payment_completed_date).toLocaleDateString() : '-'
        },
        {
            data: "final_bill_amount",
            title: "Final Bill Amount",
            orderable: false,
            responsivePriority: 7,
            render: (_: any, __: any, row: AdmissionItem) => {
                if (row.finalBill?.total_discounted_amount) {
                    return format(parseFloat(row.finalBill.total_discounted_amount))
                }
                return '<span class="text-gray-400">-</span>'
            },
        },
        {
            data: "paid_amount",
            title: "Paid Amount",
            orderable: false,
            responsivePriority: 8,
            render: (_: any, __: any, row: AdmissionItem) => {
                if (row.finalBill?.paid_amount) {
                    const paidAmount = parseFloat(row.finalBill.paid_amount)
                    return `<span class="text-green-600 font-semibold">${format(paidAmount)}</span>`
                }
                return '<span class="text-gray-400">-</span>'
            },
        },
        {
            data: "due_amount",
            title: "Due Amount",
            orderable: false,
            responsivePriority: 9,
            render: (_: any, __: any, row: AdmissionItem) => {
                if (row.finalBill?.due_amount) {
                    const dueAmount = parseFloat(row.finalBill.due_amount)
                    if (dueAmount > 0) {
                        return `<span class="text-red-600 font-semibold">${format(dueAmount)}</span>`
                    } else if (dueAmount < 0) {
                        return `<span class="text-orange-600 font-semibold">${format(Math.abs(dueAmount))} (Overpaid)</span>`
                    } else {
                        return `<span class="text-green-600 font-semibold">${format(0)}</span>`
                    }
                }
                return '<span class="text-gray-400">-</span>'
            },
        },
        {
            data: "actions",
            title: "Actions",
            orderable: false,
            responsivePriority: 10,
            render: (_: any, __: any, row: AdmissionItem) => `
                <button onclick="window.location.href='/dashboard/admission/patients/${row.id}'"
                        class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                </button>
            `
        },
    ], [])

    return (
        <>
            <AppHeader />
            <Main fluid>
                <div className="flex-1 space-y-8 px-4 py-6 overflow-auto w-full">
                <PageHeader
                    title="Payment Completed List"
                    description="Patients with completed payments"
                    backTo="/admission/patients"
                    backLabel="Back to Patients"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Completed</p>
                                <p className="text-3xl font-bold">{total}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Collected</p>
                                <p className="text-3xl font-bold">{format(allAdmissions.reduce((sum: number, a: any) => sum + (a.finalBill?.paid_amount || 0), 0))}</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Pending Distribution</p>
                                <p className="text-3xl font-bold">{allAdmissions.filter((a: any) => !a.bills_distributed).length}</p>
                            </div>
                            <Users className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={admissions}
                    isLoading={isFetching}
                    meta={meta}
                    onPageChange={setPage}
                    search={search}
                    onSearchChange={setSearch}
                    filterSlot={
                        <div className="flex items-center gap-3">
                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Label className="text-sm whitespace-nowrap">Status:</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 w-[140px]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="discharged">Discharged</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Status Filter */}
                            <div className="flex items-center gap-2">
                                <Label className="text-sm whitespace-nowrap">Payment:</Label>
                                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                    <SelectTrigger className="h-8 w-[140px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="has_due">Has Due</SelectItem>
                                        <SelectItem value="fully_paid">Fully Paid</SelectItem>
                                        <SelectItem value="overpaid">Overpaid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters */}
                            {(statusFilter !== 'all' || paymentFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => {
                                        setStatusFilter('all')
                                        setPaymentFilter('all')
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    }
                />
            </div>
        </Main>
        </>
    )
}
