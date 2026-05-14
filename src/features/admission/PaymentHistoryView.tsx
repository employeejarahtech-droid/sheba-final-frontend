import { useQuery } from '@tanstack/react-query'
import { Receipt, Loader2, DollarSign, Calendar, CheckCircle } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type PaymentRecord = {
    id: number
    final_bill_id: number
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
    const { format, locale } = useCurrency()
    const token = getCookie('accessToken')

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

    const payments = paymentsData?.data || []

    // Calculate total paid
    const totalPaid = payments.reduce((sum: number, p: PaymentRecord) => sum + Number(p.amount), 0)

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Payment History
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track all payments for this admission
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {payments.length} Payment{payments.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
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
                {payments.length === 0 ? (
                    <div className="text-center py-12">
                        <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                        <p className="text-muted-foreground">
                            Payment records will appear here once payments are made.
                        </p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Date</TableHead>
                                    <TableHead className="w-[150px]">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="w-[80px]">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment: PaymentRecord) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                {new Date(payment.payment_date).toLocaleDateString(locale, {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-green-600" />
                                                <span className="font-semibold text-green-600">
                                                    {format(payment.amount)}
                                                </span>
                                            </div>
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
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                            {payment.notes || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
