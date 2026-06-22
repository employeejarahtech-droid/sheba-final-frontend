import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Loader2, DollarSign, Calendar, CheckCircle, Plus } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const API_URL = import.meta.env.VITE_API_URL

type PaymentRecord = {
    id: number
    final_bill_id: number | null
    admission_id: number
    amount: number
    payment_date: string
    notes?: string
    payment_method?: string
    created_at: string
}

type PaymentHistoryViewProps = {
    admissionId: string | number
}

export function PaymentHistoryView({ admissionId }: PaymentHistoryViewProps) {
    const { format } = useCurrency()
    const { formatDateTime } = useDateFormat()
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()

    // Add modal state
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('cash')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch payment records
    const { data: paymentsData, isLoading } = useQuery({
        queryKey: ['admission-payments', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                throw new Error('Failed to fetch payment history')
            }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const payments: PaymentRecord[] = paymentsData?.data || []

    // Fetch final bill to check if created and get due amount
    const { data: finalBillData } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return null
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })
    const finalBill = finalBillData?.data || null

    // Calculate total paid
    const totalPaid = payments.reduce((sum: number, p: PaymentRecord) => sum + Number(p.amount), 0)

    // Record Payment Mutation
    const addMutation = useMutation({
        mutationFn: async () => {
            setIsSubmitting(true)
            try {
                // If final bill exists, we pay against the final bill. Otherwise, it is an advance payment.
                const endpoint = finalBill 
                    ? `${API_URL}/api/admission/${admissionId}/final-bill/payment` 
                    : `${API_URL}/api/admission/${admissionId}/advance-payment`

                const bodyPayload = finalBill
                    ? {
                        amount: Number(amount),
                        payment_method: method,
                        notes: notes,
                      }
                    : {
                        amount: Number(amount),
                        notes: notes || 'Advance payment',
                        payment_method: method,
                      }

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyPayload),
                })
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({ message: 'Failed to record payment' }))
                    throw new Error(errData.message || 'Failed to record payment')
                }
                return await res.json()
            } finally {
                setIsSubmitting(false)
            }
        },
        onSuccess: () => {
            toast.success(finalBill ? 'Invoice payment recorded successfully!' : 'Advance payment recorded successfully!')
            setAddModalOpen(false)
            setAmount('')
            setMethod('cash')
            setNotes('')
            queryClient.invalidateQueries({ queryKey: ['admission-payments', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to record payment')
        }
    })

    const handleAddPayment = () => {
        addMutation.mutate()
    }

    return (
        <>
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                    <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Payment History</CardTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Track all payments for this admission</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {payments.length} Payment{payments.length !== 1 ? 's' : ''}
                            </Badge>
                            <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 h-8"
                                onClick={() => setAddModalOpen(true)}
                                disabled={finalBill && finalBill.due_amount <= 0}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                {finalBill ? 'Record Payment' : 'Record Advance'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                            <p className="text-muted-foreground">
                                Payment records will appear here once payments are made.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Paid:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {format(totalPaid)}
                                    </span>
                                </div>
                            </div>

                            {/* Payments Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Date</TableHead>
                                            <TableHead className="w-[150px]">Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="w-[120px]">Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment: PaymentRecord) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        {payment.payment_date ? formatDateTime(payment.payment_date) : '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1 font-semibold">
                                                        <DollarSign className="w-3 h-3 text-green-600" />
                                                        <span className="font-bold text-green-600">
                                                            {format(payment.amount)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {payment.payment_method ? (
                                                            <Badge variant="outline" className="text-xs capitalize">
                                                                {payment.payment_method.replace('_', ' ')}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                        {!payment.final_bill_id && (
                                                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-250 text-[10px] py-0 px-1.5 font-semibold">
                                                                Advance
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                    {payment.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Record Payment/Advance Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            {finalBill ? 'Record Invoice Payment' : 'Record Advance Payment'}
                        </DialogTitle>
                        <DialogDescription>
                            {finalBill 
                                ? 'Add a new payment against the patient\'s finalized bill.' 
                                : 'Record an advance payment from the patient before the final bill is created.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {finalBill && (
                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg text-xs">
                                <div><strong>Net Bill:</strong> {format(finalBill.total_discounted_amount)}</div>
                                <div><strong>Paid:</strong> {format(finalBill.paid_amount)}</div>
                                <div className="col-span-2 text-orange-600 font-semibold mt-1"><strong>Due Amount:</strong> {format(finalBill.due_amount)}</div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="payAmount">Amount *</Label>
                            <Input
                                id="payAmount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter payment amount"
                                min="0.01"
                                max={finalBill ? finalBill.due_amount : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payMethod">Payment Method *</Label>
                            <Select value={method} onValueChange={setMethod}>
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
                            <Label htmlFor="payNotes">Notes (Optional)</Label>
                            <Textarea
                                id="payNotes"
                                placeholder={finalBill ? "Notes for this payment..." : "Advance payment notes..."}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddModalOpen(false)
                                setAmount('')
                                setMethod('cash')
                                setNotes('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPayment}
                            disabled={!amount || Number(amount) <= 0 || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                'Record'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
