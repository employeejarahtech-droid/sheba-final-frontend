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

interface BillsDistributedListPageProps {
    page?: number;
    limit?: number;
    search?: string;
    statusFilter?: string;
    paymentFilter?: string;
    setPage?: (page: number) => void;
    setLimit?: (limit: number) => void;
    setSearch?: (search: string) => void;
    setStatusFilter?: (status: string) => void;
    setPaymentFilter?: (payment: string) => void;
}

export function BillsDistributedListPage({
    page: propPage,
    limit: propLimit,
    search: propSearch,
    statusFilter: propStatusFilter,
    paymentFilter: propPaymentFilter,
    setPage: propSetPage,
    setLimit: propSetLimit,
    setSearch: propSetSearch,
    setStatusFilter: propSetStatusFilter,
    setPaymentFilter: propSetPaymentFilter,
}: BillsDistributedListPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()

    // Support local state fallback or driven by props
    const [localPage, localSetPage] = useState(1);
    const [localLimit, localSetLimit] = useState(10);
    const [localSearch, localSetSearch] = useState('');
    const [localStatusFilter, localSetStatusFilter] = useState('all');
    const [localPaymentFilter, localSetPaymentFilter] = useState('all');

    const page = propPage !== undefined ? propPage : localPage;
    const limit = propLimit !== undefined ? propLimit : localLimit;
    const search = propSearch !== undefined ? propSearch : localSearch;
    const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
    const paymentFilter = propPaymentFilter !== undefined ? propPaymentFilter : localPaymentFilter;

    const setPage = propSetPage || localSetPage;
    const setLimit = propSetLimit || localSetLimit;
    const setSearch = propSetSearch || localSetSearch;
    const setStatusFilter = propSetStatusFilter || localSetStatusFilter;
    const setPaymentFilter = propSetPaymentFilter || localSetPaymentFilter;

    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'bills_distributed_partial', page, limit, search, statusFilter, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                status: statusFilter,
                payment_status: paymentFilter,
                bills_distributed: '1',
                balance_distributed: '0',
            })
            const res = await fetch(`${API_URL}/api/admission/discharged?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    const admissions = allAdmissionsData?.data?.items || []
    const meta = allAdmissionsData?.data?.meta || {
        page,
        limit,
        total: admissions.length,
    }

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
            orderable: false,
            render: (_: any, __: any, row: AdmissionItem) => {
                const dueAmount = row.finalBill?.due_amount ? Number(row.finalBill.due_amount) : 0
                const hasOverpayment = dueAmount < 0

                let buttons = `
                    <button onclick="window.location.href='/dashboard/admission/patients/${row.id}'"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                    </button>
                    <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/billing'"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                        Billing
                    </button>
                `

                if (row.bills_distributed === 0) {
                    buttons += `
                        <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/distribute-bill'"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Distribute
                        </button>
                    `
                }

                if (hasOverpayment) {
                    buttons += `
                        <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/billing'"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
                            Refund
                        </button>
                    `
                }

                buttons += `
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/print', '_blank')"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded transition shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                        Admission Paper
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/billing-print', '_blank')"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded transition shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                        Bill Print
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/final-bill-print', '_blank')"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M15 16H8"/></svg>
                        Final Bill Print
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/print/discharged', '_blank')"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded transition shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
                        Discharge Paper Print
                    </button>
                `

                return `<div class="flex flex-wrap items-center gap-2 w-[500px]">${buttons}</div>`
            }
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
                    onLimitChange={setLimit}
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
