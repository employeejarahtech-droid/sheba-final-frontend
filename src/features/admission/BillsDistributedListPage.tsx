import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle, DollarSign, X } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    finalBill?: { 
        total_bill_amount: number; 
        total_discount: number; 
        total_discounted_amount: number; 
        paid_amount: number; 
        due_amount: number 
    }
    bills_distributed?: number
    bills_distributed_date?: string | null
    balance_distributed?: number
    total_distributed?: number
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
        {
            data: "id",
            title: "ID",
            orderable: true,
            render: (_data: any, _type: string, row: AdmissionItem) =>
                `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${row.id}</span>`
        },
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
            title: "Bill",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.finalBill ? format(Number(row.finalBill.total_bill_amount)) : '-'
        },
        {
            data: "discount",
            title: "Discount",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.finalBill ? format(Number(row.finalBill.total_discount)) : '-'
        },
        {
            data: "final_bill",
            title: "Final Bill",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.finalBill ? format(Number(row.finalBill.total_discounted_amount)) : '-'
        },
        {
            data: "distributed_amount",
            title: "Distributed Amount",
            render: (_: any, __: any, row: AdmissionItem) =>
                row.total_distributed !== undefined ? format(Number(row.total_distributed)) : '-'
        },
        {
            data: "actions",
            title: "Actions",
            render: (_: any, __: any, row: AdmissionItem) => `
                <button onclick="window.location.href='/dashboard/admission/patients/${row.id}'"
                        class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    View
                </button>
            `
        },
    ], [])

    const statsCards = useMemo(() => [
        {
            label: 'Distributed Bills',
            value: meta.total,
            icon: CheckCircle,
            grad: 'from-indigo-500 to-purple-500',
        },
        {
            label: 'Pending Balance Distribution',
            value: admissions.filter((a: any) => !a.balance_distributed).length,
            icon: DollarSign,
            grad: 'from-orange-500 to-amber-500',
        },
    ], [meta.total, admissions])

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {statsCards.map((card, index) => {
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
                                    <h3 className="text-2xl font-bold">{card.value}</h3>
                                </CardContent>
                            </Card>
                        );
                    })}
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
