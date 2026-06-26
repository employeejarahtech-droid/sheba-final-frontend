import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle, FileText, DollarSign, CreditCard, X } from 'lucide-react'

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

const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return timeStr;
};

type AdmissionItem = {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    sex: string
    phone: string
    admission_date: string
    admission_time?: string | null
    discharge_date: string | null
    discharge_time?: string | null
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
    // Status tracking fields
    bill_created?: number
    bill_created_date?: string | null
    bill_created_by?: number | null
    final_bill_created?: number
    final_bill_created_date?: string | null
    final_bill_created_by?: number | null
    discharged?: number
    discharged_date?: string | null
    discharged_by?: number | null
    payment_completed?: number
    payment_completed_date?: string | null
    payment_completed_by?: number | null
    bills_distributed?: number
    bills_distributed_date?: string | null
    bills_distributed_by?: number | null
    balance_distributed?: number
    balance_distributed_date?: string | null
    balance_distributed_by?: number | null
    // User references
    bill_created_by_user?: {
        id: number
        name: string
        email?: string
    }
    final_bill_created_by_user?: {
        id: number
        name: string
        email?: string
    }
    discharged_by_user?: {
        id: number
        name: string
        email?: string
    }
    payment_completed_by_user?: {
        id: number
        name: string
        email?: string
    }
    bills_distributed_by_user?: {
        id: number
        name: string
        email?: string
    }
    balance_distributed_by_user?: {
        id: number
        name: string
        email?: string
    }
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
        payment_count: number
    }
}

interface DischargedPatientListPageProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
    /** Lock the page to a specific payment status (hides the Payment dropdown). */
    paymentStatus?: 'all' | 'has_due' | 'fully_paid';
    /** Lock the page to a bills_distributed flag (e.g. 0 = not yet distributed). */
    billsDistributed?: number;
}

