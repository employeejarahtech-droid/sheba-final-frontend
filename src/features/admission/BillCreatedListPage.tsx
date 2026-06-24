import { useMemo, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Users, Activity, CheckCircle, FileText, DollarSign, Eye, CreditCard, X, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'

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
    // Billing items
    billing_items?: Array<{
        id: number
        item_type: 'operation' | 'consultant' | 'service' | 'bed_cabin' | 'surgeon' | 'assistant'
        amount: number
        name?: string
        operation_type?: string
        doctor?: { doctor_name: string }
        service?: { name: string }
        surgeon?: { name: string }
        assistant?: { name: string }
        bed_cabin?: { code: string; type: string }
    }>
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
    // User fields for status tracking
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
}

interface BillCreatedListPageProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export function BillCreatedListPage({ page, limit, search, setPage, setSearch }: BillCreatedListPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')

    // Payment dialog state
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionItem | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentNotes, setPaymentNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined)

    // Refund dialog state
    const [showRefundDialog, setShowRefundDialog] = useState(false)
    const [selectedAdmissionForRefund, setSelectedAdmissionForRefund] = useState<AdmissionItem | null>(null)
    const [refundAmount, setRefundAmount] = useState('')
    const [refundNotes, setRefundNotes] = useState('')
    const [refundMethod, setRefundMethod] = useState<string | undefined>(undefined)
    const queryClient = useQueryClient()

    // Record payment mutation
    const recordPaymentMutation = useMutation({
        mutationFn: async (data: { admissionId: number; amount: string; notes: string; payment_method: string }) => {
            const res = await fetch(`${API_URL}/api/admission/${data.admissionId}/final-bill/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: data.amount,
                    notes: data.notes,
                    payment_method: data.payment_method,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to record payment')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Payment recorded successfully')
            setShowPaymentDialog(false)
            setPaymentAmount('')
            setPaymentNotes('')
            setPaymentMethod(undefined)
            setSelectedAdmission(null)
            queryClient.invalidateQueries({ queryKey: ['admissions', 'bill_created'] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record payment')
        },
    })

    // Record refund mutation
    const recordRefundMutation = useMutation({
        mutationFn: async (data: { admissionId: number; amount: string; notes: string; refund_method: string }) => {
            const res = await fetch(`${API_URL}/api/admission/${data.admissionId}/final-bill/refund`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: data.amount,
                    notes: data.notes,
                    refund_method: data.refund_method,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to record refund')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Refund recorded successfully')
            setShowRefundDialog(false)
            setRefundAmount('')
            setRefundNotes('')
            setRefundMethod(undefined)
            setSelectedAdmissionForRefund(null)
            queryClient.invalidateQueries({ queryKey: ['admissions', 'bill_created'] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record refund')
        },
    })

    const handleRecordPayment = () => {
        if (!selectedAdmission) return
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        // Check if payment amount exceeds due amount
        const dueAmount = parseFloat(selectedAdmission.finalBill?.due_amount || '0')
        const paymentValue = parseFloat(paymentAmount)
        if (paymentValue > dueAmount) {
            toast.error(`Payment amount cannot exceed due amount of ${format(dueAmount)}`)
            return
        }
        if (!paymentMethod) {
            toast.error('Please select a payment method')
            return
        }
        recordPaymentMutation.mutate({
            admissionId: selectedAdmission.id,
            amount: paymentAmount,
            notes: paymentNotes,
            payment_method: paymentMethod,
        })
    }

    const handleRecordRefund = () => {
        if (!selectedAdmissionForRefund) return
        if (!refundAmount || parseFloat(refundAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        // Check if refund amount exceeds the overpayment
        const overpaidAmount = Math.abs(parseFloat(selectedAdmissionForRefund.finalBill?.due_amount || '0'))
        const refundValue = parseFloat(refundAmount)
        if (refundValue > overpaidAmount) {
            toast.error(`Refund amount cannot exceed overpayment of ${format(overpaidAmount)}`)
            return
        }
        if (!refundMethod) {
            toast.error('Please select a refund method')
            return
        }
        recordRefundMutation.mutate({
            admissionId: selectedAdmissionForRefund.id,
            amount: refundAmount,
            notes: refundNotes,
            refund_method: refundMethod,
        })
    }

    // Fetch bill created admissions directly from dedicated endpoint
    const { data: allAdmissionsData, isFetching } = useQuery({
        queryKey: ['admissions', 'bill_created', page, limit, search, statusFilter, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
                ...(paymentFilter && paymentFilter !== 'all' && { payment_status: paymentFilter }),
            })
            const res = await fetch(`${API_URL}/api/admission/bill-created?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch bill created admissions')
            return await res.json()
        },
        enabled: !!token,
    })

    const admissions = allAdmissionsData?.data || []
    const meta = allAdmissionsData?.pagination || {
        page,
        limit,
        total: admissions.length,
        totalPages: 1,
    }

    // Setup window event handler for Pay Due button
    useEffect(() => {
        const handleOpenPaymentDialog = (e: Event) => {
            const customEvent = e as CustomEvent<{ admissionId: number }>
            const { admissionId } = customEvent.detail

            // Find the admission from the list
            const admission = admissions.find((a: AdmissionItem) => a.id === admissionId)
            if (admission && admission.finalBill) {
                setSelectedAdmission(admission)
                setPaymentAmount('')
                setPaymentNotes('')
                setPaymentMethod(undefined)
                setShowPaymentDialog(true)
            }
        }

        window.addEventListener('open-payment-dialog', handleOpenPaymentDialog as EventListener)

        return () => {
            window.removeEventListener('open-payment-dialog', handleOpenPaymentDialog as EventListener)
        }
    }, [admissions])

    // Setup window event handler for Refund button
    useEffect(() => {
        const handleOpenRefundDialog = (e: Event) => {
            const customEvent = e as CustomEvent<{ admissionId: number }>
            const { admissionId } = customEvent.detail

            // Find the admission from the list
            const admission = admissions.find((a: AdmissionItem) => a.id === admissionId)
            if (admission && admission.finalBill) {
                setSelectedAdmissionForRefund(admission)
                setRefundAmount('')
                setRefundNotes('')
                setRefundMethod(undefined)
                setShowRefundDialog(true)
            }
        }

        window.addEventListener('open-refund-dialog', handleOpenRefundDialog as EventListener)

        return () => {
            window.removeEventListener('open-refund-dialog', handleOpenRefundDialog as EventListener)
        }
    }, [admissions])

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
                const hasFinalBill = !!row.finalBill
 
                let buttons = `
                    <button onclick="window.location.href='/dashboard/admission/patients/${row.id}'"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                    </button>
                `
 
                if (!hasFinalBill) {
                    buttons += `
                        <button onclick="window.location.href='/dashboard/admission/patients/${row.id}/billing'"
                                class="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                            Create Final Bill
                        </button>
                    `
                } else if (hasDue) {
                    buttons += `
                        <button onclick="window.dispatchEvent(new CustomEvent('open-payment-dialog', { detail: { admissionId: ${row.id} } }))"
                                class="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            Pay Due
                        </button>
                    `
                } else if (hasOverpayment) {
                    buttons += `
                        <button onclick="window.dispatchEvent(new CustomEvent('open-refund-dialog', { detail: { admissionId: ${row.id} } }))"
                                class="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
                            Refund
                        </button>
                    `
                }

                buttons += `
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/print', '_blank')"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                        Admission Paper
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/billing-print', '_blank')"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                        Bill Print
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/final-bill-print', '_blank')"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M15 16H8"/></svg>
                        Final Bill Print
                    </button>
                    <button onclick="window.open('/dashboard/admission/patients/${row.id}/print/discharged', '_blank')"
                            class="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
                        Discharge Paper Print
                    </button>
                `
 
                return `<div class="flex flex-wrap items-center gap-2 w-[500px]">${buttons}</div>`
            },
        },
    ], [])

    // Setup expandable rows
    useEffect(() => {
        const createTimelineItem = (title: string, isCompleted: boolean, date: string | null, completedBy: string | null, id: string = '') => {
            const dotColor = isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            const textColor = isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            const pendingLabel = isCompleted ? '' : ' (Pending)'

            // Determine print URL based on step title
            let printUrl = ''
            if (isCompleted && id) {
                const stepKey = title.toLowerCase().replace(/\s+/g, '-')
                printUrl = `/dashboard/admission/patients/${id}/print/${stepKey}`
            }

            return `
                <div class='relative ml-2' style='margin-left: 0.5rem;'>
                    <div class='absolute -left-[36px] top-1 w-6 h-6 ${dotColor} rounded-full border-4 border-white dark:border-gray-900' style='left: -36px !important;'></div>
                    <div class='flex items-center justify-between'>
                        <div>
                            <h4 class='font-semibold ${textColor}'>${title}${pendingLabel}</h4>
                            ${isCompleted && date ? `
                                <p class='text-xs text-gray-500 dark:text-gray-400'>${date}${completedBy ? ` • ${completedBy}` : ''}</p>
                            ` : ''}
                        </div>
                        ${isCompleted && id ? `
                            <a href='${printUrl}' target='_blank' class='inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors no-underline' title='Print ${title}'>
                                <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                                    <path d='M17 17h2a2 2 0 002 2 2v2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2 2m2 4h10a2 2 0 002-2V9a2 2 0 00-2-2m-7 7l3 3m0 0l-3-3'/>
                                </svg>
                                Print
                            </a>
                        ` : ''}
                    </div>
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
                // Collapse
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
                    <div class='bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg'>
                        <div class='flex justify-between items-center'>
                            <div>
                                <h2 class='text-2xl font-bold'>Admission #${id}</h2>
                                <p class='text-purple-100 text-sm'>${patientName} • ${bedCabin}</p>
                            </div>
                            <span class='px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur'>
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
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
                                        statusData.bill_created_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Final Bill',
                                        statusData.final_bill_created === 1,
                                        safeFormatDate(statusData.final_bill_created_date || null),
                                        statusData.final_bill_created_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Discharged',
                                        statusData.discharged === 1,
                                        safeFormatDate(statusData.discharged_date || null),
                                        statusData.discharged_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Payment Completed',
                                        statusData.payment_completed === 1,
                                        safeFormatDate(statusData.payment_completed_date || null),
                                        statusData.payment_completed_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Bills Distributed',
                                        statusData.bills_distributed === 1,
                                        safeFormatDate(statusData.bills_distributed_date || null),
                                        statusData.bills_distributed_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Balance Distributed',
                                        statusData.balance_distributed === 1,
                                        safeFormatDate(statusData.balance_distributed_date || null),
                                        statusData.balance_distributed_by_user?.name || null,
                                        id
                                    )}
                                </div>
                            </div>

                        </div>

                        <!-- RIGHT SIDE PAYMENT CARD -->
                        <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>

                            <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Billing Summary</h3>

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
                                    Create Final Bill
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

    const statsCards = useMemo(() => [
        {
            label: 'Total Patients',
            value: meta.total,
            icon: Users,
            grad: 'from-blue-500 to-indigo-500',
        },
        {
            label: 'Active',
            value: admissions.filter((a: any) => a.status === 'active').length,
            icon: Activity,
            grad: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Discharged',
            value: admissions.filter((a: any) => a.status === 'discharged').length,
            icon: CheckCircle,
            grad: 'from-slate-500 to-gray-500',
        },
        {
            label: 'Total Bills',
            value: admissions.reduce((sum: number, a: any) => {
                const items = a.billing_items || []
                return sum + items.length
            }, 0),
            icon: FileText,
            grad: 'from-purple-500 to-indigo-500',
        },
    ], [meta.total, admissions])

    return (
        <>
            <AppHeader />
            <Main fluid>
                <div className="flex-1 space-y-3 overflow-auto w-full">
                <PageHeader
                    title="Bill Created List"
                    description="Patients with bills created"
                    backTo="/admission/patients"
                    backLabel="Back to Patients"
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-2">
                    {statsCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 bg-gradient-to-br ${card.grad} rounded-lg shadow-lg`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="text-2xl font-bold">{card.value}</h3>
                                </CardContent>
                            </Card>
                        );
                    })}
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
                                        <SelectItem value="no_final_bill">No Final Bill</SelectItem>
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

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Record Payment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Patient Name</Label>
                            <p className="text-sm font-medium">{selectedAdmission?.patient_name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <p className="text-sm font-medium">
                                    {selectedAdmission?.finalBill ? format(parseFloat(selectedAdmission.finalBill.total_discounted_amount)) : '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <p className="text-sm font-medium text-green-600">
                                    {selectedAdmission?.finalBill ? format(parseFloat(selectedAdmission.finalBill.paid_amount)) : '-'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Due Amount</Label>
                                <p className="text-sm font-medium text-orange-600">
                                    {selectedAdmission?.finalBill ? format(parseFloat(selectedAdmission.finalBill.due_amount)) : '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Payment Amount</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="1"
                                    max={selectedAdmission?.finalBill?.due_amount || 0}
                                    placeholder="Enter amount"
                                    className={paymentAmount && parseFloat(paymentAmount) > (selectedAdmission?.finalBill?.due_amount || 0) ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-gray-500">
                                    Maximum: {selectedAdmission?.finalBill ? format(selectedAdmission.finalBill.due_amount) : '-'}
                                </p>
                                {paymentAmount && parseFloat(paymentAmount) > (selectedAdmission?.finalBill?.due_amount || 0) && (
                                    <p className="text-xs text-red-500">
                                        Amount exceeds due balance
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                            <Textarea
                                id="paymentNotes"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Add a note for this payment..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPaymentDialog(false)
                                setPaymentAmount('')
                                setPaymentNotes('')
                                setPaymentMethod(undefined)
                                setSelectedAdmission(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRecordPayment}
                            disabled={recordPaymentMutation.isPending || !paymentAmount || !paymentMethod}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {recordPaymentMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Record Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Record Refund
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Patient Name</Label>
                            <p className="text-sm font-medium">{selectedAdmissionForRefund?.patient_name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <p className="text-sm font-medium">
                                    {selectedAdmissionForRefund?.finalBill ? format(parseFloat(selectedAdmissionForRefund.finalBill.total_discounted_amount)) : '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <p className="text-sm font-medium text-green-600">
                                    {selectedAdmissionForRefund?.finalBill ? format(parseFloat(selectedAdmissionForRefund.finalBill.paid_amount)) : '-'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Overpayment</Label>
                                <p className="text-sm font-medium text-orange-600">
                                    {selectedAdmissionForRefund?.finalBill ? format(Math.abs(parseFloat(selectedAdmissionForRefund.finalBill.due_amount))) : '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refundAmount">Refund Amount</Label>
                                <Input
                                    id="refundAmount"
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    min="1"
                                    max={selectedAdmissionForRefund?.finalBill ? Math.abs(parseFloat(selectedAdmissionForRefund.finalBill.due_amount)) : 0}
                                    placeholder="Enter amount"
                                    className={refundAmount && parseFloat(refundAmount) > (selectedAdmissionForRefund?.finalBill ? Math.abs(parseFloat(selectedAdmissionForRefund.finalBill.due_amount)) : 0) ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-gray-500">
                                    Maximum: {selectedAdmissionForRefund?.finalBill ? format(Math.abs(parseFloat(selectedAdmissionForRefund.finalBill.due_amount))) : '-'}
                                </p>
                                {refundAmount && parseFloat(refundAmount) > (selectedAdmissionForRefund?.finalBill ? Math.abs(parseFloat(selectedAdmissionForRefund.finalBill.due_amount)) : 0) && (
                                    <p className="text-xs text-red-500">
                                        Amount exceeds overpayment
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refundMethod">Refund Method</Label>
                            <Select value={refundMethod} onValueChange={setRefundMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select refund method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refundNotes">Notes (Optional)</Label>
                            <Textarea
                                id="refundNotes"
                                value={refundNotes}
                                onChange={(e) => setRefundNotes(e.target.value)}
                                placeholder="Add a note for this refund..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRefundDialog(false)
                                setRefundAmount('')
                                setRefundNotes('')
                                setRefundMethod(undefined)
                                setSelectedAdmissionForRefund(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRecordRefund}
                            disabled={recordRefundMutation.isPending || !refundAmount || !refundMethod}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {recordRefundMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Record Refund
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Main>
        </>
    )
}
