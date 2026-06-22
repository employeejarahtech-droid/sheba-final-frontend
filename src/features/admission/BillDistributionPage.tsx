import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import {
    FileText,
    Loader2,
    ArrowLeft,
    DollarSign,
    Users,
    CheckCircle,
    AlertCircle,
    Plus,
    HandCoins,
    User,
    Receipt,
    Save
} from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const API_URL = import.meta.env.VITE_API_URL

type Distribution = {
    id: number
    admission_id: number
    final_bill_id: number
    service_provided_by: 'Surgeon' | 'Anesthetist' | 'Assistant' | 'Consultant' | 'Clinical Service' | 'Other' | 'Operation'
    provider_id?: number
    provider_name?: string
    doctor?: {
        id: number
        doctor_name: string
    }
    clinicService?: {
        id: number
        name: string
    }
    bill_amount: number
    less_amount: number
    final_bill: number
    pay_now: number
    due_amount: number
    payment_status: 'pending' | 'partial' | 'paid'
    notes?: string
    created_at: string
}

type DistributionSummary = {
    total_bill_amount: number
    total_less_amount: number
    total_payable: number
    total_paid: number
    total_due: number
    by_provider: Record<string, any>
    payment_status_count: {
        pending: number
        partial: number
        paid: number
    }
}

type FinalBill = {
    id: number
    admission_id: number
    total_bill_amount: number
    total_discount: number
    total_discounted_amount: number
    status: string
    paid_amount: number
    due_amount: number
    admission?: {
        patient_name: string
        admission_date: string
        discharge_date?: string
    }
}

type PatientPayment = {
    id: number
    final_bill_id: number
    admission_id: number
    amount: number
    payment_date: string
    notes?: string
    payment_method: string
    created_at: string
}

type BillDistributionPageProps = {
    admissionId: string | number
}

