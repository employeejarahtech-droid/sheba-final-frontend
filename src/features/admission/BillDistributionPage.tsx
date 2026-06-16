import { useState, useEffect } from 'react'
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
    bill_id: number
    service_provided_by: 'Surgeon' | 'Anesthetist' | 'Assistant' | 'Consultant' | 'Clinical Service' | 'Other' | 'Operation'
    provider_id?: number
    provider_name?: string
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
    const allBillItems = [
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
        })),
        ...getArray(surgeonsData).map((item: any) => ({
            id: item.id,
            type: 'Surgeon',
            service_name: 'Surgery Fee',
            date: item.operation_date,
            amount: item.fees,
            provider_type: 'Surgeon',
            provider_name: item.surgeon_name || '-',
        })),
        ...getArray(assistantsData).map((item: any) => ({
            id: item.id,
            type: 'Assistant',
            service_name: 'Assistant Fee',
            date: item.operation_date,
            amount: item.fees,
            provider_type: 'Assistant',
            provider_name: item.assistant_name || '-',
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
            provider_name: '-',
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
    ]

    const totalBillAmount = allBillItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

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

    const distributions: Distribution[] = distributionsData?.data || []

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

    // Populate serviceLessAmounts from existing distributions
    useEffect(() => {
        if (!distributions.length) {
            setServiceLessAmounts({})
            return
        }

        const newLessAmounts: Record<string, number> = {}

        // Match distributions to bill items
        // Distribution service_provided_by maps to item provider_type:
        // 'Other' -> 'Bed Charges'
        // 'Clinical Service' -> 'Service'
        // Others map directly (e.g., 'Surgeon' -> 'Surgeon')
        const typeMapping: Record<string, string> = {
            'Other': 'Bed Charges',
            'Clinical Service': 'Service',
        }

        distributions.forEach((dist) => {
            const distType = dist.service_provided_by
            const distAmount = Number(dist.bill_amount)
            const lessAmount = Number(dist.less_amount)

            // Find matching bill item
            const matchingItemIndex = allBillItems.findIndex((item) => {
                const itemType = typeMapping[distType] || distType
                return item.provider_type === itemType && Number(item.amount) === distAmount
            })

            if (matchingItemIndex !== -1) {
                const item = allBillItems[matchingItemIndex]
                const uniqueKey = `${item.type}-${item.service_name}-${matchingItemIndex}`.replace(/\s+/g, '-')
                newLessAmounts[uniqueKey] = lessAmount
            }
        })

        setServiceLessAmounts(newLessAmounts)
    }, [distributions, allBillItems])

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
                    errors.push({
                        item: item.service_name,
                        error: `Invalid amount: ${billAmount}`,
                        fix: 'Amount must be greater than 0'
                    })
                    continue
                }

                // Validate less amount
                if (lessAmount < 0 || lessAmount > billAmount) {
                    errors.push({
                        item: item.service_name,
                        error: `Invalid deduction: ${lessAmount} (bill: ${billAmount})`,
                        fix: 'Deduction must be between 0 and bill amount'
                    })
                    continue
                }

                const payload = {
                    admission_id: Number(admissionId),
                    bill_id: finalBill.id,
                    service_provided_by: item.provider_type,
                    provider_id: null,
                    bill_amount: billAmount,
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
                    bill_id: finalBill?.id,
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
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        paymentMutation.mutate()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Pending' },
            partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Partial' },
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Paid' },
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

    const completionPercentage = summary?.total_payable ? Math.round((summary?.total_paid / summary?.total_payable) * 100) : 0
    const admission = finalBill.admission || {}

    return (
        <div className="max-w-[1000px] mx-auto space-y-6">
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Patient & Bill Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <HandCoins className="w-5 h-5" />
                            Provider Distribution Summary
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {allBillItems.length} services • {format(totalBillAmount)} total
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                                        <Label className="text-muted-foreground">Total Payable</Label>
                                        <p className="text-2xl font-bold">{format(summary.total_payable || 0)}</p>
                                        <p className="text-xs text-muted-foreground">{distributions.length} providers</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Total Paid</Label>
                                        <p className="text-2xl font-bold text-blue-600">{format(summary.total_paid || 0)}</p>
                                        <p className="text-xs text-muted-foreground">{format(summary.total_due || 0)} due</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Company Retention</Label>
                                        <p className="text-2xl font-bold text-green-600">{format(summary.total_less_amount || 0)}</p>
                                        <p className="text-xs text-muted-foreground">Deductions</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Completion</Label>
                                        <p className="text-2xl font-bold">{completionPercentage}%</p>
                                        <Progress value={completionPercentage} className="h-2 mt-2" />
                                    </div>
                                </div>
                            )}

                            {/* All Bill Services List */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted px-4 py-2 border-b">
                                    <h3 className="text-sm font-semibold">All Services from Final Bill</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-3 text-xs font-medium">Type</th>
                                                <th className="text-left p-3 text-xs font-medium">Service Name</th>
                                                <th className="text-left p-3 text-xs font-medium">Provider</th>
                                                <th className="text-left p-3 text-xs font-medium">Date</th>
                                                <th className="text-right p-3 text-xs font-medium">Bill Amount</th>
                                                <th className="text-right p-3 text-xs font-medium">Less (Deduction)</th>
                                                <th className="text-right p-3 text-xs font-medium">Payable</th>
                                                <th className="text-center p-3 text-xs font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allBillItems.map((item, index) => {
                                                // Create a unique key combining type, service name, and index
                                                const uniqueKey = `${item.type}-${item.service_name}-${index}`.replace(/\s+/g, '-')
                                                const lessAmount = serviceLessAmounts[uniqueKey] ?? 0
                                                const billAmount = Number(item.amount) || 0
                                                const payableAmount = Math.max(0, billAmount - lessAmount)

                                                const isDistributed = distributions.some((d: any) =>
                                                    d.service_provided_by === item.provider_type &&
                                                    d.notes?.includes(item.service_name)
                                                )

                                                return (
                                                    <tr key={uniqueKey} className={cn(
                                                        "border-b hover:bg-muted/30",
                                                        isDistributed && "bg-green-50/30 dark:bg-green-950/20"
                                                    )}>
                                                        <td className="p-3">
                                                            <span className={cn(
                                                                "text-xs px-2 py-1 rounded-full font-medium",
                                                                item.type === 'Operation' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                                                                item.type === 'Consultant' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                                                item.type === 'Surgeon' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                                                item.type === 'Assistant' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                                                                item.type === 'Bed Charges' && "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
                                                                item.type === 'Service' && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
                                                                item.type === 'Outdoor Bill' && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                                            )}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="font-medium text-sm">{item.service_name}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="text-sm text-muted-foreground">{item.provider_name}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="text-sm text-muted-foreground">{item.date}</p>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <p className="font-semibold">{format(billAmount)}</p>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {isDistributed ? (
                                                                <p className="text-sm text-muted-foreground">-</p>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-red-600 text-sm mr-1">-</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={billAmount}
                                                                        step="0.01"
                                                                        value={serviceLessAmounts[uniqueKey] !== undefined ? serviceLessAmounts[uniqueKey] : ''}
                                                                        onChange={(e) => {
                                                                            const val = Math.min(billAmount, Math.max(0, Number(e.target.value) || 0))
                                                                            setServiceLessAmounts(prev => ({
                                                                                ...prev,
                                                                                [uniqueKey]: val
                                                                            }))
                                                                        }}
                                                                        className="w-24 h-8 text-right text-sm"
                                                                        placeholder="Less"
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <p className={cn(
                                                                "font-bold text-sm",
                                                                payableAmount < billAmount ? "text-orange-600" : "text-green-600"
                                                            )}>
                                                                {format(payableAmount)}
                                                            </p>
                                                            {payableAmount < billAmount && lessAmount > 0 && (
                                                                <p className="text-xs text-green-600">
                                                                    Profit: {format(lessAmount)}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {isDistributed ? (
                                                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    Done
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot className="bg-muted/50">
                                            <tr className="border-t-2">
                                                <td colSpan={4} className="p-3 text-right font-bold">
                                                    Total:
                                                </td>
                                                <td className="p-3 text-right font-bold text-lg">
                                                    {format(totalBillAmount)}
                                                </td>
                                                <td className="p-3 text-right font-bold text-lg text-red-600">
                                                    -{format(Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0))}
                                                </td>
                                                <td className="p-3 text-right font-bold text-lg text-green-600">
                                                    {format(totalBillAmount - Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0))}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-xs text-muted-foreground">
                                                        {distributions.length} / {allBillItems.length}
                                                    </span>
                                                </td>
                                            </tr>
                                            {Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0) > 0 && (
                                                <tr className="border-t border-green-200 dark:border-green-800">
                                                    <td colSpan={7} className="p-3 text-center">
                                                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                                            ✓ Total Company Profit: {format(Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0))}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
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
                                                    Total Payable: <strong>{format(totalBillAmount - Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0))}</strong>
                                                    {' '}• Company Profit: <strong>{format(Object.values(serviceLessAmounts).reduce((sum, val) => sum + val, 0))}</strong>
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Provider Distribution Records
                        </CardTitle>
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
                <CardContent>
                    {distributions.length > 0 ? (
                        <div className="space-y-3">
                            {distributions.map((dist) => {
                                const { icon, color } = getProviderInfo(dist.service_provided_by)
                                const isPaid = dist.payment_status === 'paid'
                                return (
                                    <div key={dist.id} className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${isPaid ? 'bg-green-50/30 dark:bg-green-950/20' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <span className="text-2xl">{icon}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">{dist.service_provided_by}</p>
                                                        {dist.provider_name && (
                                                            <span className="text-sm text-muted-foreground">• {dist.provider_name}</span>
                                                        )}
                                                    </div>
                                                    {dist.notes && (
                                                        <p className="text-xs text-muted-foreground">{dist.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Billed</p>
                                                    <p className="font-medium">{format(dist.bill_amount)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Less</p>
                                                    <p className="font-medium text-red-600">-{format(dist.less_amount)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Payable</p>
                                                    <p className="font-bold text-green-600">{format(dist.final_bill)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Paid</p>
                                                    <p className="font-medium">{format(dist.pay_now)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Due</p>
                                                    <p className={`font-bold ${dist.due_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {format(dist.due_amount)}
                                                    </p>
                                                </div>
                                                <div>{getStatusBadge(dist.payment_status)}</div>
                                                <div className="flex gap-2">
                                                    {dist.payment_status !== 'paid' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedDistribution(dist)
                                                                setPaymentAmount('')
                                                                setOpenPaymentDialog(true)
                                                            }}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <DollarSign className="h-3 w-3 mr-1" />
                                                            Payable
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <p className="text-muted-foreground mb-4">No distributions created yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Use the Save button above to create distributions</p>
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
                                <Label>Bill Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.bill_amount}
                                    onChange={(e) => setFormData({ ...formData, bill_amount: e.target.value })}
                                    placeholder="Billed to patient"
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
                            </div>
                            <div>
                                <Label>Payment Amount *</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    max={selectedDistribution.due_amount}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Maximum payable: {format(selectedDistribution.due_amount)}
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
        </div>
    )
}
