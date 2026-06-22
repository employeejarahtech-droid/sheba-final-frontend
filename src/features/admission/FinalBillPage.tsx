import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { FileText, Loader2, ArrowLeft, Printer, CheckCircle, DollarSign, User, Save, X, GripVertical, UserCircle2, Check, ChevronDown, Calculator, DoorOpen } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

const API_URL = import.meta.env.VITE_API_URL

type FinalBillItem = {
    id: number
    service_name: string
    service_type: string
    service_note?: string
    quantity: number
    unit_price: number
    total_amount: number
    total_discount: number
    final_amount: number
}

type FinalBill = {
    id: number
    admission_id: number
    total_bill_amount: number
    total_discount: number
    total_discounted_amount: number
    total_discounted_by?: number
    discounted_bill_created_by?: number
    discounted_bill_created_at?: string
    discounted_by_doctor_id?: number
    status: 'pending' | 'partial' | 'paid' | 'cancelled'
    notes?: string
    paid_amount: number
    due_amount: number
    created_at: string
    created_by: number
    items?: FinalBillItem[]
    admission?: {
        id: number
        patient_name: string
        phone?: string
        patient_address?: string
        admission_date: string
        discharge_date?: string
        bed_number?: string
        cabin_number?: string
        doctor_name?: string
    }
}

type FinalBillPageProps = {
    admissionId: string | number
}

// Sortable Bill Item Component
interface SortableBillItemProps {
    item: FinalBillItem
    serviceTypeLabel: string
    discount: number
    itemDiscounts: Record<number, string>
    onDiscountChange: (id: number, value: string) => void
    isBillSaved: boolean
}

