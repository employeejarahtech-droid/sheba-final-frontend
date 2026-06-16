import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { FileText, Loader2, CheckCircle, Clock, DollarSign, Receipt, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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
    status: 'pending' | 'partial' | 'paid' | 'cancelled'
    notes?: string
    paid_amount: number
    due_amount: number
    created_at: string
    items?: FinalBillItem[]
    admission?: {
        patient_name: string
        admission_date: string
        discharge_date?: string
    }
}

type FinalBillViewProps = {
    admissionId: string | number
}

export function FinalBillView({ admissionId }: FinalBillViewProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentNotes, setPaymentNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined)

    // Fetch final bill
    const { data: finalBillData, isLoading: billLoading } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                if (res.status === 404) {
                    return null // Bill not created yet
                }
                throw new Error('Failed to fetch final bill')
            }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const finalBill: FinalBill | null = finalBillData?.data || null

    // Create final bill mutation
    const createBillMutation = useMutation({
        mutationFn: async () => {
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
            return res.json()
        },
        onSuccess: () => {
            toast.success('Final bill created successfully')
            setShowCreateDialog(false)
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create final bill')
        },
    })

    const handleCreateBill = () => {
        createBillMutation.mutate()
    }

    // Record payment mutation
    const recordPaymentMutation = useMutation({
        mutationFn: async (data: { amount: string; notes: string; payment_method: string }) => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
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
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['admission-payments', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record payment')
        },
    })

    const handleRecordPayment = () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        if (!paymentMethod) {
            toast.error('Please select a payment method')
            return
        }
        recordPaymentMutation.mutate({
            amount: paymentAmount,
            notes: paymentNotes,
            payment_method: paymentMethod,
        })
    }

    // Get status badge color
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: React.ReactNode }> = {
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Clock className="w-3 h-3" /> },
            partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <DollarSign className="w-3 h-3" /> },
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="w-3 h-3" /> },
            cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <Receipt className="w-3 h-3" /> },
        }
        const variant = variants[status] || variants.pending
        return (
            <Badge className={variant.color}>
                <span className="flex items-center gap-1">
                    {variant.icon}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </Badge>
        )
    }

    // Get service type label
    const getServiceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            bed_charges: 'Bed Charges',
            operation: 'Operation',
            consultant: 'Consultant',
            surgeon: 'Surgeon',
            assistant: 'Assistant',
            anesthesiologist: 'Anesthesiologist',
            service: 'Service',
            medicine: 'Medicine',
            other: 'Other',
        }
        return labels[type] || type
    }

    // Group items by service type
    const groupItemsByType = (items: FinalBillItem[]) => {
        return items.reduce((acc, item) => {
            if (!acc[item.service_type]) {
                acc[item.service_type] = []
            }
            acc[item.service_type].push(item)
            return acc
        }, {} as Record<string, FinalBillItem[]>)
    }

    if (billLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    // Bill not created yet - show create button
    if (!finalBill) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Final Bill
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Final Bill Created</h3>
                        <p className="text-muted-foreground mb-6">
                            Create the final bill to generate a summary of all charges for this admission.
                        </p>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Create Final Bill
                        </Button>
                    </div>
                </CardContent>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Final Bill</DialogTitle>
                            <DialogDescription>
                                This will aggregate all charges (bed, operations, consultants, services) into a final bill.
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateBill}
                                disabled={createBillMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {createBillMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="w-4 h-4 mr-2" />
                                        Create Bill
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>
        )
    }

    // Show final bill details
    const groupedItems = finalBill.items ? groupItemsByType(finalBill.items) : {}

    // Calculate actual discount (total_bill - discounted_amount)
    const actualDiscount = finalBill.total_bill_amount - finalBill.total_discounted_amount

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Final Bill #{finalBill.id}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Patient: {finalBill.admission?.patient_name || 'Unknown'}
                        </p>
                    </div>
                    <div className="text-right">
                        {getStatusBadge(finalBill.status)}
                        <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(finalBill.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Bill Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Bill</p>
                        <p className="text-2xl font-bold">
                            {format(finalBill.total_bill_amount)}
                        </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <p className={`text-2xl font-bold ${actualDiscount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {actualDiscount > 0 ? '-' : ''}{format(actualDiscount)}
                        </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            {format(finalBill.paid_amount)}
                        </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Due</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {format(finalBill.due_amount)}
                        </p>
                    </div>
                </div>

                {/* Bill Items */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Bill Details</h3>
                    {Object.entries(groupedItems).map(([type, items]) => (
                        <div key={type} className="border rounded-lg">
                            <div className="bg-muted/50 px-4 py-2 border-b">
                                <h4 className="font-medium">{getServiceTypeLabel(type)}</h4>
                            </div>
                            <div className="divide-y">
                                {items.map((item) => (
                                    <div key={item.id} className="px-4 py-3 flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.service_name}</p>
                                            {item.service_note && (
                                                <p className="text-sm text-muted-foreground">{item.service_note}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Qty: {item.quantity} × {format(item.unit_price)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {format(item.final_amount)}
                                            </p>
                                            {item.total_discount > 0 && (
                                                <p className="text-xs text-red-600 line-through">
                                                    {format(item.total_amount)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount Due:</span>
                        <span className="text-blue-600">
                            {format(finalBill.total_discounted_amount)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate({ to: '/dashboard/admission/patients/$admissionId/final-bill', params: { admissionId: String(admissionId) } })}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Bill
                    </Button>
                    {finalBill.status !== 'paid' && (
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => setShowPaymentDialog(true)}
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Record Payment
                        </Button>
                    )}
                </div>
            </CardContent>

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
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPaymentDialog(false)
                                setPaymentAmount('')
                                setPaymentNotes('')
                                setPaymentMethod(undefined)
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
        </Card>
    )
}
