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
    age_text?: string | null
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
    father_name?: string | null
    address?: string | null
    id_card_number?: string | null
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
        title?: string
        qualification?: string
        speciality: string
    }
    referredByDoctor?: { doctor_name: string } | null
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
    payments?: Array<{ id: number; payment_date: string; payment_method?: string | null; amount: number | string; created_by_user?: { name: string } | null }>
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

export function DischargedPatientListPage({ page, limit, search, setPage, setLimit, setSearch, paymentStatus, billsDistributed }: DischargedPatientListPageProps) {
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
                const referredByName = row.referredByDoctor?.doctor_name || '-';
                const finalBillData = row.finalBill ? JSON.stringify(row.finalBill) : '';
                const paymentsData = JSON.stringify(row.payments || []);

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
                                data-age="${row.age_text || row.age || ''}"
                                data-sex="${row.sex || '-'}"
                                data-phone="${row.phone || '-'}"
                                data-id-card-number="${row.id_card_number || '-'}"
                                data-admission-date="${admissionDate}"
                                data-discharge-date="${dischargeDate}"
                                data-status="${row.status}"
                                data-bed-cabin="${bedCabinInfo.replace(/"/g, '&quot;')}"
                                data-doctor="${doctorName.replace(/"/g, '&quot;')}"
                                data-referred-by="${referredByName.replace(/"/g, '&quot;')}"
                                data-father-name="${(row.father_name || '-').replace(/"/g, '&quot;')}"
                                data-address="${(row.address || '-').replace(/"/g, '&quot;')}"
                                data-admission-time="${(row.admission_time || '-').replace(/"/g, '&quot;')}"
                                data-diagnosis="${(row.diagnosis || '-').replace(/"/g, '&quot;')}"
                                data-final-bill="${finalBillData.replace(/"/g, '&quot;')}"
                                data-payments="${encodeURIComponent(paymentsData)}"
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
            render: (_data: any, type: string, row: AdmissionItem) => {
                const d = row.doctor
                if (!d?.doctor_name) return '-'
                if (type === 'sort' || type === 'filter' || type === 'type') return d.doctor_name
                const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                const subtitle = [d.qualification || d.title, d.speciality].filter(Boolean).join(' - ')
                return `<div class="flex flex-col"><span class="font-medium">Dr. ${esc(d.doctor_name)}</span>${subtitle ? `<span class="text-xs text-muted-foreground">${esc(subtitle)}</span>` : ''}</div>`
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

    // Handle expand button clicks in the Admission No column — toggles a
    // detail row with patient info, status timeline and payment summary,
    // matching the pattern used on the bill-distributed list pages.
    useEffect(() => {
        const handleExpandClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.expand-btn')
            if (!button) return

            const btn = button as HTMLButtonElement
            const row = btn.closest('tr')
            if (!row) return

            const isExpanded = row.classList.contains('expanded')
            const nextRow = row.nextElementSibling

            // Toggle collapse
            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove()
                row.classList.remove('expanded')
                btn.textContent = '+'
                btn.style.backgroundColor = '#10B981'
                return
            }

            if (isExpanded) return

            const id = btn.dataset.id || ''
            const patientName = btn.dataset.patientName || '-'
            const age = btn.dataset.age || '-'
            const sex = btn.dataset.sex || '-'
            const phone = btn.dataset.phone || '-'
            const idCardNumber = btn.dataset.idCardNumber || '-'
            const fatherName = btn.dataset.fatherName || '-'
            const address = btn.dataset.address || '-'
            const admissionTime = btn.dataset.admissionTime || '-'
            const referredBy = btn.dataset.referredBy || '-'
            const admissionDate = btn.dataset.admissionDate || '-'
            const dischargeDate = btn.dataset.dischargeDate || '-'
            const status = btn.dataset.status || '-'
            const bedCabin = btn.dataset.bedCabin || '-'
            const doctor = btn.dataset.doctor || '-'
            const diagnosis = btn.dataset.diagnosis || '-'
            const finalBillData = btn.dataset.finalBill ? JSON.parse(btn.dataset.finalBill) : null
            const paymentsData: Array<{ payment_date: string; payment_method?: string | null; amount: number | string; created_by_user?: { name: string } | null }> =
                btn.dataset.payments ? JSON.parse(decodeURIComponent(btn.dataset.payments)) : []
            const statusData = btn.dataset.statusData ? JSON.parse(decodeURIComponent(btn.dataset.statusData)) : {}

            // Payment summary block
            let paymentInfoHtml = ''
            if (finalBillData) {
                const billStatus = finalBillData.status.charAt(0).toUpperCase() + finalBillData.status.slice(1)
                const statusColors: { [key: string]: string } = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    partial: 'bg-blue-100 text-blue-800',
                    paid: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800'
                }

                const paymentRowsHtml = paymentsData.length > 0
                    ? paymentsData.map((p) => {
                        const date = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'
                        const type = p.payment_method
                            ? p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1)
                            : '-'
                        const amountNum = Number(p.amount)
                        const isRefund = amountNum < 0
                        const collectedBy = p.created_by_user?.name || '-'
                        return `
                            <tr class='border-b border-muted last:border-b-0'>
                                <td class='py-1.5 px-3 text-xs'>${date}</td>
                                <td class='py-1.5 px-3 text-xs'>${type}</td>
                                <td class='py-1.5 px-3 text-xs font-semibold ${isRefund ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}'>${format(amountNum)}</td>
                                <td class='py-1.5 px-3 text-xs'>${collectedBy}</td>
                            </tr>
                        `
                    }).join('')
                    : `<tr><td colspan='4' class='py-2 px-3 text-xs text-muted-foreground'>No payments recorded yet</td></tr>`

                paymentInfoHtml = `
                    <li class='col-span-2 bg-muted/30 p-3 rounded-lg'>
                        <div class='flex items-center justify-between mb-2'>
                            <div class='font-semibold'>Payment Information</div>
                            <span class='px-2 py-0.5 rounded text-xs ${statusColors[finalBillData.status] || ''}'>${billStatus}</span>
                        </div>
                        <div class='grid grid-cols-3 gap-2 text-xs mb-3'>
                            <div><strong>Total Amount:</strong> ${format(parseFloat(finalBillData.total_discounted_amount))}</div>
                            <div><strong>Paid:</strong> ${format(parseFloat(finalBillData.paid_amount))}</div>
                            <div><strong>Due:</strong> ${format(parseFloat(finalBillData.due_amount))}</div>
                        </div>
                        <div class='overflow-x-auto rounded-md border bg-white dark:bg-gray-900'>
                            <table class='w-full text-left'>
                                <thead class='bg-muted/40'>
                                    <tr>
                                        <th class='py-1.5 px-3 text-xs font-semibold'>Date</th>
                                        <th class='py-1.5 px-3 text-xs font-semibold'>Type</th>
                                        <th class='py-1.5 px-3 text-xs font-semibold'>Amount</th>
                                        <th class='py-1.5 px-3 text-xs font-semibold'>Collected By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${paymentRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </li>
                `
            } else {
                paymentInfoHtml = `<li class='col-span-2 text-muted-foreground text-xs'>No payments recorded yet</li>`
            }

            // Helper: status card
            const createStatusCard = (title: string, description: string, isCompleted: boolean, date: string | null, completedBy: string | null) => {
                const borderColor = isCompleted ? 'border-l-green-500' : 'border-l-gray-300 dark:border-l-gray-600'
                const textColor = isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
                const iconSvg = isCompleted
                    ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                    : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`

                return `
                    <div class='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${borderColor} border-l-4 p-4 transition-all hover:shadow-md'>
                        <div class='flex items-start gap-3'>
                            <div class='flex-shrink-0 mt-0.5'>
                                <div class='w-8 h-8 rounded-full ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center'>
                                    ${iconSvg}
                                </div>
                            </div>
                            <div class='flex-1 min-w-0'>
                                <div class='flex items-center justify-between gap-2 mb-1'>
                                    <h4 class='text-sm font-semibold ${textColor}'>${title}</h4>
                                    ${isCompleted
                                        ? `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'>Completed</span>`
                                        : `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'>Pending</span>`
                                    }
                                </div>
                                <p class='text-xs text-gray-500 dark:text-gray-400 mb-2'>${description}</p>
                                ${isCompleted && date ? `
                                    <div class='space-y-1'>
                                        <div class='text-xs text-gray-600 dark:text-gray-400'>${date}</div>
                                        ${completedBy ? `<div class='text-xs text-gray-600 dark:text-gray-400'>${completedBy}</div>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `
            }

            const statusTrackingHtml = `
                <li class='col-span-2 space-y-4'>
                    <h3 class='text-base font-bold text-gray-800 dark:text-gray-200 mb-2'>Status Tracking</h3>
                    <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        ${createStatusCard('Bill Created', 'Initial bill has been generated for the admission', statusData.bill_created === 1, statusData.bill_created_date || null, statusData.bill_created_by_user?.name || null)}
                        ${createStatusCard('Final Bill', 'Final bill with all charges and discounts has been created', statusData.final_bill_created === 1, statusData.final_bill_created_date || null, statusData.final_bill_created_by_user?.name || null)}
                        ${createStatusCard('Discharged', 'Patient has been discharged from the facility', statusData.discharged === 1, statusData.discharged_date || null, statusData.discharged_by_user?.name || null)}
                        ${createStatusCard('Payment Completed', 'All payments have been received and cleared', statusData.payment_completed === 1, statusData.payment_completed_date || null, statusData.payment_completed_by_user?.name || null)}
                        ${createStatusCard('Bills Distributed', 'Bills have been distributed to service providers', statusData.bills_distributed === 1, statusData.bills_distributed_date || null, statusData.bills_distributed_by_user?.name || null)}
                        ${createStatusCard('Balance Distributed', 'All provider payments have been completed', statusData.balance_distributed === 1, statusData.balance_distributed_date || null, statusData.balance_distributed_by_user?.name || null)}
                    </div>
                </li>
            `

            const safeFormatDate = (dateInput: string | null | undefined) => {
                if (!dateInput || dateInput === '-') return '-'
                const date = new Date(dateInput)
                if (isNaN(date.getTime())) return String(dateInput)
                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            }

            const totalAmount = finalBillData ? parseFloat(finalBillData.total_discounted_amount) : 0
            const paidAmount = finalBillData ? parseFloat(finalBillData.paid_amount) : 0
            const dueAmount = finalBillData ? parseFloat(finalBillData.due_amount) : 0
            const paymentPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

            const detailsHtml = `
                <div class='max-w-6xl mx-auto p-6 space-y-6'>
                    <div class='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg'>
                        <div class='flex justify-between items-center'>
                            <div>
                                <h2 class='text-2xl font-bold'>Admission #${id}</h2>
                                <p class='text-blue-100 text-sm'>${patientName} • ${bedCabin}</p>
                            </div>
                            <span class='px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur'>${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </div>
                    </div>

                    <div class='grid lg:grid-cols-3 gap-6'>
                        <div class='lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6'>
                            <div>
                                <h3 class='text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700'>Patient Information</h3>
                                <div class='grid md:grid-cols-2 gap-4 text-sm'>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Age/Sex:</span> ${age} / ${sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase()}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Phone:</span> ${phone}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>ID Card Number:</span> ${idCardNumber}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Father Name:</span> ${fatherName}</div>
                                    <div class='md:col-span-2'><span class='font-medium text-gray-500 dark:text-gray-400'>Address:</span> ${address}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Consultant:</span> ${doctor}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Referred By:</span> ${referredBy}</div>
                                    <div class='md:col-span-2'><span class='font-medium text-gray-500 dark:text-gray-400'>Diagnosis / Treatment:</span> ${diagnosis}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Admission Date:</span> ${safeFormatDate(admissionDate)} ${admissionTime !== '-' ? admissionTime : ''}</div>
                                    <div><span class='font-medium text-gray-500 dark:text-gray-400'>Discharge Date:</span> ${safeFormatDate(dischargeDate)}</div>
                                </div>
                            </div>
                        </div>

                        <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>
                            <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Payment Summary</h3>
                            ${finalBillData ? `
                                <div class='space-y-3 text-sm'>
                                    <div class='flex justify-between'>
                                        <span class='text-gray-500 dark:text-gray-400'>Total Amount</span>
                                        <span class='font-semibold'>${format(totalAmount)}</span>
                                    </div>
                                    <div class='flex justify-between text-green-600 dark:text-green-400'>
                                        <span>Paid</span>
                                        <span class='font-semibold'>${format(paidAmount)}</span>
                                    </div>
                                    <div class='flex justify-between text-red-500'>
                                        <span>Due</span>
                                        <span class='font-semibold'>${format(dueAmount)}</span>
                                    </div>
                                    <div class='pt-3'>
                                        <div class='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                            <div class='bg-green-500 h-2 rounded-full' style='width: ${paymentPercentage}%'></div>
                                        </div>
                                        <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'>${paymentPercentage}% Paid</p>
                                    </div>
                                </div>
                            ` : `<p class='text-xs text-gray-500 dark:text-gray-400'>No final bill found.</p>`}

                            <div class='flex flex-row flex-wrap gap-3 pt-4 w-full max-w-full box-border'>
                                <a href="/dashboard/admission/patients/${id}/print" target="_blank" class='flex-1 min-w-[140px] text-center px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow transition no-underline box-border'>
                                    Print Details
                                </a>
                                <button onclick="window.location.href='/dashboard/admission/patients/${id}/billing'" class='flex-1 min-w-[140px] px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                                    View Billing
                                </button>
                            </div>
                        </div>
                    </div>

                    <ul class='grid grid-cols-1 gap-4'>
                        ${paymentInfoHtml}
                        ${statusTrackingHtml}
                    </ul>
                </div>
            `

            const details = document.createElement('div')
            details.innerHTML = detailsHtml

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
    }, [format])

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