function SortableBillItem({ item, serviceTypeLabel, discount, itemDiscounts, onDiscountChange, isBillSaved }: SortableBillItemProps) {
    const { currencySymbol, format } = useCurrency()

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(item.id) })

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            transition,
        }
        : undefined

    const originalAmount = Number(item.total_amount) || 0
    const finalAmount = originalAmount - discount

    return (
        <div ref={setNodeRef} style={style} className={`px-4 py-3 hover:bg-muted/30 transition-colors ${isDragging ? 'opacity-50 bg-muted/50' : ''}`}>
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 flex items-center gap-2">
                    {!isBillSaved && (
                        <button
                            className="cursor-grab text-muted-foreground hover:text-foreground mt-0.5"
                            {...attributes}
                            {...listeners}
                        >
                            <GripVertical className="w-4 h-4 animate-pulse" />
                        </button>
                    )}
                    <div>
                        <p className="font-medium text-sm">{item.service_name}</p>
                        {item.service_note && (
                            <p className="text-xs text-muted-foreground">{item.service_note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {serviceTypeLabel} • Qty: {item.quantity}
                        </p>
                    </div>
                </div>
                <div className="col-span-2 text-right">
                    <p className="font-medium text-sm">{format(originalAmount)}</p>
                </div>
                <div className="col-span-2">
                    <div className="flex items-center gap-1.5 justify-center max-w-[140px] mx-auto">
                        <span className="text-xs text-muted-foreground font-medium">{currencySymbol}</span>
                        <Input
                            type="number"
                            value={itemDiscounts[item.id] || '0'}
                            onChange={(e) => onDiscountChange(item.id, e.target.value)}
                            className="h-8 py-1 text-sm text-center"
                            min="0"
                            max={originalAmount}
                            step="0.01"
                            disabled={isBillSaved}
                        />
                    </div>
                </div>
                <div className="col-span-2 text-right">
                    <p className="font-bold text-sm text-blue-600">{format(finalAmount)}</p>
                </div>
                <div className="col-span-1 text-center">
                    {discount > 0 ? (
                        <Badge variant="destructive" className="text-[10px] font-semibold px-1.5 py-0.5">
                            -{Math.round((discount / originalAmount) * 100)}%
                        </Badge>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export function FinalBillPage({ admissionId }: FinalBillPageProps) {
    const { currencySymbol, format } = useCurrency()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')

    // State for editable discounts and ordered items
    const [itemDiscounts, setItemDiscounts] = useState<Record<number, string>>({})
    const [globalDiscount, setGlobalDiscount] = useState('')
    const [hasChanges, setHasChanges] = useState(false)
    const [orderedItems, setOrderedItems] = useState<FinalBillItem[]>([])
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
    const [discountNotes, setDiscountNotes] = useState('')
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('')
    const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
    const [isCreatingBill, setIsCreatingBill] = useState(false)

    // Payment modal state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined)
    const [paymentNotes, setPaymentNotes] = useState('')
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

    // Discharge modal state
    const [dischargeModalOpen, setDischargeModalOpen] = useState(false)
    const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0])
    const [dischargeNotes, setDischargeNotes] = useState('')
    const [isDischarging, setIsDischarging] = useState(false)

    // Fetch admission data for checking status
    const { data: admissionData } = useQuery({
        queryKey: ['admission', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch final bill
    const { data: finalBillData, isLoading: billLoading, error: billError } = useQuery({
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

    // Fetch doctors list
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/doctor`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                throw new Error('Failed to fetch doctors')
            }
            return res.json()
        },
        enabled: !!token,
    })

    const doctors = doctorsData?.data?.items || []

    // Mutation to discharge patient
    const dischargeMutation = useMutation({
        mutationFn: async () => {
            setIsDischarging(true)
            try {
                const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        discharge_date: dischargeDate,
                        discharge_notes: dischargeNotes,
                        status: 'discharged',
                    }),
                })
                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error?.message || 'Failed to discharge patient')
                }
                return await res.json()
            } finally {
                setIsDischarging(false)
            }
        },
        onSuccess: () => {
            toast.success('Patient discharged successfully')
            setDischargeModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to discharge patient')
        },
    })

    // Mutation to create final bill
    const createFinalBillMutation = useMutation({
        mutationFn: async () => {
            setIsCreatingBill(true)
            try {
                const res = await fetch(`${API_URL}/api/admission/${admissionId}/create-final-bill`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error?.message || 'Failed to create final bill')
                }
                return await res.json()
            } finally {
                setIsCreatingBill(false)
            }
        },
        onSuccess: () => {
            toast.success('Final bill created successfully')
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create final bill')
        },
    })

    // Check if the bill has already been saved (discounts applied)
    const isBillSaved = useMemo(() => {
        return !!finalBill?.discounted_bill_created_at
    }, [finalBill])

    // Initialize discounts and ordered items when bill loads
    useEffect(() => {
        if (finalBill?.items) {
            const initialDiscounts: Record<number, string> = {}
            finalBill.items.forEach(item => {
                initialDiscounts[item.id] = String(item.total_discount || 0)
            })
            setItemDiscounts(initialDiscounts)
            setOrderedItems([...finalBill.items])
        }
        if (finalBill) {
            setSelectedDoctorId(finalBill.discounted_by_doctor_id ? String(finalBill.discounted_by_doctor_id) : '')
            setDiscountNotes(finalBill.notes || '')
        }
    }, [finalBill])

    // Calculate totals based on discounts
    const calculatedTotals = useMemo(() => {
        if (!orderedItems || orderedItems.length === 0) {
            return {
                totalBill: Number(finalBill?.total_bill_amount) || 0,
                totalDiscount: Number(finalBill?.total_discount) || 0,
                netAmount: Number(finalBill?.total_discounted_amount) || 0,
                paidAmount: Number(finalBill?.paid_amount) || 0,
                dueAmount: Number(finalBill?.due_amount) || 0
            }
        }

        let totalBill = 0
        let totalDiscount = 0

        orderedItems.forEach(item => {
            const originalAmount = Number(item.total_amount) || 0
            const itemDiscount = Number(itemDiscounts[item.id]) || 0
            totalBill += originalAmount
            totalDiscount += itemDiscount
        })

        const netAmount = totalBill - totalDiscount
        const paidAmount = Number(finalBill?.paid_amount) || 0
        const dueAmount = netAmount - paidAmount

        return {
            totalBill,
            totalDiscount,
            netAmount,
            paidAmount,
            dueAmount
        }
    }, [finalBill, orderedItems, itemDiscounts])

    // Get service type label
    const getServiceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            bed_charges: 'Bed Charges',
            operation: 'Operation Charges',
            consultant: 'Consultant Fees',
            surgeon: 'Surgeon Fees',
            assistant: 'Assistant Fees',
            service: 'Clinical Services',
            medicine: 'Medicine',
            other: 'Other Charges',
        }
        return labels[type] || type
    }

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
    )

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setOrderedItems((items) => {
                const oldIndex = items.findIndex((item) => String(item.id) === active.id)
                const newIndex = items.findIndex((item) => String(item.id) === over.id)

                return arrayMove(items, oldIndex, newIndex)
            })
            setHasChanges(true)
        }
    }

    // Update discount for individual item
    const handleItemDiscountChange = (itemId: number, value: string) => {
        setItemDiscounts(prev => ({
            ...prev,
            [itemId]: value
        }))
        setHasChanges(true)
    }

    // Handle doctor change
    // const handleDoctorChange = (value: string) => {
    //     setSelectedDoctorId(value)
    //     setHasChanges(true)
    // }

    // Handle notes change
    const handleNotesChange = (value: string) => {
        setDiscountNotes(value)
        setHasChanges(true)
    }

    // Apply global discount to all items
    const handleApplyGlobalDiscount = () => {
        if (!orderedItems) return

        const discount = parseFloat(globalDiscount) || 0
        const newDiscounts: Record<number, string> = {}

        orderedItems.forEach(item => {
            // Calculate discount as percentage of item amount
            const discountAmount = (item.total_amount * discount) / 100
            newDiscounts[item.id] = discountAmount.toFixed(2)
        })

        setItemDiscounts(newDiscounts)
        setGlobalDiscount('')
        setHasChanges(true)
        toast.success(`Applied ${discount}% discount to all items`)
    }

    // Reset discounts
    const handleResetDiscounts = () => {
        if (!orderedItems) return

        const resetDiscounts: Record<number, string> = {}
        orderedItems.forEach(item => {
            resetDiscounts[item.id] = '0'
        })

        setItemDiscounts(resetDiscounts)
        setHasChanges(true)
        toast.info('All discounts reset to zero')
    }

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!finalBill) throw new Error('No bill to save')

            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    item_discounts: itemDiscounts,
                    item_order: orderedItems.map(item => item.id),
                    total_discount: calculatedTotals?.totalDiscount,
                    total_discounted_amount: calculatedTotals?.netAmount,
                    due_amount: calculatedTotals?.dueAmount,
                    notes: discountNotes,
                    discounted_by_doctor_id: selectedDoctorId ? parseInt(selectedDoctorId) : null,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to update final bill')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Final bill updated successfully')
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update final bill')
        },
    })

    const handleBack = () => {
        navigate({ to: '/dashboard/admission/patients/$admissionId/billing', params: { admissionId: String(admissionId) } })
    }

    const handleSave = () => {
        saveMutation.mutate()
    }

    const handlePaymentSubmit = async () => {
        if (!finalBill || !paymentAmount || Number(paymentAmount) <= 0) return
        if (!paymentMethod) {
            toast.error('Please select a payment method')
            return
        }

        setIsSubmittingPayment(true)
        try {
            const response = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                    payment_method: paymentMethod,
                    notes: paymentNotes,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                throw new Error(errorData.message || `Failed to record payment (${response.status})`)
            }

            await response.json()

            // Show success and close modal
            toast.success('Payment recorded successfully!')
            setPaymentModalOpen(false)
            setPaymentAmount('')
            setPaymentMethod(undefined)
            setPaymentNotes('')

            // Refresh the data
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        } catch (error) {
            console.error('Payment error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to record payment. Please try again.')
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    // Loading state
    if (billLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading final bill...</p>
                </div>
            </div>
        )
    }

    // Error state - show creation form
    if (billError || !finalBill) {
        const admissionStatus = admissionData?.data?.status
        const isPatientActive = admissionStatus === 'active'

        return (
            <div className="max-w-[1000px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Billing
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Create Final Bill
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 py-8">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                <Calculator className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">No Final Bill Found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    The final bill hasn't been created for this admission yet.
                                </p>
                            </div>
                        </div>

                        {/* Patient Status Badge */}
                        <div className="flex justify-center">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                isPatientActive
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                Status: {admissionStatus?.charAt(0).toUpperCase() + admissionStatus?.slice(1) || 'Unknown'}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            {isPatientActive ? (
                                <Button
                                    onClick={() => setDischargeModalOpen(true)}
                                    disabled={!admissionData?.data?.bill_created}
                                    size="lg"
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    <DoorOpen className="w-4 h-4 mr-2" />
                                    Ready to Discharge
                                </Button>
                            ) : (
                                <div className="text-center text-sm text-green-600 font-medium">
                                    <CheckCircle className="w-5 h-5 inline mr-1" />
                                    Patient is discharged
                                </div>
                            )}

                            <Button
                                onClick={() => createFinalBillMutation.mutate()}
                                disabled={isCreatingBill || !admissionData?.data?.bill_created}
                                size="lg"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isCreatingBill ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Final Bill...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="w-4 h-4 mr-2" />
                                        Create Final Bill
                                    </>
                                )}
                            </Button>
                        </div>

                        {!admissionData?.data?.bill_created && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm font-medium">
                                <strong>Required:</strong> A preliminary bill must be created first before you can generate the final bill. Please manage billing items to create the preliminary bill.
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Creating the final bill will calculate all charges including bed/cabin charges based on the admission and discharge dates.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const admission = finalBill.admission || {} as FinalBill['admission']
    const items = orderedItems || []

    // // Group items by service type
    // const groupedItems = items.reduce((acc, item) => {
    //     if (!acc[item.service_type]) {
    //         acc[item.service_type] = []
    //     }
    //     acc[item.service_type].push(item)
    //     return acc
    // }, {} as Record<string, FinalBillItem[]>)

    return (
        <div className="max-w-[1000px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Final Bill
                        </h1>
                        <p className="text-muted-foreground text-sm">Bill #{finalBill.id} • Admission #{finalBill.admission_id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/dashboard/admission/patients/$admissionId/final-bill-print"
                        params={{ admissionId: String(admissionId) }}
                    >
                        <Button>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Section 1: Patient Details */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Patient Details</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Admission and patient information</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-muted-foreground">Patient Name</Label>
                            <p className="font-semibold text-lg">{admission?.patient_name || 'Unknown'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Phone</Label>
                            <p className="font-medium">{admission?.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Admission Date</Label>
                            <p className="font-medium">{new Date(admission?.admission_date || finalBill.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Discharge Date</Label>
                            <p className="font-medium">{admission?.discharge_date ? new Date(admission.discharge_date).toLocaleDateString() : 'Active'}</p>
                        </div>
                        {(admission?.bed_number || admission?.cabin_number) && (
                            <div>
                                <Label className="text-muted-foreground">Room/Bed</Label>
                                <p className="font-medium">{admission?.bed_number || admission?.cabin_number}</p>
                            </div>
                        )}
                        {admission?.doctor_name && (
                            <div>
                                <Label className="text-muted-foreground">Attending Doctor</Label>
                                <p className="font-medium">Dr. {admission.doctor_name}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Bill Items with Drag and Drop */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Bill Items</CardTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Drag to reorder • Apply discounts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="Discount %"
                                value={globalDiscount}
                                onChange={(e) => setGlobalDiscount(e.target.value)}
                                className="w-32"
                                min="0"
                                max="100"
                                disabled={isBillSaved}
                            />
                            <Button
                                size="sm"
                                onClick={handleApplyGlobalDiscount}
                                disabled={!globalDiscount || isBillSaved}
                                variant="outline"
                            >
                                Apply to All
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleResetDiscounts}
                                disabled={isBillSaved}
                                variant="ghost"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/60 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b items-center">
                            <div className="col-span-5">Service / Item Details</div>
                            <div className="col-span-2 text-right">Original Amount</div>
                            <div className="col-span-2 text-center">Discount</div>
                            <div className="col-span-2 text-right">Final Amount</div>
                            <div className="col-span-1 text-center">Saving %</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y">
                            {isBillSaved ? (
                                items.map((item) => (
                                    <SortableBillItem
                                        key={item.id}
                                        item={item}
                                        serviceTypeLabel={getServiceTypeLabel(item.service_type)}
                                        discount={Number(itemDiscounts[item.id]) || 0}
                                        itemDiscounts={itemDiscounts}
                                        onDiscountChange={handleItemDiscountChange}
                                        isBillSaved={isBillSaved}
                                    />
                                ))
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={orderedItems.map(item => String(item.id))}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {items.map((item) => (
                                            <SortableBillItem
                                                key={item.id}
                                                item={item}
                                                serviceTypeLabel={getServiceTypeLabel(item.service_type)}
                                                discount={Number(itemDiscounts[item.id]) || 0}
                                                itemDiscounts={itemDiscounts}
                                                onDiscountChange={handleItemDiscountChange}
                                                isBillSaved={isBillSaved}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 3: Discount Information */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                            <UserCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Discount Information</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Approving doctor and discount notes</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="doctor">Discount Approved By (Doctor)</Label>
                            <Popover open={isDoctorDropdownOpen} onOpenChange={setIsDoctorDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="doctor"
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        disabled={isBillSaved}
                                        className={cn(
                                            "w-full justify-between h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all shadow-sm text-sm",
                                            !selectedDoctorId && "text-muted-foreground"
                                        )}
                                    >
                                        {(() => {
                                            const selectedDoctor = doctors.find((d: any) => String(d.id) === selectedDoctorId)
                                            if (!selectedDoctor) return "Select doctor..."
                                            return (
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">
                                                        Dr. {selectedDoctor.doctor_name}
                                                        {(selectedDoctor.qualification || selectedDoctor.title) && ` (${selectedDoctor.qualification || selectedDoctor.title})`}
                                                    </span>
                                                    {selectedDoctor.speciality && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {selectedDoctor.speciality}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command
                                        filter={(value, search) => {
                                            if (!search) return 1;
                                            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                                        }}
                                        className="border border-gray-100 dark:border-gray-800"
                                    >
                                        <CommandInput placeholder="Search doctor by name, qualification, or specialty..." className="h-10" value={doctorSearchQuery} onValueChange={setDoctorSearchQuery} />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>No doctor found.</CommandEmpty>
                                            <CommandGroup>
                                                {doctors.map((doctor: any) => {
                                                    const displayName = `Dr. ${doctor.doctor_name}`;
                                                    const subtitle = [
                                                        doctor.qualification || doctor.title,
                                                        doctor.speciality
                                                    ].filter(Boolean).join(" - ");

                                                    return (
                                                        <CommandItem
                                                            key={doctor.id}
                                                            value={`${doctor.doctor_name} ${doctor.qualification || doctor.title || ''} ${doctor.speciality || ''} ${doctor.id}`}
                                                            className="py-2.5 px-4 cursor-pointer"
                                                            onSelect={() => {
                                                                setSelectedDoctorId(String(doctor.id))
                                                                setIsDoctorDropdownOpen(false)
                                                                setDoctorSearchQuery('')
                                                                setHasChanges(true)
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 shrink-0",
                                                                        String(doctor.id) === selectedDoctorId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{displayName}</span>
                                                                    {subtitle && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {subtitle}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="md:col-span-1">
                            <Label htmlFor="notes">Discount Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter notes about the discount..."
                                value={discountNotes}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                rows={3}
                                className="resize-none"
                                disabled={isBillSaved}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 4: Final Bill Summary */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                <Calculator className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Final Bill Summary</CardTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Totals, payments, and balance</p>
                            </div>
                        </div>
                        {!isBillSaved && hasChanges && (
                            <span className="text-sm font-normal text-orange-600">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="max-w-md mx-auto space-y-3">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Total Bill Amount:</span>
                            <span className="font-semibold text-lg">{format(calculatedTotals?.totalBill || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-red-600">
                            <span>Total Discount:</span>
                            <span className="font-semibold text-lg">-{format(calculatedTotals?.totalDiscount || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2">
                            <span className="font-semibold">Net Amount:</span>
                            <span className="font-bold text-xl text-blue-600">{format(calculatedTotals?.netAmount || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2">
                            <span className="text-green-600">Paid Amount:</span>
                            <span className="font-semibold text-green-600">{format(calculatedTotals?.paidAmount || 0)}</span>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-4">
                            <span className={`font-bold text-lg ${calculatedTotals?.dueAmount && calculatedTotals.dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {calculatedTotals?.dueAmount && calculatedTotals.dueAmount > 0 ? 'Due Amount:' : 'Balance:'}
                            </span>
                            <span className={`font-bold text-2xl ${calculatedTotals?.dueAmount && calculatedTotals.dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {format(calculatedTotals?.dueAmount || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Save Button */}
                    {!isBillSaved ? (
                        <div className="flex justify-center mt-6 print:hidden">
                            <Button
                                size="lg"
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                                className="w-full max-w-md"
                            >
                                {saveMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-4 mt-6 print:hidden">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 px-4 py-2 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Discounts saved</span>
                            </div>
                            {finalBill && finalBill.due_amount > 0 && (
                                <Button
                                    size="default"
                                    onClick={() => setPaymentModalOpen(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Record Payment
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Discharge Action */}
            {isBillSaved && (
                <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-800 dark:text-orange-300">
                                    <strong>Next Step:</strong> {admission?.discharge_date ? 'Patient has been discharged' : 'Ready to discharge the patient'}
                                </p>
                            </div>
                            {!admission?.discharge_date ? (
                                <Button
                                    onClick={() => setDischargeModalOpen(true)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    <DoorOpen className="w-4 h-4 mr-2" />
                                    Discharge Patient
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Discharged</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discharge Modal */}
            <Dialog open={dischargeModalOpen} onOpenChange={setDischargeModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DoorOpen className="w-5 h-5 text-orange-600" />
                            Ready to Discharge Patient
                        </DialogTitle>
                        <DialogDescription>
                            Set the discharge date and add any notes before discharging the patient.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dischargeDate">Discharge Date *</Label>
                            <Input
                                id="dischargeDate"
                                type="date"
                                value={dischargeDate}
                                onChange={(e) => setDischargeDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dischargeNotes">Patient Notes / Discharge Summary</Label>
                            <Textarea
                                id="dischargeNotes"
                                placeholder="Enter discharge notes, summary, or instructions for the patient..."
                                value={dischargeNotes}
                                onChange={(e) => setDischargeNotes(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> After discharge, the bed/cabin will be released and final bill will calculate charges based on the discharge date.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDischargeModalOpen(false)
                                setDischargeNotes('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => dischargeMutation.mutate()}
                            disabled={!dischargeDate || isDischarging}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isDischarging ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Discharging...
                                </>
                            ) : (
                                <>
                                    <DoorOpen className="w-4 h-4 mr-2" />
                                    Discharge Patient
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
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
                            <p className="text-sm font-medium">{finalBill?.admission?.patient_name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <p className="text-sm font-medium">{format(finalBill?.total_discounted_amount || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <p className="text-sm font-medium text-green-600">{format(finalBill?.paid_amount || 0)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Due Amount</Label>
                                <p className="text-sm font-medium text-orange-600">{format(finalBill?.due_amount || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Payment Amount</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="1"
                                    max={finalBill?.due_amount || 0}
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                                <Textarea
                                    id="paymentNotes"
                                    placeholder="Add a note for this payment..."
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPaymentModalOpen(false)
                                setPaymentAmount('')
                                setPaymentMethod(undefined)
                                setPaymentNotes('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePaymentSubmit}
                            disabled={!paymentAmount || Number(paymentAmount) <= 0 || !paymentMethod || isSubmittingPayment}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmittingPayment ? 'Processing...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
