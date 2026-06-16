import { useMemo, useState } from 'react'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { FileText, DollarSign, Receipt, ChevronDown, ChevronRight, User, Calendar } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getCookie } from '@/lib/cookies'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

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
    created_by?: number
    admission?: {
        patient_name: string
        phone?: string
        admission_date: string
        discharge_date?: string
    }
    created_by_user?: {
        id: number
        name: string
        email?: string
    }
    discounted_by_user?: {
        id: number
        name: string
        email?: string
    }
}

type PaymentRecord = {
    id: number
    final_bill_id: number
    admission_id: number
    amount: number
    payment_date: string
    notes?: string
    payment_method?: string
    created_at: string
    created_by?: number
    created_by_user?: {
        id: number
        name: string
        email?: string
    }
}

type ApiResponse<T> = {
    status: boolean
    data: T
    total?: number
    message?: string
}

export function FinalBillsListPage() {
    const { currencySymbol } = useCurrency()
    const searchParams: any = useSearch({ strict: false })
    const navigate = useNavigate()

    const page = Number(searchParams?.page) || 1
    const limit = Number(searchParams?.limit) || 10
    const search = searchParams?.search || ""

    // Payment modal state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<FinalBill | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Payment history modal state
    const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false)
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Expanded rows state for collapsible details
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const [paymentsData, setPaymentsData] = useState<Map<number, PaymentRecord[]>>(new Map())
    const [loadingPayments, setLoadingPayments] = useState<Set<number>>(new Set())

    // Toggle row expansion
    const toggleRow = async (billId: number) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(billId)) {
            newExpanded.delete(billId)
            setExpandedRows(newExpanded)
        } else {
            newExpanded.add(billId)
            setExpandedRows(newExpanded)
            // Fetch payments if not already loaded
            if (!paymentsData.has(billId)) {
                await fetchPaymentsForBill(billId)
            }
        }
    }

    // Fetch payments for a specific bill
    const fetchPaymentsForBill = async (billId: number) => {
        const bill = bills.find((b: FinalBill) => b.id === billId)
        if (!bill) return

        setLoadingPayments(prev => new Set(prev).add(billId))
        try {
            const response = await fetch(`${API_URL}/api/admission/${bill.admission_id}/payments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setPaymentsData(prev => new Map(prev).set(billId, data.data || []))
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error)
        } finally {
            setLoadingPayments(prev => {
                const newSet = new Set(prev)
                newSet.delete(billId)
                return newSet
            })
        }
    }

    const setPage = (newPage: number) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, page: newPage }),
        })
    }

    // const setLimit = (newLimit: number) => {
    //     (navigate as any)({
    //         to: '.',
    //         search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }),
    //     })
    // }

    const setSearch = (newSearch: string) => {
        (navigate as any)({
            to: '.',
            search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }),
        })
    }

    const token = getCookie('accessToken')

    // Fetch final bills
    const { data: billsData, isFetching } = useQuery({
        queryKey: ['final-bills', page, limit, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
            })
            const response = await fetch(`${API_URL}/api/admission/final-bills?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch final bills')
            }
            return response.json() as Promise<ApiResponse<FinalBill[]>>
        },
        enabled: !!token,
    })

    const bills = billsData?.data || []
    const meta = {
        page,
        limit,
        total: billsData?.total ?? 0,
    }

    // Handle view button clicks
    useMemo(() => {
        const handleViewClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.view-bill-btn')
            if (!button) return

            const btn = button as HTMLButtonElement
            const admissionId = btn.dataset.admissionId
            if (admissionId) {
                navigate({ to: '/dashboard/admission/patients/$admissionId/final-bill', params: { admissionId } })
            }
        }

        const handlePaymentClick = (e: Event) => {
            const button = (e.target as HTMLElement).closest('.payment-btn')
            if (!button) return

            const btn = button as HTMLButtonElement
            if (btn.disabled) return

            const dueAmount = Number(btn.dataset.dueAmount || 0)
            if (dueAmount <= 0) return

            setSelectedBill({
                id: Number(btn.dataset.billId),
                admission_id: Number(btn.dataset.admissionId),
                due_amount: dueAmount,
                total_discounted_amount: Number(btn.dataset.totalAmount),
                paid_amount: Number(btn.dataset.paidAmount),
                admission: {
                    patient_name: btn.dataset.patientName || ''
                }
            } as FinalBill)
            setPaymentAmount(dueAmount.toString())
            setPaymentModalOpen(true)
        }

        const handleViewPaymentsClick = async (e: Event) => {
            const button = (e.target as HTMLElement).closest('.view-payments-btn')
            if (!button) return

            const btn = button as HTMLButtonElement
            const admissionId = btn.dataset.admissionId
            if (admissionId) {
                setIsLoadingHistory(true)
                try {
                    const response = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                    if (response.ok) {
                        const data = await response.json()
                        setPaymentHistory(data.data || [])
                        setSelectedBill({
                            admission_id: Number(admissionId),
                            admission: {
                                patient_name: btn.dataset.patientName || ''
                            }
                        } as FinalBill)
                        setPaymentHistoryModalOpen(true)
                    }
                } catch (error) {
                    console.error('Failed to fetch payment history:', error)
                } finally {
                    setIsLoadingHistory(false)
                }
            }
        }

        document.addEventListener('click', handleViewClick)
        document.addEventListener('click', handlePaymentClick)
        document.addEventListener('click', handleViewPaymentsClick)

        return () => {
            document.removeEventListener('click', handleViewClick)
            document.removeEventListener('click', handlePaymentClick)
            document.removeEventListener('click', handleViewPaymentsClick)
        }
    }, [navigate, token])

    const handlePaymentSubmit = async () => {
        if (!selectedBill || !paymentAmount) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/api/admission/${selectedBill.admission_id}/final-bill/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                throw new Error(errorData.message || `Failed to record payment (${response.status})`)
            }

            await response.json()

            // Show success and close modal
            alert('Payment recorded successfully!')
            setPaymentModalOpen(false)
            setPaymentAmount('')
            setSelectedBill(null)

            // Refresh the data
            window.location.reload()
        } catch (error) {
            console.error('Payment error:', error)
            alert(error instanceof Error ? error.message : 'Failed to record payment. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <AppHeader fixed />
            <Main className="p-6 lg:p-10 w-full flex-1 dark:bg-black/20">
                <div className="space-y-6 mx-auto">
                    <PageHeader
                        title="Final Bills"
                        subtitle="View and manage all final bills"
                    />

                    {/* Custom Table with Collapsible Rows */}
                    <div className="space-y-4">
                        {/* Search and Filter Bar */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-sm">
                                <Input
                                    type="search"
                                    placeholder="Search bills..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Bills Table */}
                        <div className="border rounded-lg bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Bill ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Due</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isFetching ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : bills.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8">
                                                No bills found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bills.map((bill: FinalBill) => {
                                            const isExpanded = expandedRows.has(bill.id)
                                            const payments = paymentsData.get(bill.id) || []
                                            const isLoadingPayments = loadingPayments.has(bill.id)

                                            return (
                                                <React.Fragment key={bill.id}>
                                                    {/* Main Row */}
                                                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(bill.id)}>
                                                        <TableCell>
                                                            <button className="p-1 hover:bg-muted rounded">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell className="font-medium">#{bill.id}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{bill.admission?.patient_name || 'Unknown'}</p>
                                                                {bill.admission?.phone && (
                                                                    <p className="text-xs text-muted-foreground">{bill.admission.phone}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {currencySymbol}{Number(bill.total_discounted_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-green-600">{currencySymbol}{Number(bill.paid_amount).toLocaleString()}</span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className={bill.due_amount > 0 ? "text-orange-600" : "text-green-600"}>
                                                                {bill.due_amount < 0
                                                                    ? `Overpaid: ${currencySymbol}${Math.abs(bill.due_amount).toLocaleString()}`
                                                                    : `${currencySymbol}${Number(bill.due_amount).toLocaleString()}`
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                bill.status === 'paid' ? 'default' :
                                                                bill.status === 'partial' ? 'secondary' :
                                                                bill.status === 'cancelled' ? 'destructive' : 'outline'
                                                            }>
                                                                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-sm">
                                                                    {bill.created_by_user?.name || '-'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(bill.created_at).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    className="payment-btn inline-flex items-center justify-center p-2 rounded hover:bg-muted transition-colors"
                                                                    data-bill-id={bill.id}
                                                                    data-admission-id={bill.admission_id}
                                                                    data-due-amount={bill.due_amount}
                                                                    data-patient-name={(bill.admission?.patient_name || '').replace(/"/g, '&quot;')}
                                                                    data-total-amount={bill.total_discounted_amount}
                                                                    data-paid-amount={bill.paid_amount}
                                                                    disabled={bill.due_amount <= 0}
                                                                    title={bill.due_amount <= 0 ? 'No payment needed' : 'Record Payment'}
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    className="view-bill-btn inline-flex items-center justify-center p-2 rounded hover:bg-muted transition-colors"
                                                                    data-admission-id={bill.admission_id}
                                                                    title="View Bill"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Expanded Details Row */}
                                                    {isExpanded && (
                                                        <TableRow>
                                                            <TableCell colSpan={10} className="bg-muted/30 p-4">
                                                                <div className="space-y-4">
                                                                    {/* Bill Details */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div className="p-3 bg-background rounded-lg border">
                                                                            <p className="text-xs text-muted-foreground mb-1">Total Bill</p>
                                                                            <p className="font-semibold">{currencySymbol}{Number(bill.total_bill_amount).toLocaleString()}</p>
                                                                        </div>
                                                                        <div className="p-3 bg-background rounded-lg border">
                                                                            <p className="text-xs text-muted-foreground mb-1">Discount</p>
                                                                            <p className="font-semibold text-red-600">-{currencySymbol}{Number(bill.total_discount).toLocaleString()}</p>
                                                                        </div>
                                                                        <div className="p-3 bg-background rounded-lg border">
                                                                            <p className="text-xs text-muted-foreground mb-1">Net Amount</p>
                                                                            <p className="font-semibold text-blue-600">{currencySymbol}{Number(bill.total_discounted_amount).toLocaleString()}</p>
                                                                        </div>
                                                                    </div>

                                                            {/* Discount Applied By */}
                                                            {bill.discounted_bill_created_at && (
                                                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                                                    <p className="text-xs text-green-700 dark:text-green-300 mb-1">Discount Applied By</p>
                                                                    <p className="font-semibold text-green-900 dark:text-green-100">
                                                                        {bill.discounted_by_user?.name || 'Unknown'}
                                                                    </p>
                                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                                        on {new Date(bill.discounted_bill_created_at).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Payment Details */}
                                                            <div>
                                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                                    <Receipt className="w-4 h-4" />
                                                                    Payment History ({payments.length} payment{payments.length !== 1 ? 's' : ''})
                                                                </h4>
                                                                {isLoadingPayments ? (
                                                                    <p className="text-sm text-muted-foreground py-4">Loading payments...</p>
                                                                ) : payments.length === 0 ? (
                                                                    <p className="text-sm text-muted-foreground py-4">No payments recorded yet</p>
                                                                ) : (
                                                                    <div className="border rounded-lg overflow-hidden">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow className="bg-muted/50">
                                                                                    <TableHead className="w-[140px]">Date</TableHead>
                                                                                    <TableHead className="w-[120px]">Amount</TableHead>
                                                                                    <TableHead>Method</TableHead>
                                                                                    <TableHead>Notes</TableHead>
                                                                                    <TableHead>Collected By</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {payments.map((payment) => (
                                                                                    <TableRow key={payment.id}>
                                                                                        <TableCell className="text-sm">
                                                                                            {new Date(payment.payment_date).toLocaleDateString('en-BD', {
                                                                                                day: '2-digit',
                                                                                                month: 'short',
                                                                                                year: 'numeric'
                                                                                            })}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm font-semibold text-green-600">
                                                                                            {currencySymbol}{payment.amount.toLocaleString()}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm">
                                                                                            {payment.payment_method ? (
                                                                                                <Badge variant="outline" className="text-xs">
                                                                                                    {payment.payment_method}
                                                                                                </Badge>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground">-</span>
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm text-muted-foreground">
                                                                                            {payment.notes || '-'}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm">
                                                                                            <div className="flex items-center gap-1">
                                                                                                <User className="w-3 h-3 text-muted-foreground" />
                                                                                                <span className="text-muted-foreground">
                                                                                                    {payment.created_by_user?.name || '-'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                                <TableRow className="bg-muted/50 font-semibold">
                                                                                    <TableCell className="text-sm">Total Paid</TableCell>
                                                                                    <TableCell className="text-sm font-bold text-green-700">
                                                                                        {currencySymbol}{payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
                                                                                    </TableCell>
                                                                                    <TableCell colSpan={3} className="text-xs text-muted-foreground">
                                                                                        {payments.length} payment{payments.length > 1 ? 's' : ''}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    )
                                })
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {Math.min((page - 1) * limit + 1, meta.total)} to {Math.min(page * limit, meta.total)} of {meta.total} entries
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {page} of {Math.ceil(meta.total / limit) || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= Math.ceil(meta.total / limit)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Main>

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
                            <p className="text-sm font-medium">{selectedBill?.admission?.patient_name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <p className="text-sm font-medium">{currencySymbol}{selectedBill?.total_discounted_amount?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <p className="text-sm font-medium text-green-600">{currencySymbol}{selectedBill?.paid_amount?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Due Amount</Label>
                                <p className={`text-sm font-medium ${(selectedBill?.due_amount || 0) < 0 ? "text-green-600" : "text-orange-600"}`}>
                                    {(selectedBill?.due_amount || 0) < 0
                                        ? `Overpaid: ${currencySymbol}${Math.abs(selectedBill?.due_amount || 0).toLocaleString()}`
                                        : `${currencySymbol}${(selectedBill?.due_amount || 0).toLocaleString()}`
                                    }
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
                                    max={selectedBill?.due_amount || 0}
                                    placeholder="Enter amount"
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
                                setSelectedBill(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePaymentSubmit}
                            disabled={!paymentAmount || Number(paymentAmount) <= 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment History Modal */}
            <Dialog open={paymentHistoryModalOpen} onOpenChange={setPaymentHistoryModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Payment History
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Patient Name</Label>
                            <p className="text-sm font-medium">{selectedBill?.admission?.patient_name || 'N/A'}</p>
                        </div>
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-8">
                                <p className="text-sm text-muted-foreground">Loading payment history...</p>
                            </div>
                        ) : paymentHistory.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <p className="text-sm text-muted-foreground">No payment records found</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Date</TableHead>
                                            <TableHead className="w-[150px]">Amount</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead>Collected By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentHistory.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(payment.payment_date).toLocaleDateString('en-BD', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-green-600">
                                                    {currencySymbol}{payment.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {payment.notes || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-muted-foreground">
                                                            {payment.created_by_user?.name || '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell className="text-sm">Total Paid</TableCell>
                                            <TableCell className="text-sm font-bold text-green-700">
                                                {currencySymbol}{paymentHistory.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell colSpan={2} className="text-xs text-muted-foreground">
                                                {paymentHistory.length} payment{paymentHistory.length > 1 ? 's' : ''}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPaymentHistoryModalOpen(false)
                                setPaymentHistory([])
                                setSelectedBill(null)
                            }}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
