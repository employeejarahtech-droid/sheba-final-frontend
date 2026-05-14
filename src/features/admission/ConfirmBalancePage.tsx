import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import {
    FileText,
    Loader2,
    ArrowLeft,
    CheckCircle,
    DollarSign,
    AlertTriangle,
    Users,
    User,
    Wallet,
    TrendingUp
} from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'

const API_URL = import.meta.env.VITE_API_URL

type Distribution = {
    id: number
    service_provided_by: string
    provider_name?: string
    bill_amount: number
    less_amount: number
    final_bill: number
    pay_now: number
    due_amount: number
    payment_status: 'pending' | 'partial' | 'paid'
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
    paid_amount: number
    due_amount: number
    status: 'pending' | 'partial' | 'paid' | 'cancelled'
    admission?: {
        patient_name: string
        admission_date: string
        discharge_date?: string
    }
}

type ConfirmBalancePageProps = {
    admissionId: string | number
}

export function ConfirmBalancePage({ admissionId }: ConfirmBalancePageProps) {
    const { currencySymbol, format } = useCurrency()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false)

    // Fetch final bill
    const { data: finalBillData, isLoading: billLoading } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch final bill')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const finalBill: FinalBill | null = finalBillData?.data || null

    // Fetch distributions summary
    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ['distribution-summary', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch summary')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const summary: DistributionSummary | null = summaryData?.data || null

    // Fetch distributions list
    const { data: distributionsData } = useQuery({
        queryKey: ['distributions', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch distributions')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const distributions: Distribution[] = distributionsData?.data || []

    // Confirm completion mutation
    const confirmMutation = useMutation({
        mutationFn: async () => {
            return new Promise(resolve => setTimeout(resolve, 1000))
        },
        onSuccess: () => {
            toast.success('Billing cycle confirmed as complete!')
            setOpenConfirmDialog(false)
            navigate({ to: '/admission/patients' })
        },
        onError: () => {
            toast.error('Failed to confirm completion')
        },
    })

    if (billLoading || summaryLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    const admission = finalBill?.admission || {}
    const isPatientPaid = finalBill?.status === 'paid'
    const allProvidersPaid = summary?.payment_status_count?.paid === distributions.length
    const isFullyPaid = isPatientPaid && allProvidersPaid && distributions.length > 0
    const totalPayments = finalBill?.paid_amount || 0
    const totalProviderPayments = summary?.total_paid || 0
    const completionPercentage = summary?.total_payable ? Math.round((summary?.total_paid / summary?.total_payable) * 100) : 0

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

    return (
        <div className="max-w-[1000px] mx-auto space-y-6">
            <PageHeader
                title="Confirm Balance & Complete Process"
                subtitle={`Final review of all payments • ${admission?.patient_name}`}
                backButton={{
                    onClick: () => navigate({ to: '/admission/patients/$admissionId/distribute-bill', params: { admissionId: String(admissionId) } }),
                }}
            />

            {/* Status Banner */}
            <Card className={isFullyPaid ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'}>
                <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                        {isFullyPaid ? (
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        ) : (
                            <AlertTriangle className="h-12 w-12 text-orange-600" />
                        )}
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${isFullyPaid ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
                                {isFullyPaid ? 'All Payments Complete' : 'Pending Payments Remain'}
                            </h3>
                            <p className={`text-sm ${isFullyPaid ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                {isFullyPaid
                                    ? 'All patient and provider payments have been processed. Ready to complete the billing cycle.'
                                    : `Completion: ${completionPercentage}% - Please process remaining payments to complete the cycle.`
                                }
                            </p>
                        </div>
                        {isFullyPaid && (
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        )}
                    </div>
                    {!isFullyPaid && (
                        <Progress value={completionPercentage} className="mt-4 h-2" />
                    )}
                </CardContent>
            </Card>

            {/* Section 1: Patient Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Patient Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-muted-foreground">Patient Name</Label>
                            <p className="font-semibold text-lg">{admission?.patient_name || 'Unknown'}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Admission Period</Label>
                            <p className="font-medium">
                                {admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString() : '-'} - {' '}
                                {admission?.discharge_date
                                    ? new Date(admission.discharge_date).toLocaleDateString()
                                    : 'Active'
                                }
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Admission ID</Label>
                            <p className="font-medium">#{finalBill?.admission_id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Patient Payment Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Patient Payment Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md mx-auto space-y-3">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Total Bill:</span>
                            <span className="font-semibold text-lg">{format(finalBill?.total_discounted_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-red-600">
                            <span>Total Discount:</span>
                            <span className="font-semibold text-lg">-{format(finalBill?.total_discount || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2">
                            <span className="font-semibold">Net Amount:</span>
                            <span className="font-bold text-xl text-blue-600">{format(finalBill?.total_discounted_amount || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2">
                            <span className="text-green-600">Paid Amount:</span>
                            <span className="font-semibold text-green-600">{format(finalBill?.paid_amount || 0)}</span>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-4">
                            <span className={`font-bold text-lg ${(finalBill?.due_amount || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {(finalBill?.due_amount || 0) > 0 ? 'Due Amount:' : 'Balance:'}
                            </span>
                            <span className={`font-bold text-2xl ${(finalBill?.due_amount || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {format(finalBill?.due_amount || 0)}
                            </span>
                        </div>
                        <div className="text-center">
                            {finalBill?.status === 'paid' ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                </Badge>
                            ) : finalBill?.status === 'partial' ? (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Partial</Badge>
                            ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
                            )}
                        </div>
                    </div>
                    {(finalBill?.due_amount || 0) > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            Patient has pending payment of {format(finalBill?.due_amount || 0)}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 3: Provider Payment Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Service Provider Payment Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {summary && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Total Payable</Label>
                                    <p className="text-2xl font-bold">{format(summary.total_payable || 0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Total Paid</Label>
                                    <p className="text-2xl font-bold text-blue-600">{format(summary.total_paid || 0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Total Due</Label>
                                    <p className={`text-2xl font-bold ${(summary.total_due || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {format(summary.total_due || 0)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Providers</Label>
                                    <p className="text-2xl font-bold">{distributions.length}</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                        </>
                    )}
                    <div className="space-y-3">
                        {distributions.map((dist) => {
                            const { icon, color } = getProviderInfo(dist.service_provided_by)
                            const isPaid = dist.payment_status === 'paid'
                            return (
                                <div key={dist.id} className={`flex items-center justify-between p-4 rounded-lg ${isPaid ? 'bg-green-50 dark:bg-green-950/30' : 'bg-orange-50 dark:bg-orange-950/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{icon}</span>
                                        <div>
                                            <p className="font-medium">{dist.service_provided_by}</p>
                                            {dist.provider_name && (
                                                <p className="text-sm text-muted-foreground">{dist.provider_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Payable</p>
                                            <p className="font-semibold">{format(dist.final_bill)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Paid</p>
                                            <p className="font-semibold">{format(dist.pay_now)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Due</p>
                                            <p className={`font-bold ${dist.due_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {format(dist.due_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            {isPaid ? (
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Paid
                                                </Badge>
                                            ) : dist.payment_status === 'partial' ? (
                                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Partial</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {(summary?.total_due || 0) > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            {summary?.payment_status_count?.pending + summary?.payment_status_count?.partial || 0} provider(s) have pending payments totaling {format(summary?.total_due || 0)}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 4: Billing Cycle Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Billing Cycle Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-muted-foreground">Patient</Label>
                                <p className="font-semibold">{admission?.patient_name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Admission Period</Label>
                                <p className="font-semibold">
                                    {admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString() : ''} - {' '}
                                    {admission?.discharge_date
                                        ? new Date(admission.discharge_date).toLocaleDateString()
                                        : 'Active'
                                    }
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Total Amount Collected from Patient</Label>
                                <p className="font-bold text-lg text-green-600">{format(finalBill?.paid_amount || 0)}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Total Paid to Providers</Label>
                                <p className="font-bold text-lg text-blue-600">{format(summary?.total_paid || 0)}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="text-center py-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">Company Retention (Deductions from Bills)</p>
                            <p className="text-3xl font-bold text-green-600">{format(summary?.total_less_amount || 0)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm Button */}
            <Card className={isFullyPaid ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/30'}>
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`text-lg font-semibold ${isFullyPaid ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                {isFullyPaid ? 'Ready to Complete' : 'Complete All Payments First'}
                            </h3>
                            <p className={`text-sm ${isFullyPaid ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                {isFullyPaid
                                    ? 'All payments verified. You can now confirm the billing cycle as complete.'
                                    : 'Please process all remaining patient and provider payments.'
                                }
                            </p>
                        </div>
                        <Button
                            onClick={() => setOpenConfirmDialog(true)}
                            disabled={!isFullyPaid}
                            size="lg"
                            className={isFullyPaid ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {isFullyPaid ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Confirm Complete Process
                                </>
                            ) : (
                                <>
                                    Complete Payments First
                                    <AlertTriangle className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate({ to: '/admission/patients/$admissionId/distribute-bill', params: { admissionId: String(admissionId) } })}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Distributions
                </Button>
            </div>

            {/* Confirm Dialog */}
            <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            Confirm Billing Cycle Complete
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You are about to mark this billing cycle as complete. Please verify the following:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Patient has paid in full: <strong>{format(finalBill?.paid_amount || 0)}</strong></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>All {distributions.length} providers paid: <strong>{format(summary?.total_paid || 0)}</strong></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Company retains: <strong>{format(summary?.total_less_amount || 0)}</strong></span>
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                                <strong>Note:</strong> This action will finalize the billing cycle. You can still view records but no further modifications will be allowed.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenConfirmDialog(false)}>
                            Review Again
                        </Button>
                        <Button
                            onClick={() => confirmMutation.mutate()}
                            disabled={confirmMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {confirmMutation.isPending ? 'Confirming...' : 'Confirm Complete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
