import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { Users, Activity, CheckCircle, AlertCircle, UserPlus, X, DollarSign, Filter } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { getCookie } from '@/lib/cookies'
import { useMutation } from '@tanstack/react-query'
import { useCurrency } from '@/hooks/use-currency'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from 'lucide-react'
import { cn } from "@/lib/utils"

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
    advancePayments?: {
        total_amount: number
        payment_count: number
        payments?: Array<{
            id: number
            amount: number
            payment_date: string
            notes?: string
            payment_method?: string
            created_by_user?: {
                id: number
                name: string
                email?: string
            }
        }>
    }
}

interface AdmittedPatientsListProps {
    page: number;
    limit: number;
    search: string;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (search: string) => void;
}

export function AdmittedPatientsList({ page, limit, search, setPage, setLimit, setSearch }: AdmittedPatientsListProps) {
    const { currencySymbol, format } = useCurrency()
    const navigate = useNavigate()
    const location = useLocation()

    // Detect status from URL path (/active or /discharged)
    const pathStatus = location.pathname.endsWith('/active') ? 'active'
        : location.pathname.endsWith('/discharged') ? 'discharged'
        : ''
    const urlStatus = pathStatus || ""
    const validStatuses = ["active", "discharged", "critical"]
    const [statusFilter, setStatusFilter] = useState<string>(urlStatus && validStatuses.includes(urlStatus) ? urlStatus : "all")
    const [openFilter, setOpenFilter] = useState(false)

    // Sync status filter with URL changes
    useEffect(() => {
        if (urlStatus && validStatuses.includes(urlStatus)) {
            setStatusFilter(urlStatus)
        } else {
            setStatusFilter("all")
        }
    }, [urlStatus])

    // Advance payment modal state
    const [advancePaymentModal, setAdvancePaymentModal] = useState<{
        open: boolean
        admissionId: string | null
        amount: string
        notes: string
        paymentMethod: string
        debitAccountId: string
        creditAccountId: string
        narration: string
    }>({
        open: false,
        admissionId: null,
        amount: '',
        notes: '',
        paymentMethod: 'cash',
        debitAccountId: '',
        creditAccountId: '',
        narration: '',
    })

    // Fetch accounts for journal entry dropdowns
    const [accountSearch, setAccountSearch] = useState('')
    const { data: accountsData } = useQuery({
        queryKey: ['accounts-for-journal', accountSearch],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/accounting/accounts?limit=100&search=${accountSearch}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Failed to fetch accounts')
            return response.json()
        },
        enabled: advancePaymentModal.open,
    })
    const accounts: { id: number; name: string; code: string }[] = accountsData?.data?.items || accountsData?.data || []

    // Fetch payment account mappings for pre-filling modal
    const { data: paymentMappingsData } = useQuery({
        queryKey: ['payment-mappings'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/app-settings/payment-mappings`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Failed to fetch payment mappings')
            return response.json()
        },
    })

    const token = getCookie('accessToken')

    // Advance payment mutation
    const advancePaymentMutation = useMutation({
        mutationFn: async ({ admissionId, amount, notes, paymentMethod, debitAccountId, creditAccountId, narration }: {
            admissionId: string
            amount: string
            notes: string
            paymentMethod: string
            debitAccountId: string
            creditAccountId: string
            narration: string
        }) => {
            // Record the advance payment
            const response = await fetch(`${API_URL}/api/admission/${admissionId}/advance-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    notes: notes || 'Advance payment',
                    payment_method: paymentMethod || null,
                }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to record advance payment')
            }

            // Create journal entry if accounts are selected
            if (debitAccountId && creditAccountId) {
                const journalResponse = await fetch(`${API_URL}/api/accounting/journal-entry`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: new Date().toISOString().split('T')[0],
                        narration: narration || `Advance payment for admission #${admissionId}`,
                        entries: [
                            { account_id: Number(debitAccountId), debit: parseFloat(amount), credit: 0 },
                            { account_id: Number(creditAccountId), debit: 0, credit: parseFloat(amount) },
                        ],
                    }),
                })
                if (!journalResponse.ok) {
                    const errorData = await journalResponse.json()
                    console.error('Journal entry failed:', errorData)
                }
            }

            return response.json()
        },
        onSuccess: () => {
            // Close modal and reset form
            setAdvancePaymentModal({
                open: false,
                admissionId: null,
                amount: '',
                notes: '',
                paymentMethod: 'cash',
                debitAccountId: '',
                creditAccountId: '',
                narration: '',
            })
            // Refetch admissions to show updated advance payment info
            window.location.reload()
        },
        onError: (error: Error) => {
            alert(error.message || 'Failed to record advance payment')
        },
    })

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
        queryKey: ['admissions', page, limit, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter !== "all" && { status: statusFilter }),
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
    const admissions = admissionsData?.data?.items || []
    const meta = {
        page,
        limit,
        total: admissionsData?.data?.meta?.total || 0,
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

    const formatDateShort = (dateStr: string | null | undefined) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const createdRow = useMemo(() => (row: Node, data: AdmissionItem[]) => {
        const item = data[0] as unknown as AdmissionItem
        if (!item) return

        const makeBadge = (label: string, done: boolean, date: string | null) => {
            const bg = done ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            const txt = done ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'
            const yesNo = done ? 'Yes' : 'No'
            const datePart = done && date ? ` <span class="opacity-60">${formatDateShort(date)}</span>` : ''
            return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${bg} ${txt}">${label}: ${yesNo}${datePart}</span>`
        }

        const html = `
            <div class="flex flex-wrap items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs">
                ${makeBadge('Bill Created', (item as any).bill_created === 1, (item as any).bill_created_date || null)}
                ${makeBadge('Final Bill', (item as any).final_bill_created === 1, (item as any).final_bill_created_date || null)}
                ${makeBadge('Bill Distributed', (item as any).bills_distributed === 1, (item as any).bills_distributed_date || null)}
                ${makeBadge('Discharged', (item as any).discharged === 1, (item as any).discharged_date || null)}
            </div>
        `

        const subRow = document.createElement('tr')
        subRow.className = 'status-sub-row'
        const cell = document.createElement('td')
        cell.colSpan = 20
        cell.className = 'p-0'
        cell.innerHTML = html
        subRow.appendChild(cell)
        ;(row as HTMLElement).after(subRow)
    }, [])

    const columns = useMemo(() => [
        {
            data: "admission_prefix",
            title: "Custom ID",
            orderable: true,
            responsivePriority: 1,
            render: (data: any, _type: string, row: AdmissionItem) => {
                const admissionDate = row.admission_date ? new Date(row.admission_date).toLocaleDateString() : '-';
                const dischargeDate = row.discharge_date ? new Date(row.discharge_date).toLocaleDateString() : '-';
                const bedCabinInfo = row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-';
                const doctorName = row.doctor?.doctor_name || '-';
                const finalBillData = row.finalBill ? JSON.stringify(row.finalBill) : '';
                const advancePaymentsData = row.advancePayments ? JSON.stringify(row.advancePayments) : '';

                // Status tracking data with user object references
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
                };

                const displayId = data || row.id;
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
                                data-status="${row.status}"
                                data-bed-cabin="${bedCabinInfo.replace(/"/g, '&quot;')}"
                                data-doctor="${doctorName.replace(/"/g, '&quot;')}"
                                data-diagnosis="${(row.diagnosis || '-').replace(/"/g, '&quot;')}"
                                data-created-by="${String(row.created_by || '-').replace(/"/g, '&quot;')}"
                                data-final-bill="${finalBillData.replace(/"/g, '&quot;')}"
                                data-advance-payments="${advancePaymentsData.replace(/"/g, '&quot;')}"
                                data-status-data="${encodeURIComponent(JSON.stringify(statusData)).replace(/"/g, '&quot;')}">+</button>
                        <span class="font-semibold text-blue-600 dark:text-blue-400">${displayId}</span>
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
            title: "Admitted By",
            orderable: false,
            responsivePriority: 5,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                return row.created_by_user?.name || '-'
            },
            defaultContent: "-",
        },
        {
            data: null,
            title: "Bill Created",
            orderable: true,
            responsivePriority: 3,
            render: (_data: any, _type: string, row: AdmissionItem) => {
                const isCreated = row.bill_created === 1
                return isCreated
                    ? '<span class="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Yes</span>'
                    : '<span class="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">No</span>'
            },
            defaultContent: '<span class="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">No</span>',
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

            // Toggle collapse
            if (nextRow && nextRow.classList.contains('child-row-detail')) {
                nextRow.remove()
                row.classList.remove('expanded')
                btn.textContent = '+'
                btn.style.backgroundColor = 'black'
                return
            }

            // Don't expand if already expanded
            if (isExpanded) return

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
            const finalBillData = btn.dataset.finalBill ? JSON.parse(btn.dataset.finalBill) : null
            const advancePaymentsData = btn.dataset.advancePayments ? JSON.parse(btn.dataset.advancePayments) : null
            const statusData = btn.dataset.statusData ? JSON.parse(decodeURIComponent(btn.dataset.statusData)) : {}

            // Store admission data globally for printing
            const admissionData = {
                id, patientName, age, sex, phone, admissionDate,
                dischargeDate, status, bedCabin, doctor, diagnosis, createdBy,
                finalBillData, advancePaymentsData, statusData
            }
            ;(window as any).admissionDataForPrint = admissionData

            // Create payment info HTML
            let paymentInfoHtml = ''
            if (finalBillData) {
                const billStatus = finalBillData.status.charAt(0).toUpperCase() + finalBillData.status.slice(1)
                const statusColors: { [key: string]: string } = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    partial: 'bg-blue-100 text-blue-800',
                    paid: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800'
                }
                paymentInfoHtml = `
                    <li class='col-span-2 bg-muted/30 p-3 rounded-lg'>
                        <div class='font-semibold mb-2'>Payment Information</div>
                        <div class='grid grid-cols-2 gap-2 text-xs'>
                            <div><strong>Total Amount:</strong> ${format(parseFloat(finalBillData.total_discounted_amount))}</div>
                            <div><strong>Paid:</strong> ${format(parseFloat(finalBillData.paid_amount))}</div>
                            <div><strong>Due:</strong> ${format(parseFloat(finalBillData.due_amount))}</div>
                            <div><strong>Status:</strong> <span class='px-2 py-0.5 rounded text-xs ${statusColors[finalBillData.status] || ''}'>${billStatus}</span></div>
                            <div class='col-span-2'><strong>Payments:</strong> ${finalBillData.payment_count} payment${finalBillData.payment_count !== 1 ? 's' : ''} recorded</div>
                        </div>
                    </li>
                `
            } else if (advancePaymentsData && advancePaymentsData.payments && advancePaymentsData.payments.length > 0) {
                // Generate table rows for each payment
                const paymentRows = advancePaymentsData.payments.map((p: any) => {
                    const paymentDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-';
                    const paymentMethod = p.payment_method ? p.payment_method.replace(/_/g, ' ').toUpperCase() : '-';
                    const collectedBy = p.created_by_user?.name || '-';
                    return `
                        <tr class='border-b border-blue-100 dark:border-blue-900 last:border-b-0'>
                            <td class='py-2 px-3 text-xs'>${format(parseFloat(p.amount))}</td>
                            <td class='py-2 px-3 text-xs'>${paymentDate}</td>
                            <td class='py-2 px-3 text-xs'>${paymentMethod}</td>
                            <td class='py-2 px-3 text-xs text-blue-700 dark:text-blue-300'>${collectedBy}</td>
                            <td class='py-2 px-3 text-xs'>${p.notes || '-'}</td>
                        </tr>
                    `;
                }).join('');

                paymentInfoHtml = `
                    <li class='col-span-2 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800'>
                        <div class='font-semibold mb-2 text-blue-700 dark:text-blue-300'>Advance Payments (${format(parseFloat(advancePaymentsData.total_amount))})</div>
                        <table class='w-full text-xs'>
                            <thead>
                                <tr class='border-b border-blue-200 dark:border-blue-800 text-left'>
                                    <th class='py-1 px-3 font-semibold text-blue-800 dark:text-blue-200'>Amount</th>
                                    <th class='py-1 px-3 font-semibold text-blue-800 dark:text-blue-200'>Date</th>
                                    <th class='py-1 px-3 font-semibold text-blue-800 dark:text-blue-200'>Method</th>
                                    <th class='py-1 px-3 font-semibold text-blue-800 dark:text-blue-200'>Collected By</th>
                                    <th class='py-1 px-3 font-semibold text-blue-800 dark:text-blue-200'>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paymentRows}
                            </tbody>
                        </table>
                        <div class='mt-2 text-xs text-blue-600 dark:text-blue-400'>${advancePaymentsData.payment_count} payment${advancePaymentsData.payment_count !== 1 ? 's' : ''} recorded • Will be applied when final bill is created</div>
                    </li>
                `
            } else {
                paymentInfoHtml = `<li class='col-span-2 text-muted-foreground text-xs'>No payments recorded yet</li>`
            }

            // Helper function to create status card HTML
            const createStatusCard = (title: string, description: string, isCompleted: boolean, date: string | null, completedBy: string | null, iconSvg: string) => {
                const borderColor = isCompleted ? 'border-l-green-500' : 'border-l-gray-300 dark:border-l-gray-600'
                const bgColor = isCompleted ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-900/20'
                const iconColor = isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                const textColor = isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'

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
                                        ? `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'>
                                            <svg class='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/>
                                            </svg>
                                            Completed
                                        </span>`
                                        : `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                                            Pending
                                        </span>`
                                    }
                                </div>
                                <p class='text-xs text-gray-500 dark:text-gray-400 mb-2'>${description}</p>
                                ${isCompleted && date ? `
                                    <div class='space-y-1'>
                                        <div class='flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400'>
                                            <svg class='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/>
                                            </svg>
                                            <span>${date}</span>
                                        </div>
                                        ${completedBy ? `
                                            <div class='flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400'>
                                                <svg class='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/>
                                                </svg>
                                                <span>${completedBy}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `
            }

            // Create status tracking HTML with separate beautiful cards
            const statusTrackingHtml = `
                <li class='col-span-2 space-y-4'>
                    <div class='flex items-center gap-2 mb-4'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class='text-purple-600 dark:text-purple-400'>
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4 4"/>
                        </svg>
                        <h3 class='text-base font-bold text-gray-800 dark:text-gray-200'>Status Tracking</h3>
                    </div>
                    <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        ${createStatusCard(
                            'Bill Created',
                            'Initial bill has been generated for the admission',
                            statusData.bill_created === 1,
                            statusData.bill_created_date || null,
                            statusData.bill_created_by_user?.name || null,
                            statusData.bill_created === 1
                                ? `<svg class='w-4 h-4 ${statusData.bill_created ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                        ${createStatusCard(
                            'Final Bill',
                            'Final bill with all charges and discounts has been created',
                            statusData.final_bill_created === 1,
                            statusData.final_bill_created_date || null,
                            statusData.final_bill_created_by_user?.name || null,
                            statusData.final_bill_created === 1
                                ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                        ${createStatusCard(
                            'Discharged',
                            'Patient has been discharged from the facility',
                            statusData.discharged === 1,
                            statusData.discharged_date || null,
                            statusData.discharged_by_user?.name || null,
                            statusData.discharged === 1
                                ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                        ${createStatusCard(
                            'Payment Completed',
                            'All payments have been received and cleared',
                            statusData.payment_completed === 1,
                            statusData.payment_completed_date || null,
                            statusData.payment_completed_by_user?.name || null,
                            statusData.payment_completed === 1
                                ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                        ${createStatusCard(
                            'Bills Distributed',
                            'Bills have been distributed to service providers',
                            statusData.bills_distributed === 1,
                            statusData.bills_distributed_date || null,
                            statusData.bills_distributed_by_user?.name || null,
                            statusData.bills_distributed === 1
                                ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                        ${createStatusCard(
                            'Balance Distributed',
                            'All provider payments have been completed',
                            statusData.balance_distributed === 1,
                            statusData.balance_distributed_date || null,
                            statusData.balance_distributed_by_user?.name || null,
                            statusData.balance_distributed === 1
                                ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
                                : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`
                        )}
                    </div>
                </li>
            `

            // Helper function to safely format dates
            const safeFormatDate = (dateInput: string | Date | null | undefined) => {
                if (!dateInput) return '-'
                if (dateInput === '-') return '-'

                let date: Date
                if (dateInput instanceof Date) {
                    date = dateInput
                } else {
                    // Try to parse the date string
                    date = new Date(dateInput)
                }

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    // Try parsing as ISO string (YYYY-MM-DD)
                    const parts = String(dateInput).split('-')
                    if (parts.length === 3) {
                        const [year, month, day] = parts
                        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                        if (isNaN(date.getTime())) {
                            return String(dateInput) // Return original if still invalid
                        }
                    } else {
                        return String(dateInput) // Return original if not YYYY-MM-DD format
                    }
                }

                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            }

            // Helper function to format date for timeline
            const formatTimelineDate = (dateStr: string | null) => {
                return safeFormatDate(dateStr)
            }

            // Helper function to create timeline item HTML with print button
            const createTimelineItem = (title: string, isCompleted: boolean, date: string | null, completedBy: string | null, id: string = '') => {
                const dotColor = isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                const textColor = isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                const pendingLabel = isCompleted ? '' : ' (Pending)'

                // Generate print URL for completed steps
                let printUrl = ''
                if (isCompleted && id) {
                    const stepKey = title.toLowerCase().replace(/\s+/g, '-')
                    printUrl = `/admission/patients/${id}/print/${stepKey}`
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
                                <a href='${printUrl}' target='_blank' class='flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors no-underline'>
                                    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                                        <polyline points='6 9 6 2 18 2 18 9'></polyline>
                                        <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'></path>
                                        <rect x='6' y='14' width='12' height='8'></rect>
                                    </svg>
                                    Print
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `
            }

            // Calculate payment percentages
            const totalAmount = finalBillData ? parseFloat(finalBillData.total_discounted_amount) : 0
            const paidAmount = finalBillData ? parseFloat(finalBillData.paid_amount) : 0
            const dueAmount = finalBillData ? parseFloat(finalBillData.due_amount) : 0
            const paymentPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

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
                                <div class='grid md:grid-cols-2 gap-4 text-sm'>
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
                                        formatTimelineDate(statusData.bill_created_date || null),
                                        statusData.bill_created_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Final Bill',
                                        statusData.final_bill_created === 1,
                                        formatTimelineDate(statusData.final_bill_created_date || null),
                                        statusData.final_bill_created_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Discharged',
                                        statusData.discharged === 1,
                                        formatTimelineDate(statusData.discharged_date || null),
                                        statusData.discharged_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Payment Completed',
                                        statusData.payment_completed === 1,
                                        formatTimelineDate(statusData.payment_completed_date || null),
                                        statusData.payment_completed_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Bills Distributed',
                                        statusData.bills_distributed === 1,
                                        formatTimelineDate(statusData.bills_distributed_date || null),
                                        statusData.bills_distributed_by_user?.name || null,
                                        id
                                    )}
                                    ${createTimelineItem(
                                        'Balance Distributed',
                                        statusData.balance_distributed === 1,
                                        formatTimelineDate(statusData.balance_distributed_date || null),
                                        statusData.balance_distributed_by_user?.name || null,
                                        id
                                    )}
                                </div>
                            </div>

                        </div>

                        <!-- RIGHT SIDE PAYMENT CARD -->
                        <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>

                            <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Payment Summary</h3>

                            ${statusData.bill_created === 1 ? `
                                <div class='space-y-3 text-sm'>
                                    <div class='flex justify-between items-center'>
                                        <span class='text-gray-500 dark:text-gray-400'>Bill Created</span>
                                        <span class='font-semibold text-green-600 dark:text-green-400'>
                                            ${statusData.bill_created_date ? formatTimelineDate(statusData.bill_created_date) : 'N/A'}
                                        </span>
                                    </div>
                                    <div class='flex justify-between'>
                                        <span class='text-gray-500 dark:text-gray-400'>Total Bill Amount</span>
                                        <span class='font-bold text-lg text-blue-600 dark:text-blue-400'>
                                            ${format(parseFloat(row.total_bill_amount || 0))}
                                        </span>
                                    </div>
                                    <div class='pt-2'>
                                        <p class='text-xs text-gray-500 dark:text-gray-400'>
                                            ${statusData.final_bill_created === 1 ? 'Final bill has been created.' : 'Final bill is pending. Click "Create Final Bill" to complete the process.'}
                                        </p>
                                    </div>
                                </div>
                            ` : ''}

                            ${!finalBillData && statusData.bill_created === 0 ? `
                                <div class='space-y-3 text-sm'>
                                    <div class='flex justify-between'>
                                        <span class='text-gray-500 dark:text-gray-400'>Advance Payments</span>
                                        <span class='font-semibold'>
                                            ${advancePaymentsData && advancePaymentsData.total_amount ? format(parseFloat(advancePaymentsData.total_amount)) : format(0)}
                                        </span>
                                    </div>
                                    <p class='text-xs text-gray-500 dark:text-gray-400 pt-3'>
                                        Bill not created yet. Add billing items and create bill to proceed.
                                    </p>
                                </div>
                            ` : ''}

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
                            ` : ''}

                            <!-- ACTION BUTTONS -->
                            <div class='flex flex-row flex-wrap gap-3 pt-4 w-full max-w-full box-border'>
                                <a href="/admission/patients/${id}/print" class='flex-1 min-w-[140px] text-center px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow transition no-underline box-border'>
                                    Print Details
                                </a>

                                ${statusData.bill_created === 1 ? `
                                    <button onclick="window.location.href='/admission/patients/${id}/billing'" class='flex-1 min-w-[140px] px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                                        View Billing
                                    </button>
                                ` : `
                                    <button onclick="window.location.href='/admission/patients/${id}/billing'" class='flex-1 min-w-[140px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                                        Add Billing
                                    </button>
                                `}
                                ${statusData.bill_created === 0 ? `
                                <button onclick="handleAdvancePayment('${id}')" class='flex-1 min-w-[140px] inline-flex justify-center items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                    Advance Payment
                                </button>
                                ` : ''}
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
            cell.colSpan = 10
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
    }, [currencySymbol, format])

    // Make handleAdvancePayment and printAdmissionForm available globally
    useEffect(() => {
        const handleAdvancePayment = (admissionId: string) => {
            // Pre-fill from payment mappings settings
            const mappings = (paymentMappingsData as any)?.data || {}
            const advanceMapping = mappings.indoor_advance_payment || {}
            const methods: { name: string; account_id: number }[] = advanceMapping.methods || []
            const firstMethod = methods[0] || { name: 'Cash', account_id: null }

            setAdvancePaymentModal({
                open: true,
                admissionId,
                amount: '',
                notes: '',
                paymentMethod: firstMethod.name,
                debitAccountId: firstMethod.account_id ? String(firstMethod.account_id) : '',
                creditAccountId: advanceMapping.credit_account_id ? String(advanceMapping.credit_account_id) : '',
                narration: advanceMapping.narration_template
                    ? advanceMapping.narration_template.replace('{admission_id}', admissionId)
                    : `Advance payment for admission #${admissionId}`,
            })
        }

        const printAdmissionForm = (admissionId: string) => {
            const data = (window as any).admissionDataForPrint
            if (!data || data.id !== admissionId) {
                alert('Please expand the admission details first.')
                return
            }

            // Create payment info text
            let paymentInfo = ''
            if (data.finalBillData) {
                paymentInfo = `
                    <div style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 8px;">
                        <strong>Payment Information</strong>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 12px;">
                            <div>Total Amount: ${format(parseFloat(data.finalBillData.total_discounted_amount))}</div>
                            <div>Paid: ${format(parseFloat(data.finalBillData.paid_amount))}</div>
                            <div>Due: ${format(parseFloat(data.finalBillData.due_amount))}</div>
                            <div>Status: ${data.finalBillData.status.charAt(0).toUpperCase() + data.finalBillData.status.slice(1)}</div>
                        </div>
                    </div>
                `
            } else if (data.advancePaymentsData && data.advancePaymentsData.payments && data.advancePaymentsData.payments.length > 0) {
                const paymentRows = data.advancePaymentsData.payments.map((p: any) => {
                    const paymentDate = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'
                    return `<div style="padding: 5px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                        ${format(parseFloat(p.amount))} - ${paymentDate}${p.notes ? ' (' + p.notes + ')' : ''}
                    </div>`
                }).join('')
                paymentInfo = `
                    <div style="margin-top: 15px; padding: 10px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                        <strong>Advance Payments (${format(parseFloat(data.advancePaymentsData.total_amount))})</strong>
                        <div style="margin-top: 8px;">${paymentRows}</div>
                        <div style="margin-top: 5px; font-size: 11px; color: #1d4ed8;">${data.advancePaymentsData.payment_count} payment(s) recorded</div>
                    </div>
                `
            } else {
                paymentInfo = `<div style="margin-top: 10px; color: #6b7280; font-size: 12px;">No payments recorded yet</div>`
            }

            // Create print content
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Admission Form - ${data.patientName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 14px; color: #1f2937; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
                        .header h1 { margin: 0; color: #1e40af; font-size: 24px; }
                        .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                        .info-item { margin-bottom: 8px; }
                        .info-label { font-weight: bold; color: #374151; display: inline-block; min-width: 120px; }
                        .info-value { color: #1f2937; }
                        .status-active { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                        .status-discharged { background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                        .status-critical { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Hospital Admission Form</h1>
                        <p>Admission ID: ${data.id} | Date: ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">Patient Information</div>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">Patient Name:</span> <span class="info-value">${data.patientName}</span></div>
                            <div class="info-item"><span class="info-label">Age/Sex:</span> <span class="info-value">${data.age}/${data.sex}</span></div>
                            <div class="info-item"><span class="info-label">Phone:</span> <span class="info-value">${data.phone}</span></div>
                            <div class="info-item"><span class="info-label">Status:</span> <span class="status-${data.status}">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</span></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Admission Details</div>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">Admission Date:</span> <span class="info-value">${data.admissionDate}</span></div>
                            <div class="info-item"><span class="info-label">Discharge Date:</span> <span class="info-value">${data.dischargeDate}</span></div>
                            <div class="info-item"><span class="info-label">Bed/Cabin:</span> <span class="info-value">${data.bedCabin}</span></div>
                            <div class="info-item"><span class="info-label">Doctor:</span> <span class="info-value">${data.doctor}</span></div>
                        </div>
                        <div class="info-item" style="margin-top: 10px;"><span class="info-label">Diagnosis:</span> <span class="info-value">${data.diagnosis}</span></div>
                    </div>

                    <div class="section">
                        <div class="section-title">Financial Information</div>
                        ${paymentInfo}
                    </div>

                    <div class="section">
                        <div class="section-title">Record Information</div>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">Created By:</span> <span class="info-value">${data.createdBy}</span></div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>This is a computer-generated admission form from Sheba Hospital Management System</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
                </html>
            `

            // Open print window
            const printWindow = window.open('', '_blank', 'width=800,height=600')
            if (printWindow) {
                printWindow.document.write(printContent)
                printWindow.document.close()
                printWindow.onload = () => {
                    printWindow.focus()
                    printWindow.print()
                }
            }
        }

        ;(window as any).handleAdvancePayment = handleAdvancePayment
        ;(window as any).printAdmissionForm = printAdmissionForm
        return () => {
            delete (window as any).handleAdvancePayment
            delete (window as any).printAdmissionForm
        }
    }, [paymentMappingsData])

    // Auto-update debit account when payment method changes in the modal
    useEffect(() => {
        if (!advancePaymentModal.open || !advancePaymentModal.paymentMethod) return
        const mappings = (paymentMappingsData as any)?.data || {}
        const advanceMapping = mappings.indoor_advance_payment || {}
        const methods: { name: string; account_id: number }[] = advanceMapping.methods || []
        const matched = methods.find((m: any) => m.name.toLowerCase() === advancePaymentModal.paymentMethod.toLowerCase())
        if (matched?.account_id) {
            setAdvancePaymentModal(prev => ({
                ...prev,
                debitAccountId: String(matched.account_id),
            }))
        }
    }, [advancePaymentModal.paymentMethod, advancePaymentModal.open, paymentMappingsData])

    // Get available payment methods from settings for the dropdown
    const getPaymentMethodOptions = (): { name: string }[] => {
        const mappings = (paymentMappingsData as any)?.data || {}
        const advanceMapping = mappings.indoor_advance_payment || {}
        return advanceMapping.methods || []
    }

    const handleAdvancePaymentSubmit = () => {
        if (!advancePaymentModal.admissionId || !advancePaymentModal.amount) {
            alert('Please enter an amount')
            return
        }
        advancePaymentMutation.mutate({
            admissionId: advancePaymentModal.admissionId,
            amount: advancePaymentModal.amount,
            notes: advancePaymentModal.notes,
            paymentMethod: advancePaymentModal.paymentMethod,
            debitAccountId: advancePaymentModal.debitAccountId,
            creditAccountId: advancePaymentModal.creditAccountId,
            narration: advancePaymentModal.narration,
        })
    }

    return (
        <>
            {/* Advance Payment Modal */}
            {advancePaymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold">Record Advance Payment</h2>
                            </div>
                            <button
                                onClick={() => setAdvancePaymentModal({ ...advancePaymentModal, open: false })}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (৳)</label>
                                <input
                                    type="number"
                                    value={advancePaymentModal.amount}
                                    onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Method</label>
                                <select
                                    value={advancePaymentModal.paymentMethod}
                                    onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                                >
                                    <option value="">Select method</option>
                                    {getPaymentMethodOptions().map((m, i) => (
                                        <option key={i} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={advancePaymentModal.notes}
                                    onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                                    placeholder="Add notes (optional)"
                                    rows={2}
                                />
                            </div>

                            {/* Journal Entry Details - Double Entry View */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                        Double Entry
                                    </h3>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Narration</label>
                                        <input
                                            type="text"
                                            value={advancePaymentModal.narration}
                                            onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, narration: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-sm"
                                            placeholder={`Advance payment for admission #${advancePaymentModal.admissionId || ''}`}
                                        />
                                    </div>

                                    {/* Double Entry Table */}
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800">
                                                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[40%]">Account</th>
                                                <th className="text-right px-3 py-2 font-semibold text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-gray-700">Debit</th>
                                                <th className="text-right px-3 py-2 font-semibold text-red-500 border-b border-gray-200 dark:border-gray-700">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Debit Row */}
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="px-1 py-2">
                                                    <select
                                                        value={advancePaymentModal.debitAccountId}
                                                        onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, debitAccountId: e.target.value })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-xs"
                                                    >
                                                        <option value="">Select debit account</option>
                                                        {accounts.map((acc: any) => (
                                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {advancePaymentModal.amount && parseFloat(advancePaymentModal.amount) > 0 ? (
                                                        <span className="font-semibold text-green-600 dark:text-green-400">{format(parseFloat(advancePaymentModal.amount))}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-400">-</td>
                                            </tr>
                                            {/* Credit Row */}
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="px-1 py-2">
                                                    <select
                                                        value={advancePaymentModal.creditAccountId}
                                                        onChange={(e) => setAdvancePaymentModal({ ...advancePaymentModal, creditAccountId: e.target.value })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-xs"
                                                    >
                                                        <option value="">Select credit account</option>
                                                        {accounts.map((acc: any) => (
                                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-400">-</td>
                                                <td className="px-3 py-2 text-right">
                                                    {advancePaymentModal.amount && parseFloat(advancePaymentModal.amount) > 0 ? (
                                                        <span className="font-semibold text-red-500">{format(parseFloat(advancePaymentModal.amount))}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                                                <td className="px-3 py-2">Total</td>
                                                <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                                    {advancePaymentModal.amount && parseFloat(advancePaymentModal.amount) > 0
                                                        ? format(parseFloat(advancePaymentModal.amount))
                                                        : format(0)}
                                                </td>
                                                <td className="px-3 py-2 text-right text-red-500">
                                                    {advancePaymentModal.amount && parseFloat(advancePaymentModal.amount) > 0
                                                        ? format(parseFloat(advancePaymentModal.amount))
                                                        : format(0)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    {/* Balance indicator */}
                                    {advancePaymentModal.amount && parseFloat(advancePaymentModal.amount) > 0 && (
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
                                            advancePaymentModal.debitAccountId && advancePaymentModal.creditAccountId
                                                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        }`}>
                                            {advancePaymentModal.debitAccountId && advancePaymentModal.creditAccountId ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                                    Balanced - Entry is valid
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                                    Select both accounts to complete the entry
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setAdvancePaymentModal({ ...advancePaymentModal, open: false })}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdvancePaymentSubmit}
                                    disabled={advancePaymentMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {advancePaymentMutation.isPending ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Recording...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="w-4 h-4" />
                                            Record Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AppHeader fixed />

            <Main fluid className="p-4 w-full flex-1 dark:bg-black/20">
                <style>{`
                    .status-sub-row td { border: none !important; }
                    .status-sub-row:hover td { background: transparent !important; }
                    tr.status-sub-row { pointer-events: none; }
                    tr.status-sub-row span { pointer-events: auto; }
                `}</style>
                <div className="space-y-4 mx-auto">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="">
                            <h1 className="text-2xl font-bold ">
                                Admitted Patients
                            </h1>
                            <p className="">
                                Manage and monitor all admitted patients
                            </p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/admission/new-admission'}
                        >
                            <UserPlus className="h-4 w-4" />
                            New Admission
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
                        createdRow={createdRow}
                        filterSlot={
                            <Popover open={openFilter} onOpenChange={setOpenFilter}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {statusFilter !== "all" ? `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}` : "Filter Status"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search status..." />
                                        <CommandList>
                                            <CommandEmpty>No status found.</CommandEmpty>
                                            <CommandGroup>
                                                {["all", "active", "discharged", "critical"].map((status) => (
                                                    <CommandItem
                                                        key={status}
                                                        value={status}
                                                        onSelect={(currentValue) => {
                                                            setStatusFilter(currentValue === statusFilter ? "all" : currentValue)
                                                            setOpenFilter(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                statusFilter === status ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        }
                    />
                </div>
            </Main>
        </>
    )
}