export function DischargedPatientListPage({ page, limit, search, setPage, setSearch, paymentStatus, billsDistributed }: DischargedPatientListPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>(paymentStatus ?? 'all')

    const pageTitle = billsDistributed === 0
        ? 'Bills Not Distributed'
        : paymentStatus === 'has_due'
            ? 'Discharged — Due'
            : paymentStatus === 'fully_paid'
                ? 'Discharged — Paid'
                : 'Discharged Patient List'
    const pageDescription = billsDistributed === 0
        ? 'Discharged patients whose bills are not yet distributed'
        : paymentStatus === 'has_due'
            ? 'Discharged patients with an outstanding due'
            : paymentStatus === 'fully_paid'
                ? 'Discharged patients who are fully paid'
                : 'Patients who have been discharged'

    // Fetch all admissions and filter by discharged = 1
    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'discharged', page, limit, search, statusFilter, paymentFilter, billsDistributed],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
                ...(paymentFilter && paymentFilter !== 'all' && { payment_status: paymentFilter }),
                ...(billsDistributed !== undefined && { bills_distributed: String(billsDistributed) }),
            })
            const res = await fetch(`${API_URL}/api/admission/discharged?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    // Server-side filtering returns filtered admissions
    const admissions = allAdmissionsData?.data?.items || []
    const meta = allAdmissionsData?.data?.meta || {
        page,
        limit,
        total: admissions.length,
    }

    const columns = useMemo(() => [
        {
            data: "admission_prefix",
            title: "Admission No",
            orderable: true,
            responsivePriority: 1,
            render: (data: any, _type: string, row: AdmissionItem) => {
                // Ensure admission number always has ADM- prefix
                const displayId = data && data.toString().startsWith('ADM-') ? data : (data ? `ADM-${data}` : `ADM-${row.id}`);
                const admissionDate = row.admission_date ? new Date(row.admission_date).toLocaleDateString() : '-';
                const dischargeDate = row.discharge_date ? new Date(row.discharge_date).toLocaleDateString() : '-';
                const bedCabinInfo = row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-';
                const doctorName = row.doctor?.doctor_name || '-';

                const statusData = {
                    bill_created: row.bill_created || 0,
                    bill_created_date: row.bill_created_date || '',
                    bill_created_by_user: row.bill_created_by_user || null,
                    final_bill_created: row.final_bill_created || 0,
                    final_bill_created_date: row.final_bill_created_date || '',
                    final_bill_created_by_user: row.final_bill_created_by_user || null,
                    discharged: row.discharged || 0,
                    discharged_date: row.discharged_date || '',
                    discharged_by_user: row.discharged_by_user || null,
                    payment_completed: row.payment_completed || 0,
                    payment_completed_date: row.payment_completed_date || '',
                    payment_completed_by_user: row.payment_completed_by_user || null,
                    bills_distributed: row.bills_distributed || 0,
                    bills_distributed_date: row.bills_distributed_date || '',
                    bills_distributed_by_user: row.bills_distributed_by_user || null,
                    balance_distributed: row.balance_distributed || 0,
                    balance_distributed_date: row.balance_distributed_date || '',
                    balance_distributed_by_user: row.balance_distributed_by_user || null,
                }

                return `
                    <div class="flex items-center gap-2">
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                                type="button"
                                data-id="${row.id}"
                                data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                                data-age="${row.age || 0}"
                                data-sex="${row.sex || '-'}"
                                data-phone="${row.phone || '-'}"
                                data-admission-date="${admissionDate}"
                                data-discharge-date="${dischargeDate}"
                                data-status="${row.status}"
                                data-bed-cabin="${bedCabinInfo.replace(/"/g, '&quot;')}"
                                data-doctor="${doctorName.replace(/"/g, '&quot;')}"
                                data-diagnosis="${(row.diagnosis || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}"
                                data-final-bill="${row.finalBill ? JSON.stringify(row.finalBill).replace(/"/g, '&quot;') : ''}"
                                data-status-data="${encodeURIComponent(JSON.stringify(statusData)).replace(/"/g, '&quot;')}">+</button>
                        <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${displayId}</span>
                    </div>
                `
            },
        },
        {
            data: "patient_name",
            title: "Patient Name",
            orderable: true,
            responsivePriority: 2,
        },
        {
            data: "phone",
            title: "Phone",
            orderable: false,
            responsivePriority: 3,
        },
        {
            data: "doctor",
            title: "Doctor",
            orderable: false,
            responsivePriority: 4,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.doctor?.doctor_name || '-'
            },
        },
        {
            data: "bed_cabin",
            title: "Bed/Cabin",
            orderable: false,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.bedCabin?.code || '-'
            },
        },
        {
            data: "admission_date",
            title: "Admission Date",
            orderable: true,
            responsivePriority: 6,
            render: (data: any, _type: string, row: AdmissionItem) => {
                if (!data) return '-';
                const datePart = new Date(data).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const timePart = row.admission_time ? formatTime(row.admission_time) : '';
                return timePart ? `${datePart} ${timePart}` : datePart;
            },
        },
        {
            data: "discharge_date",
            title: "Discharge Date",
            orderable: true,
            responsivePriority: 7,
            render: (data: any, _type: string, row: AdmissionItem) => {
                if (!data) return '-';
                const datePart = new Date(data).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const timePart = row.discharge_time ? formatTime(row.discharge_time) : '';
                return timePart ? `${datePart} ${timePart}` : datePart;
            },
        },
        {
            data: "final_bill_amount",
            title: "Final Bill Amount",
            orderable: false,
            responsivePriority: 8,
            render: (_data: any, _type: string, row: AdmissionItem) => {
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
            responsivePriority: 9,
            render: (_data: any, _type: string, row: AdmissionItem) => {
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
            responsivePriority: 10,
            render: (_data: any, _type: string, row: AdmissionItem) => {
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
            responsivePriority: 11,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                const dueAmount = row.finalBill?.due_amount ? parseFloat(row.finalBill.due_amount) : 0
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

                if (billsDistributed === 0) {
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
            },
        },
    ], [])

    // Setup expandable rows (similar to previous pages)
    useEffect(() => {
        const createTimelineItem = (title: string, isCompleted: boolean, date: string | null, completedBy: string | null) => {
            const dotColor = isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            const textColor = isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            const pendingLabel = isCompleted ? '' : ' (Pending)'

            return `
                <div class='relative ml-2' style='margin-left: 0.5rem;'>
                    <div class='absolute -left-[36px] top-1 w-6 h-6 ${dotColor} rounded-full border-4 border-white dark:border-gray-900' style='left: -36px !important;'></div>
                    <h4 class='font-semibold ${textColor}'>${title}${pendingLabel}</h4>
                    ${isCompleted && date ? `
                        <p class='text-xs text-gray-500 dark:text-gray-400'>${date}${completedBy ? ` • ${completedBy}` : ''}</p>
                    ` : ''}
                </div>
            `
        }

        const safeFormatDate = (dateInput: string | Date | null | undefined) => {
            if (!dateInput) return '-'
            if (dateInput === '-') return '-'

            let date: Date
            if (dateInput instanceof Date) {
                date = dateInput
            } else {
                date = new Date(dateInput)
            }

            if (isNaN(date.getTime())) {
                const parts = String(dateInput).split('-')
                if (parts.length === 3) {
                    const [year, month, day] = parts
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    if (isNaN(date.getTime())) {
                        return String(dateInput)
                    }
                } else {
                    return String(dateInput)
                }
            }

            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }

        const handleExpandClick = async (e: MouseEvent) => {
            const btn = e.target as HTMLButtonElement
            if (!btn.classList.contains('expand-btn')) return

            const row = btn.closest('tr') as HTMLTableRowElement
            if (!row) return

            const existingDetails = row.nextElementSibling
            if (existingDetails && existingDetails.classList.contains('child-row-detail')) {
                existingDetails.remove()
                row.classList.remove('expanded')
                btn.textContent = '+'
                btn.style.backgroundColor = '#000'
                return
            }

            const id = btn.dataset.id || ''
            const patientName = btn.dataset.patientName || '-'
            const age = btn.dataset.age || '-'
            const sex = btn.dataset.sex || '-'
            const phone = btn.dataset.phone || '-'
            const admissionDate = btn.dataset.admissionDate || '-'
            const dischargeDate = btn.dataset.dischargeDate || '-'
            const status = btn.dataset.status || '-'
            const bedCabin = btn.dataset.bedCabin || '-'
            const doctor = btn.dataset.doctor || '-'
            const diagnosis = btn.dataset.diagnosis || '-'
            const finalBill = btn.dataset.finalBill ? JSON.parse(btn.dataset.finalBill as string) : null
            const statusData = btn.dataset.statusData ? JSON.parse(decodeURIComponent(btn.dataset.statusData as string)) : {}

            let operationsTotal = 0, consultantsTotal = 0, servicesTotal = 0,
                bedTotal = 0, surgeonsTotal = 0, assistantsTotal = 0

            try {
                const token = getCookie('accessToken')
                const summaryRes = await fetch(`${API_URL}/api/indoor-billing/summary/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json()
                    if (summaryData.status && summaryData.data) {
                        operationsTotal = summaryData.data.operations_total || 0
                        consultantsTotal = summaryData.data.consultants_total || 0
                        servicesTotal = summaryData.data.services_total || 0
                        bedTotal = summaryData.data.bed_charges_total || 0
                        surgeonsTotal = summaryData.data.surgeons_total || 0
                        assistantsTotal = summaryData.data.assistants_total || 0
                    }
                }
            } catch (err) {
                console.error('Failed to fetch billing summary:', err)
            }

            const grandTotal = operationsTotal + consultantsTotal + servicesTotal + bedTotal + surgeonsTotal + assistantsTotal

            const beautifulDetailsHtml = `
                <div class='max-w-6xl mx-auto p-6 space-y-6'>
                    <div class='bg-gradient-to-r from-gray-600 to-gray-500 rounded-2xl p-6 text-white shadow-lg'>
                        <div class='flex justify-between items-center'>
                            <div>
                                <h2 class='text-2xl font-bold'>Admission #${id}</h2>
                                <p class='text-gray-100 text-sm'>${patientName} • ${bedCabin}</p>
                            </div>
                            <span class='px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur'>
                                Discharged
                            </span>
                        </div>
                    </div>

                    <div class='grid lg:grid-cols-3 gap-6'>
                        <div class='lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6'>
                            <div>
                                <h3 class='text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700'>Patient Information</h3>
                                <div class='grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Age/Sex:</span> ${age} / ${sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase()}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Phone:</span> ${phone}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Doctor:</span> ${doctor}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Diagnosis:</span> ${diagnosis}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Admission Date:</span> ${safeFormatDate(admissionDate)}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Discharge Date:</span> ${safeFormatDate(dischargeDate)}</div>
                                </div>
                            </div>

                            <div>
                                <h3 class='text-lg font-semibold mb-6 border-b pb-2 dark:border-gray-700'>Status Timeline</h3>
                                <div class='relative border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-8'>
                                    ${createTimelineItem('Bill Created', statusData.bill_created === 1, safeFormatDate(statusData.bill_created_date || null), statusData.bill_created_by_user?.name || null)}
                                    ${createTimelineItem('Final Bill', statusData.final_bill_created === 1, safeFormatDate(statusData.final_bill_created_date || null), statusData.final_bill_created_by_user?.name || null)}
                                    ${createTimelineItem('Discharged', statusData.discharged === 1, safeFormatDate(statusData.discharged_date || null), statusData.discharged_by_user?.name || null)}
                                    ${createTimelineItem('Payment Completed', statusData.payment_completed === 1, safeFormatDate(statusData.payment_completed_date || null), statusData.payment_completed_by_user?.name || null)}
                                    ${createTimelineItem('Bills Distributed', statusData.bills_distributed === 1, safeFormatDate(statusData.bills_distributed_date || null), statusData.bills_distributed_by_user?.name || null)}
                                    ${createTimelineItem('Balance Distributed', statusData.balance_distributed === 1, safeFormatDate(statusData.balance_distributed_date || null), statusData.balance_distributed_by_user?.name || null)}
                                </div>
                            </div>
                        </div>

                        <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>
                            <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Bill Summary</h3>
                            ${finalBill ? `
                                <div class='space-y-3 text-sm'>
                                    <div class='flex justify-between'>
                                        <span class='text-gray-500 dark:text-gray-400'>Total Amount</span>
                                        <span class='font-semibold'>${format(parseFloat(finalBill.total_discounted_amount))}</span>
                                    </div>
                                    <div class='flex justify-between text-green-600 dark:text-green-400'>
                                        <span>Paid</span>
                                        <span class='font-semibold'>${format(parseFloat(finalBill.paid_amount))}</span>
                                    </div>
                                    <div class='flex justify-between text-red-500'>
                                        <span>Due</span>
                                        <span class='font-semibold'>${format(parseFloat(finalBill.due_amount))}</span>
                                    </div>
                                </div>
                            ` : `
                                <div class='text-center text-gray-500 py-4'>No final bill yet</div>
                            `}
                        </div>
                    </div>
                </div>
            `

            const details = document.createElement('div')
            details.innerHTML = beautifulDetailsHtml

            const newRow = document.createElement('tr')
            newRow.className = 'child-row-detail'
            const cell = document.createElement('td')
            cell.className = 'p-0'
            cell.colSpan = 13
            cell.appendChild(details)
            newRow.appendChild(cell)

            row.parentNode?.insertBefore(newRow, row.nextSibling)
            row.classList.add('expanded')
            btn.textContent = '−'
            btn.style.backgroundColor = '#dc2626'
        }

        document.addEventListener('click', handleExpandClick)

        return () => {
            document.removeEventListener('click', handleExpandClick)
        }
    }, [format, page, limit, search])

    const statsCards = useMemo(() => [
        {
            label: 'Total Discharged',
            value: meta.total,
            icon: CheckCircle,
            grad: 'from-gray-600 to-gray-400',
        },
        {
            label: 'With Final Bill',
            value: admissions.filter((a: any) => a.final_bill_created === 1).length,
            icon: FileText,
            grad: 'from-blue-600 to-blue-400',
        },
        {
            label: 'Payment Completed',
            value: admissions.filter((a: any) => a.payment_completed === 1).length,
            icon: DollarSign,
            grad: 'from-green-600 to-green-400',
        },
        {
            label: 'Total Amount',
            value: format(admissions.reduce((sum: number, a: any) => sum + (a.finalBill?.total_discounted_amount || 0), 0)),
            icon: DollarSign,
            grad: 'from-purple-600 to-purple-400',
        },
    ], [meta.total, admissions, format])

    return (
        <>
            <AppHeader />
            <Main fluid>
                <div className="flex-1 space-y-4  overflow-auto w-full">
                <PageHeader
                    title={pageTitle}
                    description={pageDescription}
                    backTo="/admission/patients"
                    backLabel="Back to Patients"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

                            {/* Payment Status Filter (hidden when locked to a paymentStatus) */}
                            {!paymentStatus && (
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
                            )}

                            {/* Clear Filters */}
                            {(statusFilter !== 'all' || (!paymentStatus && paymentFilter !== 'all')) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => {
                                        setStatusFilter('all')
                                        if (!paymentStatus) setPaymentFilter('all')
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