export function BillDistributionPage({ admissionId }: BillDistributionPageProps) {
    const { currencySymbol, format } = useCurrency()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')

    // Dialog states
    const [openCreateDialog, setOpenCreateDialog] = useState(false)
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
    const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null)
    const [selectedPaymentForDist, setSelectedPaymentForDist] = useState<(PatientPayment & { cumulativeAmount: number }) | null>(null)
    const [openDistDialog, setOpenDistDialog] = useState(false)
    const [customAllocations, setCustomAllocations] = useState<{ providers: Record<number, number | string>; retention: number | string }>({ providers: {}, retention: 0 })

    // Form state
    const [formData, setFormData] = useState({
        service_provided_by: '',
        provider_id: '',
        bill_amount: '',
        less_amount: '',
        notes: '',
    })
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')



    // State for editable less amounts per service
    const [serviceLessAmounts, setServiceLessAmounts] = useState<Record<string, number>>({})



    // Fetch final bill to get bill_id and patient info
    const { data: finalBillData, isLoading: billLoading } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Final bill not found. Please create the final bill first.')
                }
                throw new Error('Failed to fetch final bill')
            }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const finalBill: FinalBill | null = finalBillData?.data || null

    // Fetch patient payments against this admission
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['patient-payments', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch patient payments')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const payments: PatientPayment[] = useMemo(() => paymentsData?.data || [], [paymentsData?.data])

    const paymentsWithCumulative = useMemo(() => {
        const sorted = [...payments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
        let sum = 0
        return sorted.map(p => {
            sum += Number(p.amount)
            return {
                ...p,
                cumulativeAmount: sum
            }
        })
    }, [payments])



    // Fetch all billing items for the admission
    const { data: operationsData } = useQuery({
        queryKey: ['billing-operations', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/operations/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: consultantsData } = useQuery({
        queryKey: ['billing-consultants', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/consultants/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: surgeonsData } = useQuery({
        queryKey: ['billing-surgeons', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/surgeons/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: assistantsData } = useQuery({
        queryKey: ['billing-assistants', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/assistants/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: bedBillingData } = useQuery({
        queryKey: ['bed-billing', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/bed-cabins/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: servicesData } = useQuery({
        queryKey: ['billing-services', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/services/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: anesthesiologistsData } = useQuery({
        queryKey: ['billing-anesthesiologists', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/anesthesiologists/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const { data: outdoorBillsData } = useQuery({
        queryKey: ['outdoor-bills', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/outdoor-invoice?admission_id=${admissionId}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Helper function to safely get array from data
    const getArray = (data: any) => {
        if (!data) return []
        if (Array.isArray(data)) return data
        if (Array.isArray(data.data)) return data.data
        if (data.data?.items) return data.data.items
        if (data.data?.rows) return data.data.rows
        return []
    }

    // Combine all billing items
    const allBillItems = useMemo(() => {
        const rawItems = [
            ...getArray(operationsData).map((item: any) => ({
                id: item.id,
                type: 'Operation',
                service_name: item.operation_type,
                date: item.operation_date,
                amount: item.charges,
                provider_type: 'Operation',
                provider_name: '-',
            })),
            ...getArray(consultantsData).map((item: any) => ({
                id: item.id,
                type: 'Consultant',
                service_name: 'Consultation Visit',
                date: item.visit_date,
                amount: item.fees,
                provider_type: 'Consultant',
                provider_name: item.consultant_name || '-',
                provider_id: item.consultant_id,
            })),
            ...getArray(surgeonsData).map((item: any) => ({
                id: item.id,
                type: 'Surgeon',
                service_name: 'Surgery Fee',
                date: item.operation_date,
                amount: item.fees,
                provider_type: 'Surgeon',
                provider_name: item.surgeon_name || '-',
                provider_id: item.surgeon_id,
            })),
            ...getArray(assistantsData).map((item: any) => ({
                id: item.id,
                type: 'Assistant',
                service_name: 'Assistant Fee',
                date: item.operation_date,
                amount: item.fees,
                provider_type: 'Assistant',
                provider_name: item.assistant_name || '-',
                provider_id: item.assistant_id,
            })),
            ...getArray(bedBillingData).map((item: any) => ({
                id: `bed-${item.id}`,
                type: 'Bed Charges',
                service_name: `${item.bedCabin?.code || 'Bed'} (${item.bedCabin?.type || 'Cabin'})`,
                date: item.created_at?.split('T')[0] || item.assigned_date || '-',
                amount: item.total_amount || item.charges || 0,
                provider_type: 'Other',
                provider_name: 'Hospital',
            })),
            ...getArray(servicesData).map((item: any) => ({
                id: item.id,
                type: 'Service',
                service_name: item.service_name || item.note,
                date: item.created_at?.split('T')[0] || '-',
                amount: item.amount,
                provider_type: 'Clinical Service',
                provider_name: 'Hospital',
                provider_id: null,
            })),
            ...getArray(outdoorBillsData).map((item: any) => ({
                id: `outdoor-${item.id}`,
                type: 'Outdoor Bill',
                service_name: 'Outdoor Services',
                date: item.invoice_date,
                amount: item.net_amount,
                provider_type: 'Other',
                provider_name: '-',
            })),
            ...getArray(anesthesiologistsData).map((item: any) => ({
                id: item.id,
                type: 'Anesthesiologist',
                service_name: `Anesthesia - ${item.anesthesiologist_name || 'Unknown'}`,
                date: item.operation_date,
                amount: item.fees,
                provider_type: 'Anesthetist',
                provider_name: item.anesthesiologist_name || '-',
                provider_id: item.anesthesiologist_id,
            })),
        ];

        const tableMapping: Record<string, string> = {
            'Bed Charges': 'indoor_billing_bed_cabin',
            'Service': 'indoor_billing_services',
            'Anesthesiologist': 'indoor_billing_anesthesiologists',
            'Operation': 'indoor_billing_operations',
            'Consultant': 'indoor_billing_consultants',
            'Surgeon': 'indoor_billing_surgeons',
            'Assistant': 'indoor_billing_assistants'
        };

        return rawItems.map((item) => {
            let refId = item.id;
            if (typeof refId === 'string') {
                if (refId.startsWith('bed-')) {
                    refId = Number(refId.replace('bed-', ''));
                } else if (refId.startsWith('outdoor-')) {
                    refId = Number(refId.replace('outdoor-', ''));
                }
            }

            const matchingFinalBillItem = finalBill?.items?.find((fItem: any) => {
                return fItem.service_reference_table === tableMapping[item.type] &&
                    Number(fItem.service_reference_id) === Number(refId);
            });

            const discount = matchingFinalBillItem ? (Number(matchingFinalBillItem.total_discount) || 0) : 0;
            const netAmount = matchingFinalBillItem ? (Number(matchingFinalBillItem.final_amount) || 0) : (Number(item.amount) || 0);

            return {
                ...item,
                refId,
                discount,
                netAmount
            };
        });
    }, [operationsData, consultantsData, surgeonsData, assistantsData, bedBillingData, servicesData, outdoorBillsData, anesthesiologistsData, finalBill])

    const totalBillAmount = allBillItems.reduce((sum, item) => sum + (Number(item.netAmount) || 0), 0)

    // Fetch distributions
    const { data: distributionsData, isLoading: distributionsLoading } = useQuery({
        queryKey: ['distributions', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch distributions')
            return res.json()
        },
        enabled: !!token && !!admissionId && !!finalBill,
    })

    const allDistributions: Distribution[] = useMemo(() => distributionsData?.data || [], [distributionsData?.data])
    const distributions: Distribution[] = useMemo(() => allDistributions.filter(d => d.notes !== 'Clinic Part (Profit)'), [allDistributions])
    const clinicProfitRecord = useMemo(() => allDistributions.find(d => d.notes === 'Clinic Part (Profit)'), [allDistributions])

    // Match database distributions to local billing items robustly
    const matchedDistributions = useMemo(() => {
        const result: (Distribution | null)[] = new Array(allBillItems.length).fill(null)
        const matchedDistIds = new Set<number>()

        const typeMapping: Record<string, string> = {
            'Other': 'Bed Charges',
            'Clinical Service': 'Service',
            'Anesthetist': 'Anesthesiologist',
        }

        allBillItems.forEach((item, index) => {
            const itemType = item.type
            const netAmount = Number(item.netAmount) || 0

            // Find matching distribution that hasn't been matched yet
            const dist = distributions.find((d) => {
                if (matchedDistIds.has(d.id)) return false
                const distType = d.service_provided_by
                const mappedType = typeMapping[distType] || distType
                if (mappedType !== itemType) return false

                const distAmount = Number(d.bill_amount)
                const amountMatches = Math.abs(distAmount - netAmount) < 0.01
                const noteMatches = d.notes && item.service_name
                    ? (d.notes.includes(item.service_name) || item.service_name.includes(d.notes))
                    : false

                return amountMatches || noteMatches
            })

            if (dist) {
                matchedDistIds.add(dist.id)
                result[index] = dist
            }
        })

        return result
    }, [allBillItems, distributions])

    const distToItemMap = useMemo(() => {
        const map = new Map<number, any>()
        matchedDistributions.forEach((dist, index) => {
            if (dist) {
                map.set(dist.id, allBillItems[index])
            }
        })
        return map
    }, [matchedDistributions, allBillItems])

    const totalPayableAmount = useMemo(() => {
        return allBillItems.reduce((sum, item, index) => {
            const uniqueKey = `${item.type}-${item.service_name}-${index}`.replace(/\s+/g, '-')
            const isDistributed = !!matchedDistributions[index]
            const lessAmount = serviceLessAmounts[uniqueKey] ?? 0
            const netAmount = Number(item.netAmount) || 0
            const payableAmount = isDistributed || serviceLessAmounts[uniqueKey] !== undefined
                ? Math.max(0, netAmount - lessAmount)
                : 0
            return sum + payableAmount
        }, 0)
    }, [allBillItems, serviceLessAmounts, matchedDistributions])

    const totalLess = useMemo(() => {
        return Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0)
    }, [serviceLessAmounts])

    // Fetch summary
    const { data: summaryData } = useQuery({
        queryKey: ['distribution-summary', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch summary')
            return res.json()
        },
        enabled: !!token && !!admissionId && !!finalBill,
    })

    const summary: DistributionSummary | null = summaryData?.data || null

    const remainingPatientCash = useMemo(() => {
        if (!finalBill) return 0
        return Math.max(0, Number(finalBill.paid_amount || 0) - Number(summary?.total_paid || 0))
    }, [finalBill, summary?.total_paid])

    const maxPayableForSelected = useMemo(() => {
        if (!selectedDistribution) return 0
        return Math.min(Number(selectedDistribution.due_amount), remainingPatientCash)
    }, [selectedDistribution, remainingPatientCash])

    const retentionProfit = useMemo(() => {
        if (clinicProfitRecord) return Number(clinicProfitRecord.final_bill || 0)
        if (!summary) return 0
        return Number(summary.total_less_amount || 0)
    }, [clinicProfitRecord, summary])

    const sumProviderInputs = useMemo(() => {
        return distributions.reduce((sum, d) => sum + (Number(d.pay_now) || 0), 0)
    }, [distributions])

    const retentionPayable = useMemo(() => {
        if (clinicProfitRecord) return Number(clinicProfitRecord.pay_now || 0)
        const totalProvidersFinalBill = distributions.reduce((sum, d) => sum + (Number(d.final_bill) || 0), 0)
        if (totalProvidersFinalBill > 0) {
            const calc = sumProviderInputs * (retentionProfit / totalProvidersFinalBill)
            return Math.round(calc * 100) / 100
        }
        return 0
    }, [clinicProfitRecord, distributions, sumProviderInputs, retentionProfit])

    // Live payable totals — reactive to saved distributions and patient paid cash
    const payableColumnTotals = useMemo(() => {
        return {
            sumProviderInputs,
            retentionPayable,
            totalPayable: sumProviderInputs + retentionPayable,
        }
    }, [sumProviderInputs, retentionPayable])

    const remainingPatientCashToDistribute = useMemo(() => {
        const patientPaid = Number(finalBill?.paid_amount || 0)
        const currentRetentionPayable = payableColumnTotals.retentionPayable
        return Math.max(0, patientPaid - sumProviderInputs - currentRetentionPayable)
    }, [finalBill, sumProviderInputs, payableColumnTotals])

    const distributionTotals = useMemo(() => {
        let totalBilled = 0
        let totalLess = 0

        distributions.forEach((d) => {
            const matchingItem = distToItemMap.get(d.id)

            const discount = matchingItem ? Number(matchingItem.discount) : 0
            const displayedBilledAmount = matchingItem && Number(d.bill_amount) > Number(matchingItem.netAmount)
                ? Number(matchingItem.netAmount)
                : Number(d.bill_amount)

            const displayedLessAmount = matchingItem && Number(d.bill_amount) > Number(matchingItem.netAmount)
                ? Math.max(0, Number(d.less_amount) - discount)
                : Number(d.less_amount)

            totalBilled += displayedBilledAmount
            totalLess += displayedLessAmount
        })

        const payableSum = distributions.reduce((sum, d) => sum + (Number(d.final_bill) || 0), 0)
        const dueSum = distributions.reduce((sum, d) => sum + (Number(d.due_amount) || 0), 0)
        const { retentionPayable } = payableColumnTotals

        return {
            billed: totalBilled,
            less: totalLess,
            distributed: payableSum + retentionProfit,
            payable: payableSum,
            paid: sumProviderInputs + retentionPayable,
            due: dueSum + (retentionProfit - retentionPayable),
        }
    }, [distributions, distToItemMap, retentionProfit, sumProviderInputs, retentionPayable])

    const calculateDistributionsForAmount = useCallback((targetTotalPaid: number) => {
        const totalProvidersFinalBill = distributions.reduce((sum, d) => sum + (Number(d.final_bill) || 0), 0)
        const totalFinalBill = totalProvidersFinalBill + retentionProfit
        if (totalFinalBill <= 0) return { providers: {}, retention: 0 }

        // Proportional target for providers combined
        const targetTotalProviders = totalFinalBill > 0 ? (totalProvidersFinalBill / totalFinalBill) * targetTotalPaid : 0

        let allocatedSum = 0
        const allocations: Record<number, number> = {}

        // Calculate proportional targets for each provider and determine additional allocation
        distributions.forEach(d => {
            const targetPayable = totalFinalBill > 0 ? (Number(d.final_bill) / totalFinalBill) * targetTotalPaid : 0
            const additional = Math.max(0, Math.min(targetPayable - Number(d.pay_now), Number(d.due_amount)))
            const roundedAdditional = Math.round(additional * 100) / 100
            allocations[d.id] = roundedAdditional
            allocatedSum += roundedAdditional
        })

        // Proportional target for Retention Profit
        const targetRetention = totalFinalBill > 0 ? (retentionProfit / totalFinalBill) * targetTotalPaid : 0
        const currentRetention = retentionPayable
        const additionalRetention = Math.max(0, Math.min(targetRetention - currentRetention, retentionProfit - currentRetention))
        const roundedRetention = Math.round(additionalRetention * 100) / 100

        // Adjust rounding errors for providers so the sum of provider payables matches the target providers payable
        const expectedAdditionalProviders = Math.max(0, targetTotalProviders - sumProviderInputs)
        const diff = expectedAdditionalProviders - allocatedSum
        if (Math.abs(diff) > 0.005) {
            const firstActiveDist = distributions.find(d => allocations[d.id] > 0) || distributions[0]
            if (firstActiveDist) {
                allocations[firstActiveDist.id] = Math.round((allocations[firstActiveDist.id] + diff) * 100) / 100
            }
        }

        return {
            providers: allocations,
            retention: roundedRetention
        }
    }, [distributions, retentionProfit, retentionPayable, sumProviderInputs])

    // Populate custom allocations when payment is selected
    useEffect(() => {
        if (selectedPaymentForDist) {
            const initialAllocations = calculateDistributionsForAmount(selectedPaymentForDist.cumulativeAmount)
            setCustomAllocations(initialAllocations)
        } else {
            setCustomAllocations({ providers: {}, retention: 0 })
        }
    }, [selectedPaymentForDist, calculateDistributionsForAmount])

    const totalNewAllocations = useMemo(() => {
        const providersSum = Object.values(customAllocations.providers).reduce((sum, val) => sum + (Number(val) || 0), 0)
        return providersSum + (Number(customAllocations.retention) || 0)
    }, [customAllocations])

    const expectedAllocAmt = useMemo(() => {
        if (!selectedPaymentForDist) return 0
        const paymentAmt = Number(selectedPaymentForDist.amount)
        const totalRemainingDue = distributions.reduce((sum, d) => sum + Number(d.due_amount), 0) + Math.max(0, retentionProfit - retentionPayable)
        return Math.round(Math.min(paymentAmt, totalRemainingDue) * 100) / 100
    }, [selectedPaymentForDist, distributions, retentionProfit, retentionPayable])

    const allocationValidationError = useMemo(() => {
        if (!selectedPaymentForDist) return null

        // 1. Check if sum exceeds / doesn't match expected amount
        if (Math.abs(totalNewAllocations - expectedAllocAmt) > 0.01) {
            return `Total allocation (${format(totalNewAllocations)}) must equal the expected allocation (${format(expectedAllocAmt)}) for this payment.`
        }

        // 2. Check individual provider dues
        for (const d of distributions) {
            const alloc = Number(customAllocations.providers[d.id]) || 0
            const due = Number(d.due_amount)
            if (alloc > due + 0.01) {
                return `Allocation for ${d.service_provided_by} (${format(alloc)}) cannot exceed remaining due (${format(due)}).`
            }
        }

        // 3. Check clinic profit due
        if (retentionProfit > 0) {
            const alloc = Number(customAllocations.retention) || 0
            const due = retentionProfit - retentionPayable
            if (alloc > due + 0.01) {
                return `Allocation for Clinic Part (Profit) (${format(alloc)}) cannot exceed remaining due (${format(due)}).`
            }
        }

        return null
    }, [customAllocations, distributions, retentionProfit, retentionPayable, totalNewAllocations, expectedAllocAmt, selectedPaymentForDist, format])

    // List of distributions to be saved (amount > 0) based on patient paid amount
    const toProcessSave = useMemo(() => {
        const amt = Number(finalBill?.paid_amount) || 0
        if (amt <= 0) return []

        const allocations = calculateDistributionsForAmount(amt)

        const toSave = distributions.filter(d => {
            if (d.payment_status === 'paid') return false
            const addAmount = allocations.providers[d.id] || 0
            return addAmount > 0.005
        })

        if (clinicProfitRecord && clinicProfitRecord.payment_status !== 'paid' && allocations.retention > 0.005) {
            toSave.push(clinicProfitRecord)
        }

        return toSave
    }, [distributions, clinicProfitRecord, finalBill?.paid_amount, calculateDistributionsForAmount])



    // Populate serviceLessAmounts from existing distributions
    useEffect(() => {
        const newLessAmounts: Record<string, number> = {}
        matchedDistributions.forEach((dist, index) => {
            if (dist) {
                const item = allBillItems[index]
                const uniqueKey = `${item.type}-${item.service_name}-${index}`.replace(/\s+/g, '-')
                const lessAmount = Number(dist.less_amount)

                const isLegacy = Number(dist.bill_amount) > Number(item.netAmount)
                newLessAmounts[uniqueKey] = isLegacy
                    ? Math.max(0, lessAmount - (item.discount || 0))
                    : lessAmount
            }
        })
        setServiceLessAmounts(newLessAmounts)
    }, [matchedDistributions, allBillItems])

    // Fetch doctors for provider dropdown
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/doctor?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch doctors')
            return res.json()
        },
        enabled: !!token && openCreateDialog,
    })
    const doctors = doctorsData?.data?.items || doctorsData?.data?.rows || []

    // Save all distributions mutation
    const saveDistributionsMutation = useMutation({
        mutationFn: async () => {
            // Validation 1: Check final bill exists
            if (!finalBill?.id) {
                throw new Error('❌ Final bill not found.\nPlease create the final bill first.')
            }

            // Validation 2: Check we have items to distribute
            if (allBillItems.length === 0) {
                throw new Error('❌ No billing services found.\nAdd services to the bill first.')
            }

            // Valid service provider types
            const validProviderTypes = [
                'Surgeon', 'Anesthetist', 'Assistant', 'Consultant',
                'Clinical Service', 'Other', 'Operation'
            ]

            const results = []
            const errors = []
            const skipped = []

            console.log('=== Starting Distribution Save ===')
            console.log('Total items:', allBillItems.length)
            console.log('Bill ID:', finalBill.id)
            console.log('Existing distributions:', distributions.length)

            // Process items one by one
            for (let index = 0; index < allBillItems.length; index++) {
                const item = allBillItems[index]
                const uniqueKey = `${item.type}-${item.service_name}-${index}`.replace(/\s+/g, '-')
                const lessAmount = serviceLessAmounts[uniqueKey] ?? 0
                const billAmount = Number(item.amount) || 0

                // Check if already distributed
                const isAlreadyDistributed = distributions.some((d: any) =>
                    d.service_provided_by === item.provider_type &&
                    d.notes?.includes(item.service_name)
                )

                if (isAlreadyDistributed) {
                    skipped.push({ item: item.service_name, reason: 'Already distributed' })
                    console.log(`⏭️ Skipping ${item.service_name} (already distributed)`)
                    continue
                }

                // Validate provider type
                const isValidProviderType = validProviderTypes.includes(item.provider_type)
                if (!isValidProviderType) {
                    errors.push({
                        item: item.service_name,
                        error: `Invalid provider type: "${item.provider_type}"`,
                        fix: `Valid types: ${validProviderTypes.join(', ')}`
                    })
                    console.error(`❌ Invalid provider type for ${item.service_name}: ${item.provider_type}`)
                    continue
                }

                // Validate amount
                if (billAmount <= 0) {
                    skipped.push({ item: item.service_name, reason: 'Zero amount' })
                    console.log(`⏭️ Skipping ${item.service_name} (zero amount)`)
                    continue
                }

                // Validate less amount
                const netAmount = Number(item.netAmount) || 0
                if (lessAmount < 0 || lessAmount > netAmount) {
                    errors.push({
                        item: item.service_name,
                        error: `Invalid deduction: ${lessAmount} (net bill: ${netAmount})`,
                        fix: 'Deduction must be between 0 and net bill amount'
                    })
                    continue
                }

                const payload = {
                    admission_id: Number(admissionId),
                    final_bill_id: finalBill.id,
                    service_provided_by: item.provider_type,
                    provider_id: item.provider_id || null,
                    bill_amount: netAmount,
                    less_amount: lessAmount,
                    pay_now: 0,
                    notes: item.service_name,
                }

                console.log(`✅ Creating distribution for "${item.service_name}":`, payload)

                try {
                    const res = await fetch(`${API_URL}/api/bill-distribution`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                    })

                    if (res.ok) {
                        results.push({ success: true, item: item.service_name })
                        console.log(`✅ Success: ${item.service_name}`)
                    } else {
                        // Try to parse error response
                        let errorData: any = {}
                        let rawText = ''
                        try {
                            rawText = await res.text()
                            console.error(`❌ Failed for ${item.service_name} (${res.status}):`, rawText)
                            errorData = JSON.parse(rawText)
                        } catch (e) {
                            console.error(`❌ Failed to parse error response for ${item.service_name}:`, rawText)
                            errorData = { message: `HTTP ${res.status}: ${rawText || 'Unknown error'}` }
                        }

                        // Handle duplicate errors gracefully
                        const errorMsg = errorData.message || errorData.error || rawText || 'Failed to create'
                        const isDuplicate = errorMsg.toLowerCase().includes('duplicate') ||
                            errorMsg.toLowerCase().includes('exists') ||
                            res.status === 409

                        if (isDuplicate) {
                            skipped.push({ item: item.service_name, reason: 'Already exists' })
                            console.log(`⏭️ Skipping ${item.service_name} (duplicate)`)
                        } else {
                            errors.push({
                                item: item.service_name,
                                error: errorMsg,
                                status: res.status,
                                details: errorData
                            })
                        }
                    }
                } catch (err: any) {
                    console.error(`❌ Network error for ${item.service_name}:`, err)
                    errors.push({
                        item: item.service_name,
                        error: err.message || 'Network error',
                    })
                }
            }

            // If there's clinic profit, also save it
            const isClinicAlreadyDistributed = allDistributions.some((d: any) =>
                d.notes === 'Clinic Part (Profit)'
            )

            if (totalLess > 0 && !isClinicAlreadyDistributed) {
                const clinicPayload = {
                    admission_id: Number(admissionId),
                    final_bill_id: finalBill.id,
                    service_provided_by: 'Other',
                    provider_id: null,
                    bill_amount: totalLess,
                    less_amount: 0,
                    pay_now: 0,
                    notes: 'Clinic Part (Profit)',
                }

                console.log('✅ Creating distribution for "Clinic Part (Profit)":', clinicPayload)

                try {
                    const res = await fetch(`${API_URL}/api/bill-distribution`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(clinicPayload),
                    })

                    if (res.ok) {
                        results.push({ success: true, item: 'Clinic Part (Profit)' })
                        console.log(`✅ Success: Clinic Part (Profit)`)
                    } else {
                        let rawText = ''
                        let errorMsg = 'Failed to create clinic profit'
                        try {
                            rawText = await res.text()
                            console.error(`❌ Clinic profit save failed (${res.status}):`, rawText)
                            const json = JSON.parse(rawText)
                            errorMsg = json.message || json.error || rawText
                        } catch (e) { }

                        errors.push({
                            item: 'Clinic Part (Profit)',
                            error: errorMsg
                        })
                    }
                } catch (err: any) {
                    console.error(`❌ Network error for clinic profit:`, err)
                    errors.push({
                        item: 'Clinic Part (Profit)',
                        error: err.message || 'Network error',
                    })
                }
            }

            console.log('=== Distribution Save Complete ===')
            console.log('✅ Created:', results.length)
            console.log('⏭️ Skipped:', skipped.length)
            console.log('❌ Errors:', errors.length)

            // Build result message
            let message = ''
            if (results.length > 0) {
                message += `✅ Created: ${results.length} distribution(s)\n`
            }
            if (skipped.length > 0) {
                message += `⏭️ Skipped: ${skipped.length} (already distributed)\n`
            }
            if (errors.length > 0) {
                const errorMessages = errors.map(e => `• ${e.item}: ${e.error}`).join('\n')
                message += `\n❌ Failed (${errors.length}):\n${errorMessages}`
                throw new Error(message)
            }

            if (results.length === 0 && skipped.length > 0) {
                return { skipped: skipped.length, message: 'All services already distributed' }
            }

            return { created: results.length, skipped: skipped.length, message }
        },
        onSuccess: (data: any) => {
            if (data.skipped && !data.created) {
                toast.info('All services are already distributed')
            } else {
                let msg = `Successfully saved ${data.created} distribution(s)`
                if (data.skipped) {
                    msg += ` (skipped ${data.skipped} already distributed)`
                }
                toast.success(msg)
            }
            queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
            setServiceLessAmounts({})
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to save distributions', {
                duration: 15000,
            })
        },
    })

    // Legacy auto-distribute mutation (keep for backward compatibility)
    const autoDistributeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}/auto-distribute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    final_bill: finalBill,
                    items: finalBill?.items || [],
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to auto-distribute')
            }
            return res.json()
        },
        onSuccess: (data) => {
            const count = data?.data?.length || 0
            toast.success(`Auto-distributed ${count} provider payments successfully`)
            queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to auto-distribute')
        },
    })

    // Create distribution mutation
    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch(`${API_URL}/api/bill-distribution`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...data,
                    admission_id: Number(admissionId),
                    final_bill_id: finalBill?.id,
                    bill_amount: Number(data.bill_amount),
                    less_amount: Number(data.less_amount),
                    pay_now: 0,
                    provider_id: data.provider_id ? Number(data.provider_id) : null,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Failed to create distribution')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Distribution added successfully')
            setOpenCreateDialog(false)
            resetForm()
            queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to add distribution')
        },
    })

    // Payment mutation
    const paymentMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/${selectedDistribution?.id}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                    payment_method: paymentMethod,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Failed to process payment')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Payment recorded successfully')
            setOpenPaymentDialog(false)
            setSelectedDistribution(null)
            setPaymentAmount('')
            queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to process payment')
        },
    })


    // Batch payable update for a specific payment's cumulative total
    const [isBatchSaving, setIsBatchSaving] = useState(false)
    const distributeSpecificPayment = async (
        targetAmt: number,
        customAllocationsParam?: { providers: Record<number, number>; retention: number }
    ) => {
        setIsBatchSaving(true)
        let successCount = 0
        const errors: string[] = []

        const allocations = customAllocationsParam || calculateDistributionsForAmount(targetAmt)

        // Find distributions that have a delta > 0 for this targetAmt
        const toSave = distributions.filter(d => {
            if (d.payment_status === 'paid') return false
            const addAmount = allocations.providers[d.id] || 0
            return addAmount > 0.005
        })

        if (clinicProfitRecord && clinicProfitRecord.payment_status !== 'paid' && allocations.retention > 0.005) {
            toSave.push(clinicProfitRecord)
        }

        if (toSave.length === 0) {
            toast.error('No new provider payables are available to save for this payment.')
            setIsBatchSaving(false)
            return false
        }

        for (const dist of toSave) {
            const isClinic = dist.notes === 'Clinic Part (Profit)'
            const addAmount = isClinic ? allocations.retention : (allocations.providers[dist.id] || 0)
            if (addAmount <= 0) continue

            const newPayNow = Number(dist.pay_now) + addAmount

            try {
                const res = await fetch(`${API_URL}/api/bill-distribution/${dist.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ pay_now: newPayNow }),
                })
                if (!res.ok) {
                    const err = await res.json()
                    errors.push(`${dist.service_provided_by}: ${err.message || 'Failed'}`)
                } else {
                    successCount++
                }
            } catch (e: any) {
                errors.push(`${dist.service_provided_by}: ${e.message || 'Network error'}`)
            }
        }
        setIsBatchSaving(false)
        queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
        queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
        queryClient.invalidateQueries({ queryKey: ['patient-payments', admissionId] })

        if (errors.length > 0) {
            toast.error(`${successCount} saved, ${errors.length} failed:\n${errors.join('\n')}`, { duration: 10000 })
            return false
        } else {
            toast.success(`Payment distributed and provider payable(s) updated successfully`)
            return true
        }
    }

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`${API_URL}/api/bill-distribution/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to delete distribution')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Distribution deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['distributions', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['distribution-summary', admissionId] })
        },
        onError: () => {
            toast.error('Failed to delete distribution')
        },
    })

    const resetForm = () => {
        setFormData({
            service_provided_by: '',
            provider_id: '',
            bill_amount: '',
            less_amount: '',
            notes: '',
        })
    }

    const handleCreate = () => {
        if (!formData.service_provided_by || !formData.bill_amount || !finalBill?.id) {
            toast.error('Please fill in all required fields')
            return
        }
        createMutation.mutate(formData)
    }

    const handlePayment = () => {
        const amt = Number(paymentAmount)
        if (!paymentAmount || amt <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        if (amt > maxPayableForSelected) {
            toast.error(`Payment amount cannot exceed ${format(maxPayableForSelected)}. Remaining patient cash to distribute: ${format(remainingPatientCash)}`)
            return
        }
        paymentMutation.mutate()
    }

    const handleDistributePayment = async () => {
        if (!selectedPaymentForDist || allocationValidationError) return

        // Clean allocations to absolute numbers before sending to API
        const cleanProviders: Record<number, number> = {}
        Object.entries(customAllocations.providers).forEach(([key, val]) => {
            cleanProviders[Number(key)] = Number(val) || 0
        })
        const cleanRetention = Number(customAllocations.retention) || 0

        const success = await distributeSpecificPayment(
            selectedPaymentForDist.cumulativeAmount,
            { providers: cleanProviders, retention: cleanRetention }
        )
        if (success) {
            setOpenDistDialog(false)
            setSelectedPaymentForDist(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-none font-semibold', label: 'Pending' },
            partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-none font-semibold', label: 'Partially Distributed' },
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-none font-semibold', label: 'Fully Distributed' },
        }
        const variant = variants[status] || variants.pending
        return <Badge className={variant.color}>{variant.label}</Badge>
    }

    const getProviderInfo = (provider: string) => {
        const info: Record<string, { icon: string; color: string }> = {
            Surgeon: { icon: '👨‍⚕️', color: 'text-purple-600' },
            Anesthetist: { icon: '💉', color: 'text-pink-600' },
            Assistant: { icon: '🤝', color: 'text-blue-600' },
            Consultant: { icon: '🩺', color: 'text-green-600' },
            'Clinical Service': { icon: '🏥', color: 'text-cyan-600' },
            Operation: { icon: '🔧', color: 'text-orange-600' },
            Other: { icon: '📋', color: 'text-gray-600' },
        }
        return info[provider] || { icon: '📋', color: 'text-gray-600' }
    }

    const handleBack = () => {
        navigate({ to: '/dashboard/admission/patients/$admissionId/final-bill', params: { admissionId: String(admissionId) } })
    }

    // Loading state
    if (billLoading || distributionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading distributions...</p>
                </div>
            </div>
        )
    }

    // Error state - no final bill
    if (!finalBill) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Final Bill
                    </Button>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Final Bill Required</h3>
                            <p className="text-muted-foreground mb-6">
                                Please create the final bill before distributing payments.
                            </p>
                            <Button onClick={handleBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go to Final Bill
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const completionPercentage = distributionTotals.distributed ? Math.round((distributionTotals.paid / distributionTotals.distributed) * 100) : 0
    const admission = finalBill.admission || {}

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bill Distribution</h1>
                    <p className="text-muted-foreground">Bill #{finalBill.id} • Admission #{finalBill.admission_id}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Section 1: Patient & Bill Info */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Patient & Bill Information</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Patient identity and final bill summary</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div>
                            <Label className="text-muted-foreground">Patient Name</Label>
                            <p className="font-semibold text-lg">{admission?.patient_name || 'Unknown'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Admission Date</Label>
                            <p className="font-medium">{admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Discharge Date</Label>
                            <p className="font-medium">{admission?.discharge_date ? new Date(admission.discharge_date).toLocaleDateString() : 'Active'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Total Bill Amount</Label>
                            <p className="font-semibold text-lg">{format(finalBill?.total_discounted_amount || 0)}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Patient Paid</Label>
                            <p className="font-medium text-green-600">{format(finalBill?.paid_amount || 0)}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Patient Due</Label>
                            <p className={`font-bold ${(finalBill?.due_amount || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {format(finalBill?.due_amount || 0)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Provider Distribution Summary */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                                <HandCoins className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Provider Distribution Summary</CardTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Set provider payments and deductions</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {allBillItems.length} services • {format(totalBillAmount)} total
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {allBillItems.length > 0 ? (
                        <>
                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    💡 How to set provider payments:
                                </p>
                                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                    <li><strong>Bill Amount:</strong> Total charge to patient</li>
                                    <li><strong>Less (Deduction):</strong> Company profit kept by hospital</li>
                                    <li><strong>Payable:</strong> Amount to pay the service provider (Bill - Less)</li>
                                    <li className="text-green-700 dark:text-green-300 font-medium">Click "Save Distributions" below to create all records</li>
                                </ul>
                            </div>

                            {/* Summary Stats */}
                            {summary && distributions.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Total Distributed</Label>
                                        <p className="text-2xl font-bold">{format(distributionTotals.distributed)}</p>
                                        <p className="text-xs text-muted-foreground">{distributions.length} providers</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Total Paid</Label>
                                        <p className="text-2xl font-bold text-blue-600">{format(distributionTotals.paid)}</p>
                                        <p className="text-xs text-muted-foreground">{format(distributionTotals.due)} due</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Clinic Part (Profit)</Label>
                                        <p className="text-2xl font-bold text-green-600">
                                            {format(retentionProfit)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Clinic net profit share
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Completion</Label>
                                        <p className="text-2xl font-bold">{completionPercentage}%</p>
                                        <Progress value={completionPercentage} className="h-2 mt-2" />
                                    </div>
                                </div>
                            )}

                            {/* All Bill Services List */}
                            <div className="border rounded-lg overflow-hidden bg-card">
                                <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                                    <h3 className="text-sm font-semibold">All Services from Final Bill</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {allBillItems.filter((item, idx) => matchedDistributions[idx] || (Number(item.netAmount) || 0) <= 0).length} / {allBillItems.length} Distributed
                                    </span>
                                </div>
                                <div className="min-w-[800px] overflow-x-auto">
                                    {/* Grid Header */}
                                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b select-none">
                                        <div className="col-span-2">Service Type & ID</div>
                                        <div className="col-span-3">Service Name</div>
                                        <div className="col-span-2">Provider</div>
                                        <div className="col-span-1 text-right">Final Amount</div>
                                        <div className="col-span-2 text-right">Clinic Part (Profit)</div>
                                        <div className="col-span-1 text-right">Payable</div>
                                        <div className="col-span-1 text-center">Status</div>
                                    </div>

                                    {/* Grid Body */}
                                    <div className="divide-y divide-border">
                                        {allBillItems.map((item, index) => {
                                            const uniqueKey = `${item.type}-${item.service_name}-${index}`.replace(/\s+/g, '-')
                                            const lessAmount = serviceLessAmounts[uniqueKey] ?? 0
                                            const netAmount = Number(item.netAmount) || 0

                                            const isDistributed = !!matchedDistributions[index] || netAmount <= 0

                                            const payableAmount = isDistributed || serviceLessAmounts[uniqueKey] !== undefined
                                                ? Math.max(0, netAmount - lessAmount)
                                                : 0

                                            return (
                                                <div
                                                    key={uniqueKey}
                                                    className={cn(
                                                        "grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm transition-colors hover:bg-muted/30",
                                                        isDistributed ? "bg-green-50/20 dark:bg-green-950/10" : "bg-background"
                                                    )}
                                                >
                                                    <div className="col-span-2 flex flex-col items-start gap-1">
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border",
                                                            item.type === 'Operation' && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/30",
                                                            item.type === 'Consultant' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/30",
                                                            item.type === 'Surgeon' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30",
                                                            item.type === 'Assistant' && "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30",
                                                            item.type === 'Bed Charges' && "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800/30",
                                                            item.type === 'Service' && "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800/30",
                                                            item.type === 'Outdoor Bill' && "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-800/30",
                                                            item.type === 'Anesthesiologist' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/30"
                                                        )}>
                                                            {item.type === 'Service' ? 'Clinical Service' : item.type}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            #{item.refId}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <p className="font-medium text-sm truncate" title={item.service_name}>{item.service_name}</p>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                                                            <span>{item.date}</span>
                                                            {item.discount > 0 && (
                                                                <span className="text-red-500 font-medium dark:text-red-400">
                                                                    (Gross: {format(Number(item.amount) || 0)} • Disc: -{format(item.discount)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-sm font-medium truncate" title={item.provider_name}>{item.provider_name}</p>
                                                    </div>
                                                    <div className="col-span-1 text-right font-medium">
                                                        <p>{format(netAmount)}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        {isDistributed ? (
                                                            <p className="text-sm text-muted-foreground text-right pr-4 font-mono">
                                                                {lessAmount > 0 ? `-${format(lessAmount)}` : '0.00'}
                                                            </p>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-red-500 font-medium text-sm">-</span>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max={netAmount}
                                                                    step="0.01"
                                                                    value={serviceLessAmounts[uniqueKey] !== undefined ? serviceLessAmounts[uniqueKey] : ''}
                                                                    onChange={(e) => {
                                                                        const val = Math.min(netAmount, Math.max(0, Number(e.target.value) || 0))
                                                                        setServiceLessAmounts(prev => ({
                                                                            ...prev,
                                                                            [uniqueKey]: val
                                                                        }))
                                                                    }}
                                                                    className="w-28 h-8 text-right text-sm border-muted focus-visible:ring-1"
                                                                    placeholder="Deduction"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-span-1 text-right">
                                                        <p className={cn(
                                                            "font-bold text-sm",
                                                            payableAmount < netAmount ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                                                        )}>
                                                            {format(payableAmount)}
                                                        </p>
                                                    </div>
                                                    <div className="col-span-1 flex justify-center">
                                                        {isDistributed ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Done
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Grid Footer */}
                                    <div className="bg-muted/30 border-t">
                                        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold items-center">
                                            <div className="col-span-7 text-right text-muted-foreground font-bold">Total Bill:</div>
                                            <div className="col-span-1 text-right font-bold">{format(totalBillAmount)}</div>
                                            <div className="col-span-2 text-right font-bold text-red-600 dark:text-red-400">
                                                -{format(totalLess)}
                                            </div>
                                            <div className="col-span-1 text-right font-bold text-green-600 dark:text-green-400">
                                                {format(totalPayableAmount)}
                                            </div>
                                            <div className="col-span-1 text-center text-xs text-muted-foreground">
                                                {allBillItems.filter((item, idx) => matchedDistributions[idx] || (Number(item.netAmount) || 0) <= 0).length} / {allBillItems.length}
                                            </div>
                                        </div>
                                        {totalLess > 0 && (
                                            <div className="border-t border-green-100 dark:border-green-900/30 p-3 text-center bg-green-50/30 dark:bg-green-950/10">
                                                <p className="text-xs text-green-700 dark:text-green-300 font-semibold flex items-center justify-center gap-1">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Total Clinic Part (Profit): {format(totalLess)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Save Distributions button */}
                            {distributions.length === 0 && (
                                <div className="mt-6 space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                    Ready to save distributions for all services
                                                </p>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                    Total Payable: <strong>{format(totalPayableAmount)}</strong>
                                                    {' '}• Company Profit: <strong>{format(totalLess)}</strong>
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => saveDistributionsMutation.mutate()}
                                                disabled={saveDistributionsMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {saveDistributionsMutation.isPending ? (
                                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                                ) : (
                                                    <><Save className="w-4 h-4 mr-2" /> Save Distributions</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground mb-4">No billing services found</p>
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* Section 3: Distribution List */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-lg">
                                <Receipt className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Provider Distribution Records</CardTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Saved distribution entries and payable setup</p>
                            </div>
                        </div>
                        {distributions.length === 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveDistributionsMutation.mutate()}
                                disabled={saveDistributionsMutation.isPending}
                            >
                                {saveDistributionsMutation.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> Save All Distributions</>
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {distributions.length > 0 ? (
                        <div className="border-t overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[280px] pl-6">Provider</TableHead>
                                        <TableHead className="text-right">Final Amount</TableHead>
                                        <TableHead className="text-right">Clinic Part (Profit)</TableHead>
                                        <TableHead className="text-right font-bold text-green-700 dark:text-green-300">Distributed Amount</TableHead>
                                        <TableHead className="text-right font-bold text-green-700 dark:text-green-300">Payable (Saved)</TableHead>
                                        <TableHead className="text-right">Remaining Due</TableHead>
                                        <TableHead className="text-center w-[120px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {distributions.map((dist) => {
                                        const { icon, color } = getProviderInfo(dist.service_provided_by)
                                        const isPaid = dist.payment_status === 'paid'

                                        const matchingItem = distToItemMap.get(dist.id)

                                        const providerDisplayName = dist.doctor?.doctor_name || dist.clinicService?.name || dist.provider_name || matchingItem?.provider_name;

                                        const discount = matchingItem ? Number(matchingItem.discount) : 0
                                        const displayedBilledAmount = matchingItem && Number(dist.bill_amount) > Number(matchingItem.netAmount)
                                            ? Number(matchingItem.netAmount)
                                            : Number(dist.bill_amount)

                                        const displayedLessAmount = matchingItem && Number(dist.bill_amount) > Number(matchingItem.netAmount)
                                            ? Math.max(0, Number(dist.less_amount) - discount)
                                            : Number(dist.less_amount)

                                        // Payable = proportional share of patient paid, capped at dist.final_bill
                                        const totalProvidersFinalBill = distributions.reduce((sum, d) => sum + (Number(d.final_bill) || 0), 0)
                                        const patientPaidAmount = Number(finalBill?.paid_amount || 0)
                                        const effectivePaid = Math.min(patientPaidAmount, totalProvidersFinalBill)
                                        const rowPayable = totalProvidersFinalBill > 0
                                            ? Math.min(
                                                Number(dist.final_bill),
                                                (Number(dist.final_bill) / totalProvidersFinalBill) * effectivePaid
                                            )
                                            : 0

                                        return (
                                            <TableRow key={dist.id} className={cn(
                                                "transition-colors hover:bg-muted/50",
                                                isPaid && "bg-green-50/20 dark:bg-green-950/10 hover:bg-green-50/30 dark:hover:bg-green-950/20",
                                                dist.payment_status === 'partial' && "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                                            )}>
                                                <TableCell className="font-medium pl-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl" role="img" aria-label={dist.service_provided_by}>{icon}</span>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm">{dist.service_provided_by}</span>
                                                                {providerDisplayName && providerDisplayName !== '-' && (
                                                                    <span className="text-xs text-muted-foreground font-normal">• {providerDisplayName}</span>
                                                                )}
                                                            </div>
                                                            {dist.notes && (
                                                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] truncate" title={dist.notes}>
                                                                    {dist.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium py-3">
                                                    {format(displayedBilledAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-600 dark:text-red-400 py-3">
                                                    -{format(displayedLessAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600 dark:text-green-400 py-3">
                                                    {format(dist.final_bill)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium py-3">
                                                    {format(dist.pay_now)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold py-3">
                                                    <span className={dist.due_amount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                                                        {format(dist.due_amount)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-3">
                                                    {getStatusBadge(dist.payment_status)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {/* Clinic Part (Profit) Row */}
                                    {(() => {
                                        const { retentionPayable } = payableColumnTotals

                                        return (
                                            <TableRow className="bg-blue-50/10 dark:bg-blue-950/5 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 border-t border-muted-foreground/15">
                                                <TableCell className="font-medium pl-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl" role="img" aria-label="Clinic Part (Profit)">📈</span>
                                                        <div>
                                                            <span className="font-semibold text-sm">Clinic Part (Profit)</span>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                Clinic net profit share
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3 font-medium text-muted-foreground">-</TableCell>
                                                <TableCell className="text-right py-3 font-medium text-muted-foreground">-</TableCell>
                                                <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400 py-3">
                                                    {format(retentionProfit)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400 py-3">
                                                    {format(retentionPayable)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600 dark:text-green-400 py-3">
                                                    {format(0)}
                                                </TableCell>
                                                <TableCell className="text-center py-3">
                                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-none font-semibold">
                                                        Retained
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })()}
                                    {/* Total Row */}
                                    <TableRow className="font-bold bg-muted/40 border-t-2 border-muted-foreground/20 hover:bg-muted/50">
                                        <TableCell className="pl-6 py-3 text-left">Total</TableCell>
                                        <TableCell className="text-right py-3">{format(distributionTotals.billed)}</TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400 py-3">-{format(distributionTotals.less)}</TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400 py-3">{format(distributionTotals.distributed)}</TableCell>
                                        <TableCell className="text-right py-3">{format(distributionTotals.paid)}</TableCell>
                                        <TableCell className="text-right py-3">
                                            <span className={distributionTotals.due > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                                                {format(distributionTotals.due)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center py-3">-</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="m-4 text-center py-12 border-2 border-dashed rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <p className="text-muted-foreground mb-4">No distributions created yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Use the Save button above to create distributions</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 4: Patient Payments History */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-lg">
                            <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Patient Payments History</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">List of all payments made by patient against this admission</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {paymentsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : paymentsWithCumulative.length > 0 ? (
                        <div className="border-t overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="pl-6 w-[250px]">Amount Paid</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center w-[180px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentsWithCumulative.map((payment, index) => {
                                        let methodColor = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                        if (payment.payment_method === 'cash') {
                                            methodColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        } else if (payment.payment_method === 'online') {
                                            methodColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        } else if (payment.payment_method === 'bank_transfer') {
                                            methodColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        } else if (payment.payment_method === 'check') {
                                            methodColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        }

                                        const displayMethod = payment.payment_method
                                            ? payment.payment_method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                            : 'Cash'

                                        const isDistributed = payment.cumulativeAmount <= payableColumnTotals.totalPayable
                                        const isNextToDistribute = !isDistributed && (index === 0 || paymentsWithCumulative[index - 1].cumulativeAmount <= payableColumnTotals.totalPayable)

                                        return (
                                            <TableRow key={payment.id} className="transition-colors hover:bg-muted/50">
                                                <TableCell className="pl-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-green-600 dark:text-green-400">
                                                            {format(Number(payment.amount))}
                                                        </span>
                                                        <Badge className={cn("border-none text-[10px] font-semibold py-0.5 px-2", methodColor)}>
                                                            {displayMethod}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Payment ID: #{payment.id}</p>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <p className="text-sm font-medium">
                                                        {new Date(payment.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                    </p>
                                                    {payment.notes && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[300px]" title={payment.notes}>
                                                            {payment.notes}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-3">
                                                    {isDistributed ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Distributed
                                                        </span>
                                                    ) : isNextToDistribute ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] py-1 h-8"
                                                            onClick={() => {
                                                                setSelectedPaymentForDist(payment)
                                                                setOpenDistDialog(true)
                                                            }}
                                                        >
                                                            Final Distribute
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled
                                                            className="text-[11px] py-1 h-8 opacity-50"
                                                            title="Please distribute previous payments first"
                                                        >
                                                            Final Distribute
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="m-4 flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                            <Receipt className="w-10 h-10 opacity-30 mb-3" />
                            <p className="text-sm font-semibold">No payments recorded</p>
                            <p className="text-xs max-w-sm mt-1">No payment transaction records exist for this admission yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* Navigation to Next Step */}
            {summary?.payment_status_count?.paid === distributions.length && distributions.length > 0 && (
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-800 dark:text-green-300">
                                    <CheckCircle className="w-4 h-4 inline mr-2" />
                                    <strong>All providers paid!</strong> Ready to confirm balance
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate({ to: '/dashboard/admission/patients/$admissionId/confirm-balance', params: { admissionId: String(admissionId) } })}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Confirm Balance
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bottom Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Final Bill
                </Button>
            </div>

            {/* Create Distribution Dialog */}
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add Distribution Record
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Service Provider Type *</Label>
                            <Select
                                value={formData.service_provided_by}
                                onValueChange={(value) => setFormData({ ...formData, service_provided_by: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Surgeon">👨‍⚕️ Surgeon</SelectItem>
                                    <SelectItem value="Anesthetist">💉 Anesthetist</SelectItem>
                                    <SelectItem value="Assistant">🤝 Assistant</SelectItem>
                                    <SelectItem value="Consultant">🩺 Consultant</SelectItem>
                                    <SelectItem value="Clinical Service">🏥 Clinical Service</SelectItem>
                                    <SelectItem value="Operation">🔧 Operation</SelectItem>
                                    <SelectItem value="Other">📋 Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Provider (Optional)</Label>
                            <Select
                                value={formData.provider_id}
                                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((doc: any) => (
                                        <SelectItem key={doc.id} value={String(doc.id)}>
                                            {doc.doctor_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Final Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.bill_amount}
                                    onChange={(e) => setFormData({ ...formData, bill_amount: e.target.value })}
                                    placeholder="Patient's final bill"
                                />
                            </div>
                            <div>
                                <Label>Less/Deduction *</Label>
                                <Input
                                    type="number"
                                    value={formData.less_amount}
                                    onChange={(e) => setFormData({ ...formData, less_amount: e.target.value })}
                                    placeholder="Company profit"
                                />
                            </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                            <span className="text-sm">Payable: </span>
                            <span className="font-bold text-lg text-green-600 ml-2">
                                {format((Number(formData.bill_amount) || 0) - (Number(formData.less_amount) || 0))}
                            </span>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Add Distribution'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Record Payment to Provider
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDistribution && (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Provider:</span>
                                    <span className="font-medium">{selectedDistribution.service_provided_by}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Payable Amount:</span>
                                    <span className="font-semibold text-green-600">
                                        {format(selectedDistribution.final_bill)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Already Paid:</span>
                                    <span>{format(selectedDistribution.pay_now)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-orange-600">
                                    <span>Remaining Due:</span>
                                    <span>{format(selectedDistribution.due_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400 font-semibold border-t pt-2 border-muted-foreground/20">
                                    <span>Undistributed Patient Cash:</span>
                                    <span>{format(remainingPatientCash)}</span>
                                </div>
                            </div>
                            <div>
                                <Label>Payment Amount *</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        const val = Math.min(maxPayableForSelected, Math.max(0, Number(e.target.value) || 0))
                                        setPaymentAmount(e.target.value === '' ? '' : String(val))
                                    }}
                                    placeholder="Enter amount"
                                    max={maxPayableForSelected}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Maximum payable: {format(maxPayableForSelected)}
                                </p>
                            </div>
                            <div>
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenPaymentDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={paymentMutation.isPending || !paymentAmount}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {paymentMutation.isPending ? 'Processing...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Final Distribute Payment Dialog */}
            <Dialog open={openDistDialog} onOpenChange={(open) => {
                if (!open && !isBatchSaving) {
                    setOpenDistDialog(false)
                    setSelectedPaymentForDist(null)
                }
            }}>
                <DialogContent className="sm:max-w-[1200px] w-full max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HandCoins className="h-5 w-5 text-blue-600" />
                            Confirm Payable Distribution
                        </DialogTitle>
                    </DialogHeader>
                    {selectedPaymentForDist && (() => {
                        const targetAmt = selectedPaymentForDist.cumulativeAmount

                        // Parse payment method colors & details
                        let methodColor = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        if (selectedPaymentForDist.payment_method === 'cash') {
                            methodColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        } else if (selectedPaymentForDist.payment_method === 'online') {
                            methodColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        } else if (selectedPaymentForDist.payment_method === 'bank_transfer') {
                            methodColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        } else if (selectedPaymentForDist.payment_method === 'check') {
                            methodColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        }

                        const displayMethod = selectedPaymentForDist.payment_method
                            ? selectedPaymentForDist.payment_method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            : 'Cash'

                        return (
                            <div className="space-y-4">
                                {/* Payment Context Info Box */}
                                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3.5 rounded-lg border border-border">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Payment Amount</Label>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-bold text-green-600 dark:text-green-400">
                                                {format(Number(selectedPaymentForDist.amount))}
                                            </span>
                                            <Badge className={cn("border-none text-[10px] font-semibold py-0.5 px-1.5", methodColor)}>
                                                {displayMethod}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Payment Date</Label>
                                        <p className="font-semibold text-sm mt-0.5 text-foreground">
                                            {new Date(selectedPaymentForDist.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </p>
                                    </div>
                                    <div className="col-span-2 pt-1.5 border-t border-muted/70">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Cumulative Paid so far (target):</span>
                                            <span className="font-bold text-foreground">{format(targetAmt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-semibold text-foreground">Allocation Details</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Confirm or adjust the new allocations for each bill head. The total allocated sum must match the expected allocation.
                                    </p>
                                </div>

                                {/* Validation Error Alert */}
                                {allocationValidationError && (
                                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                                        <span>{allocationValidationError}</span>
                                    </div>
                                )}

                                {/* Preview Table */}
                                <div className="border rounded-md overflow-hidden max-h-[350px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/40 sticky top-0 backdrop-blur-sm z-10">
                                            <TableRow>
                                                <TableHead className="text-xs font-semibold py-2">Provider</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2">Final Amount</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2">Clinic Part (Profit)</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2 text-blue-600 dark:text-blue-400 font-bold">Total Payable</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2">Already Paid</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2 text-orange-600 dark:text-orange-400">Current Due</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2 w-[130px]">New Allocation</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2 text-green-600 font-bold">New Cumulative</TableHead>
                                                <TableHead className="text-right text-xs font-semibold py-2">New Due</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Provider List */}
                                            {distributions.map(d => {
                                                const currentSaved = Number(d.pay_now) || 0
                                                const addAmt = customAllocations.providers[d.id] ?? ''
                                                const numericAddAmt = Number(addAmt) || 0
                                                const newTotal = currentSaved + numericAddAmt
                                                const hasNewAllocation = numericAddAmt > 0.005

                                                const matchingItem = distToItemMap.get(d.id)
                                                const providerDisplayName = d.doctor?.doctor_name || d.clinicService?.name || d.provider_name || matchingItem?.provider_name

                                                const finalBillAmt = Number(d.final_bill) || 0
                                                const currentDue = Number(d.due_amount) || 0
                                                const newDue = Math.max(0, currentDue - numericAddAmt)

                                                const discount = matchingItem ? Number(matchingItem.discount) : 0
                                                const displayedBilledAmount = matchingItem && Number(d.bill_amount) > Number(matchingItem.netAmount)
                                                    ? Number(matchingItem.netAmount)
                                                    : Number(d.bill_amount)

                                                const displayedLessAmount = matchingItem && Number(d.bill_amount) > Number(matchingItem.netAmount)
                                                    ? Math.max(0, Number(d.less_amount) - discount)
                                                    : Number(d.less_amount)

                                                const isInvalid = numericAddAmt > currentDue + 0.005

                                                return (
                                                    <TableRow key={d.id} className={cn("hover:bg-muted/30 text-xs py-1", hasNewAllocation && "bg-blue-50/20 dark:bg-blue-950/10")}>
                                                        <TableCell className="font-medium py-2">
                                                            <div className="flex flex-col">
                                                                <span>{d.service_provided_by}</span>
                                                                {providerDisplayName && providerDisplayName !== '-' && (
                                                                    <span className="text-[10px] text-muted-foreground font-normal">{providerDisplayName}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-2">{format(displayedBilledAmount)}</TableCell>
                                                        <TableCell className="text-right py-2 text-red-600 dark:text-red-400 font-medium">-{format(displayedLessAmount)}</TableCell>
                                                        <TableCell className="text-right py-2 text-blue-600 dark:text-blue-400 font-bold">{format(finalBillAmt)}</TableCell>
                                                        <TableCell className="text-right py-2 text-muted-foreground">{format(currentSaved)}</TableCell>
                                                        <TableCell className="text-right py-2 text-orange-600 dark:text-orange-400 font-medium">{format(currentDue)}</TableCell>
                                                        <TableCell className="text-right py-1">
                                                            <div className="flex justify-end items-center gap-1">
                                                                <span className={cn("text-[10px]", currentDue <= 0.005 ? "text-muted-foreground/40" : "text-muted-foreground")}>+</span>
                                                                <Input
                                                                    type="number"
                                                                    readOnly={currentDue <= 0.005}
                                                                    className={cn(
                                                                        "w-24 text-right font-semibold h-7 py-0.5 px-2 text-xs focus:ring-1",
                                                                        currentDue <= 0.005
                                                                            ? "bg-muted/60 border-muted text-muted-foreground cursor-not-allowed opacity-60 select-none pointer-events-none"
                                                                            : isInvalid
                                                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 font-bold animate-pulse"
                                                                                : "border-muted-foreground/30 focus:border-blue-500 focus:ring-blue-500"
                                                                    )}
                                                                    value={currentDue <= 0.005 ? '0.00' : addAmt}
                                                                    onChange={(e) => {
                                                                        if (currentDue <= 0.005) return
                                                                        const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0)
                                                                        setCustomAllocations(prev => ({
                                                                            ...prev,
                                                                            providers: {
                                                                                ...prev.providers,
                                                                                [d.id]: val
                                                                            }
                                                                        }))
                                                                    }}
                                                                    placeholder="—"
                                                                    step="0.01"
                                                                    title={currentDue <= 0.005 ? "Already fully paid — no allocation needed" : undefined}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium py-2 text-green-600">{format(newTotal)}</TableCell>
                                                        <TableCell className={cn(
                                                            "text-right font-bold py-2",
                                                            newDue < -0.005 ? "text-red-600 dark:text-red-400 font-extrabold" : newDue === 0 ? "text-green-600 dark:text-green-400" : ""
                                                        )}>
                                                            {format(newDue)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}

                                            {/* Clinic Part (Profit) */}
                                            {retentionProfit > 0 && (() => {
                                                const currentSaved = retentionPayable
                                                const totalPayable = retentionProfit
                                                const currentDue = Math.max(0, totalPayable - currentSaved)
                                                const addAmt = customAllocations.retention ?? ''
                                                const numericAddAmt = Number(addAmt) || 0
                                                const newTotal = currentSaved + numericAddAmt
                                                const newDue = currentDue - numericAddAmt
                                                const hasNewAllocation = numericAddAmt > 0.005
                                                const isInvalid = numericAddAmt > currentDue + 0.005

                                                return (
                                                    <TableRow className={cn("hover:bg-muted/30 text-xs py-1 border-t border-muted/80", hasNewAllocation && "bg-blue-50/20 dark:bg-blue-950/10")}>
                                                        <TableCell className="font-medium py-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-amber-700 dark:text-amber-500">Clinic Part (Profit)</span>
                                                                <span className="text-[10px] text-muted-foreground font-normal">Hospital profit share</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-2 text-muted-foreground">-</TableCell>
                                                        <TableCell className="text-right py-2 text-muted-foreground">-</TableCell>
                                                        <TableCell className="text-right py-2 text-blue-600 dark:text-blue-400 font-bold">{format(totalPayable)}</TableCell>
                                                        <TableCell className="text-right py-2 text-muted-foreground">{format(currentSaved)}</TableCell>
                                                        <TableCell className="text-right py-2 text-orange-600 dark:text-orange-400 font-medium">{format(currentDue)}</TableCell>
                                                        <TableCell className="text-right py-1">
                                                            <div className="flex justify-end items-center gap-1">
                                                                <span className={cn("text-[10px]", currentDue <= 0.005 ? "text-muted-foreground/40" : "text-muted-foreground")}>+</span>
                                                                <Input
                                                                    type="number"
                                                                    readOnly={currentDue <= 0.005}
                                                                    className={cn(
                                                                        "w-24 text-right font-semibold h-7 py-0.5 px-2 text-xs focus:ring-1",
                                                                        currentDue <= 0.005
                                                                            ? "bg-muted/60 border-muted text-muted-foreground cursor-not-allowed opacity-60 select-none pointer-events-none"
                                                                            : isInvalid
                                                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 font-bold animate-pulse"
                                                                                : "border-muted-foreground/30 focus:border-blue-500 focus:ring-blue-500"
                                                                    )}
                                                                    value={currentDue <= 0.005 ? '0.00' : addAmt}
                                                                    onChange={(e) => {
                                                                        if (currentDue <= 0.005) return
                                                                        const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0)
                                                                        setCustomAllocations(prev => ({
                                                                            ...prev,
                                                                            retention: val
                                                                        }))
                                                                    }}
                                                                    placeholder="—"
                                                                    step="0.01"
                                                                    title={currentDue <= 0.005 ? "Already fully paid — no allocation needed" : undefined}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium py-2 text-green-600">{format(newTotal)}</TableCell>
                                                        <TableCell className={cn(
                                                            "text-right font-bold py-2",
                                                            newDue < -0.005 ? "text-red-600 dark:text-red-400 font-extrabold" : newDue === 0 ? "text-green-600 dark:text-green-400" : ""
                                                        )}>
                                                            {format(newDue)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })()}

                                            {/* Totals Row */}
                                            {(() => {
                                                const totalCurrentDue = distributions.reduce((sum, d) => sum + (Number(d.due_amount) || 0), 0) + Math.max(0, retentionProfit - retentionPayable)
                                                const totalNewDue = totalCurrentDue - totalNewAllocations

                                                return (
                                                    <TableRow className="bg-muted/60 font-bold border-t-2 border-muted text-xs">
                                                        <TableCell className="py-2">Total</TableCell>
                                                        <TableCell className="text-right py-2">{format(distributionTotals.billed)}</TableCell>
                                                        <TableCell className="text-right py-2 text-red-600 dark:text-red-400">-{format(distributionTotals.less)}</TableCell>
                                                        <TableCell className="text-right py-2 text-blue-600 dark:text-blue-400">
                                                            {format(
                                                                distributions.reduce((sum, d) => sum + (Number(d.final_bill) || 0), 0) +
                                                                retentionProfit
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-2 text-muted-foreground">
                                                            {format(
                                                                distributions.reduce((sum, d) => sum + (Number(d.pay_now) || 0), 0) +
                                                                retentionPayable
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-2 text-orange-600 dark:text-orange-400">
                                                            {format(totalCurrentDue)}
                                                        </TableCell>
                                                        <TableCell className="text-right py-2 text-blue-600 dark:text-blue-400">
                                                            +{format(totalNewAllocations)}
                                                        </TableCell>
                                                        <TableCell className="text-right py-2 text-green-600 font-bold">
                                                            {format(
                                                                distributions.reduce((sum, d) => sum + (Number(d.pay_now) || 0), 0) +
                                                                retentionPayable +
                                                                totalNewAllocations
                                                            )}
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-right py-2 font-bold",
                                                            totalNewDue < -0.005 ? "text-red-600 dark:text-red-400 font-extrabold" : totalNewDue === 0 ? "text-green-600 dark:text-green-400" : "text-foreground"
                                                        )}>
                                                            {format(totalNewDue)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    })()}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenDistDialog(false)
                                setSelectedPaymentForDist(null)
                            }}
                            disabled={isBatchSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDistributePayment}
                            disabled={isBatchSaving || !selectedPaymentForDist || !!allocationValidationError}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isBatchSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Confirm & Save
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    )
}
