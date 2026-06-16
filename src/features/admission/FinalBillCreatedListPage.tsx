import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Users, Activity, CheckCircle, FileText, DollarSign, Eye, CreditCard, X } from 'lucide-react'

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

interface FinalBillCreatedListPageProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export function FinalBillCreatedListPage({ page, limit, search, setPage, setSearch }: FinalBillCreatedListPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')

    // Fetch final bill created admissions from dedicated endpoint
    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'final_bill_created', page, limit, search, statusFilter, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
                ...(paymentFilter && paymentFilter !== 'all' && { payment_status: paymentFilter }),
            })
            const res = await fetch(`${API_URL}/api/admission/final-bill-created?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch final bill created admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    const admissions = allAdmissionsData?.data?.items || []

    const meta = {
        page,
        limit,
        total: admissions.length,
    }

    const columns = useMemo(() => [
        {
            data: "id",
            title: "ID",
            orderable: true,
            responsivePriority: 1,
            render: (data: any, _type: string, row: AdmissionItem) => {
                const admissionDate = row.admission_date ? new Date(row.admission_date).toLocaleDateString() : '-';
                const dischargeDate = row.discharge_date ? new Date(row.discharge_date).toLocaleDateString() : '-';
                const bedCabinInfo = row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-';
                const doctorName = row.doctor?.doctor_name || '-';

                // Status tracking data
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
                        <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded bg-black text-white hover:bg-gray-800 transition-colors font-bold text-xs"
                                type="button"
                                data-id="${data}"
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
                        <span>${data}</span>
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
            render: (data: any) => new Date(data).toLocaleDateString(),
        },
        {
            data: "status",
            title: "Status",
            orderable: true,
            responsivePriority: 7,
            render: (data: any, _type: string, row: AdmissionItem) => {
                const statusClass = data === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : data === 'discharged'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                const statusLabel = data.charAt(0).toUpperCase() + data.slice(1)
                return `<span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">${statusLabel}</span>`
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
                const hasDue = dueAmount > 0
                const hasOverpayment = dueAmount < 0

                let buttons = `
                    <button onclick="window.location.href='/dashboard/admission/patients/${row.id}'"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                    </button>
                `

                if (hasDue) {
                    buttons += `
                        <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/billing'"
                                class="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            Pay Due
                        </button>
                    `
                } else if (hasOverpayment) {
                    buttons += `
                        <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/billing'"
                                class="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
                            Refund
                        </button>
                    `
                }

                return `<div class="flex items-center gap-2">${buttons}</div>`
            },
        },
    ], [])

    // Setup expandable rows
    useEffect(() => {
        const format = (value: number) => {
            return new Intl.NumberFormat('en-BD', {
                style: 'currency',
                currency: 'BDT',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value)
        }

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

            // Find existing details row
            const existingDetails = row.nextElementSibling
            if (existingDetails && existingDetails.classList.contains('child-row-detail')) {
                existingDetails.remove()
                row.classList.remove('expanded')
                btn.textContent = '+'
                btn.style.backgroundColor = '#000'
                return
            }

            // Get data from attributes
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
            const createdBy = btn.dataset.createdBy || '-'
            const finalBill = btn.dataset.finalBill ? JSON.parse(btn.dataset.finalBill as string) : null
            const statusData = btn.dataset.statusData ? JSON.parse(decodeURIComponent(btn.dataset.statusData as string)) : {}

            // Fetch billing summary
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

            // Create beautiful new design HTML
            const beautifulDetailsHtml = `
                <div class='max-w-6xl mx-auto p-6 space-y-6'>
                    <!-- HEADER CARD -->
                    <div class='bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg'>
                        <div class='flex justify-between items-center'>
                            <div>
                                <h2 class='text-2xl font-bold'>Admission #${id}</h2>
                                <p class='text-green-100 text-sm'>${patientName} • ${bedCabin}</p>
                            </div>
                            <span class='px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur'>
                                Final Bill Created
                            </span>
                        </div>
                    </div>

                    <!-- MAIN GRID -->
                    <div class='grid lg:grid-cols-3 gap-6'>

                        <!-- LEFT SIDE DETAILS -->
                        <div class='lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6'>

                            <!-- Patient Info -->
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

                            <!-- STATUS TIMELINE -->
                            <div>
                                <h3 class='text-lg font-semibold mb-6 border-b pb-2 dark:border-gray-700'>Status Timeline</h3>

                                <div class='relative border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-8'>
                                    ${createTimelineItem(
                                        'Bill Created',
                                        statusData.bill_created === 1,
                                        safeFormatDate(statusData.bill_created_date || null),
                                        statusData.bill_created_by_user?.name || null
                                    )}
                                    ${createTimelineItem(
                                        'Final Bill',
                                        statusData.final_bill_created === 1,
                                        safeFormatDate(statusData.final_bill_created_date || null),
                                        statusData.final_bill_created_by_user?.name || null
                                    )}
                                    ${createTimelineItem(
                                        'Discharged',
                                        statusData.discharged === 1,
                                        safeFormatDate(statusData.discharged_date || null),
                                        statusData.discharged_by_user?.name || null
                                    )}
                                    ${createTimelineItem(
                                        'Payment Completed',
                                        statusData.payment_completed === 1,
                                        safeFormatDate(statusData.payment_completed_date || null),
                                        statusData.payment_completed_by_user?.name || null
                                    )}
                                    ${createTimelineItem(
                                        'Bills Distributed',
                                        statusData.bills_distributed === 1,
                                        safeFormatDate(statusData.bills_distributed_date || null),
                                        statusData.bills_distributed_by_user?.name || null
                                    )}
                                    ${createTimelineItem(
                                        'Balance Distributed',
                                        statusData.balance_distributed === 1,
                                        safeFormatDate(statusData.balance_distributed_date || null),
                                        statusData.balance_distributed_by_user?.name || null
                                    )}
                                </div>
                            </div>

                        </div>

                        <!-- RIGHT SIDE PAYMENT CARD -->
                        <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>

                            <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Final Bill Summary</h3>

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
                                    <div class='pt-3'>
                                        <div class='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                            <div class='bg-green-500 h-2 rounded-full' style='width: ${Math.round((parseFloat(finalBill.paid_amount) / parseFloat(finalBill.total_discounted_amount)) * 100)}%'></div>
                                        </div>
                                        <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'>${Math.round((parseFloat(finalBill.paid_amount) / parseFloat(finalBill.total_discounted_amount)) * 100)}% Paid</p>
                                    </div>
                                </div>
                            ` : `
                                <div class='space-y-3 text-sm'>
                                    <div class='grid grid-cols-2 gap-4 text-sm'>
                                        <div>
                                            <span class='text-gray-500 dark:text-gray-400'>Operations</span>
                                            <p class='font-semibold text-blue-600'>${format(operationsTotal)}</p>
                                        </div>
                                        <div>
                                            <span class='text-gray-500 dark:text-gray-400'>Consultants</span>
                                            <p class='font-semibold text-purple-600'>${format(consultantsTotal)}</p>
                                        </div>
                                        <div>
                                            <span class='text-gray-500 dark:text-gray-400'>Services</span>
                                            <p class='font-semibold text-orange-600'>${format(servicesTotal)}</p>
                                        </div>
                                        <div>
                                            <span class='text-gray-500 dark:text-gray-400'>Bed Charges</span>
                                            <p class='font-semibold text-pink-600'>${format(bedTotal)}</p>
                                        </div>
                                        ${surgeonsTotal > 0 ? `
                                            <div>
                                                <span class='text-gray-500 dark:text-gray-400'>Surgeons</span>
                                                <p class='font-semibold text-indigo-600'>${format(surgeonsTotal)}</p>
                                            </div>
                                        ` : ''}
                                        ${assistantsTotal > 0 ? `
                                            <div>
                                                <span class='text-gray-500 dark:text-gray-400'>Assistants</span>
                                                <p class='font-semibold text-teal-600'>${format(assistantsTotal)}</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class='mt-3 pt-3 border-t flex items-center justify-between'>
                                        <span class='text-sm text-gray-500 dark:text-gray-400'>Total Bill Amount</span>
                                        <span class='text-2xl font-bold text-gray-900 dark:text-white'>${format(grandTotal)}</span>
                                    </div>
                                </div>
                            `}

                            <!-- ACTION BUTTONS -->
                            <div class='flex flex-row flex-wrap gap-3 pt-4 w-full max-w-full box-border'>
                                <a href="/dashboard/admission/patients/${id}/print" class='flex-1 min-w-[140px] text-center px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow transition no-underline box-border'>
                                    Print Details
                                </a>
                                <button onclick="window.location.href='/dashboard/admission/patients/${id}/final-bill'" class='flex-1 min-w-[140px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                                    View Final Bill
                                </button>
                            </div>

                        </div>

                    </div>
                </div>
            `

            // Create details container
            const details = document.createElement('div')
            details.innerHTML = beautifulDetailsHtml

            // Create new row
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

        // Add event listener to document for delegation
        document.addEventListener('click', handleExpandClick)

        return () => {
            document.removeEventListener('click', handleExpandClick)
        }
    }, [format, page, limit, search])

    return (
        <>
            <AppHeader />
            
            <main fluid>
                <div className="p-4 flex-1 space-y-3 overflow-auto w-full">
                <PageHeader
                    title="Final Bills List"
                    description="Patients with final bills created"
                    backTo="/admission/patients"
                    backLabel="Back to Patients"
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Patients</p>
                                <p className="text-3xl font-bold">{meta.total}</p>
                            </div>
                            <Users className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className={`bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-6 text-white shadow-lg shadow-green-500/30`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Active</p>
                                <p className="text-3xl font-bold">{admissions.filter((a: any) => a.status === 'active').length}</p>
                            </div>
                            <Activity className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className={`bg-gradient-to-r from-gray-600 to-gray-400 rounded-2xl p-6 text-white shadow-lg shadow-gray-500/30`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-100 text-sm font-medium">Discharged</p>
                                <p className="text-3xl font-bold">{admissions.filter((a: any) => a.status === 'discharged').length}</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                    <div className={`bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Bills</p>
                                <p className="text-3xl font-bold">{meta.total}</p>
                            </div>
                            <FileText className="w-12 h-12 text-white opacity-90" />
                        </div>
                    </div>
                </div>

                {/* DataTable */}
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
        </main>
        </>
    )
}
