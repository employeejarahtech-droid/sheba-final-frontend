import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle, DollarSign, X } from 'lucide-react'

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
    doctor?: { doctor_name: string }
    finalBill?: { total_discounted_amount: number; paid_amount: number; due_amount: number }
    bills_distributed?: number
    bills_distributed_date?: string | null
    balance_distributed?: number
}

export function BillsDistributedListPage() {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')

    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'bills_distributed', page, limit, search, statusFilter, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
                ...(paymentFilter && paymentFilter !== 'all' && { payment_status: paymentFilter }),
            })
            const res = await fetch(`${API_URL}/api/admission?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    const allAdmissions = allAdmissionsData?.data?.items || []
    const admissions = allAdmissions.filter((a: any) =>
        a.bills_distributed === 1 &&
        a.balance_distributed === 0
    )

    const meta = { page, limit, total: admissions.length }

    const columns = useMemo(() => [
        { data: "id", title: "ID", orderable: true },
        { data: "patient_name", title: "Patient Name", orderable: true },
        { data: "phone", title: "Phone" },
        {
            data: "doctor",
            title: "Doctor",
            render: (_: any, __: any, row: AdmissionItem) => row.doctor?.doctor_name || '-'
        },
        {
            data: "admission_date",
            title: "Admission Date",
            render: (data: any) => new Date(data).toLocaleDateString()
        },
        {
            data: "distribution_date",
            title: "Distribution Date",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.bills_distributed_date ? new Date(row.bills_distributed_date).toLocaleDateString() : '-'
        },
        {
            data: "bill_amount",
            title: "Total Bill",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.finalBill ? format(parseFloat(row.finalBill.total_discounted_amount)) : '-'
        },
        {
            data: "actions",
            title: "Actions",
            render: (_: any, __: any, row: AdmissionItem) => `
                <button onclick="window.location.href='/admission/patients/${row.id}'"
                        class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
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
                    title="Bills Distributed List"
                    description="Patients whose bills have been distributed"
                    backTo="/admission/patients"
                    backLabel="Back to Patients"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium">Distributed Bills</p>
                                <p className="text-3xl font-bold">{meta.total}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Pending Balance Distribution</p>
                                <p className="text-3xl font-bold">{admissions.filter((a: any) => !a.balance_distributed).length}</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-white opacity-90" />
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
