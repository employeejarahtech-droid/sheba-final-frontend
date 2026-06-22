import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { ArrowLeft, Printer, FileText, Calendar, User, Phone, Stethoscope, Activity, Home, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

const API_URL = import.meta.env.VITE_API_URL

type BillingData = {
    id: number
    admission_id: number
    patient_name: string
    billing_date: string
    total_amount: number
    status: 'pending' | 'paid' | 'partial'
    created_at: string
    operations?: OperationType[]
    consultants?: Consultant[]
    services?: Service[]
    admission?: AdmissionDetails
}

type OperationType = {
    id: number
    operation_type: string
    operation_date: string
    charges: number
}

type Consultant = {
    id: number
    consultant_id: number
    consultant_name?: string
    visit_date: string
    fees: number
}

type Service = {
    id: number
    service_id: number
    service_name?: string
    service_provider: string
    service_against: string
    amount: number
}

type AdmissionDetails = {
    age: number
    sex: string
    phone: string
    admission_date: string
    bedCabin?: {
        code: string
        type: string
    }
    doctor?: {
        doctor_name: string
    }
    diagnosis?: string
}

export function BillingViewPage() {
    const { billingId } = useParams({ from: '/_authenticated/dashboard/admission/billing/$billingId/' })
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { formatDate } = useDateFormat()
    const { format } = useCurrency()
    const safeFormatDate = (dateVal: any) => {
        if (!dateVal) return '-'
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
            const [y, m, day] = dateVal.split('-').map(Number)
            return formatDate(new Date(y, m - 1, day))
        }
        const d = new Date(dateVal)
        if (isNaN(d.getTime())) return '-'
        return formatDate(d)
    }

    // Fetch billing details
    const { data: billingData, isLoading, error } = useQuery({
        queryKey: ['billing', billingId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/billing/${billingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to fetch billing details')
            }
            return res.json()
        },
        enabled: !!token && !!billingId,
    })

    const billing = billingData?.data as BillingData | undefined

    // Calculate totals
    const totalOperations = billing?.operations?.reduce((sum, op) => sum + Number(op.charges), 0) || 0
    const totalConsultants = billing?.consultants?.reduce((sum, c) => sum + Number(c.fees), 0) || 0
    const totalServices = billing?.services?.reduce((sum, s) => sum + Number(s.amount), 0) || 0

    const handlePrint = () => {
        window.print()
    }

    const handleAddAnotherBill = () => {
        if (billing?.admission_id) {
            navigate({ to: `/dashboard/admission/patients/${billing.admission_id}/billing` })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-4">Loading billing details...</span>
            </div>
        )
    }

    if (error || !billing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-red-500 font-semibold mb-4">
                                {(error as Error)?.message || 'Billing not found'}
                            </p>
                            <Button onClick={() => navigate({ to: '/dashboard/admission/patients' })}>
                                Back to Patients List
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background print:bg-white print:dark:bg-white">
            <div className="max-w-5xl mx-auto p-6 print:p-8">
                <PageHeader
                    title="Bill Details"
                    subtitle="View and manage billing information"
                    backButton={{
                        onClick: () => navigate({ to: '/dashboard/admission/patients' }),
                    }}
                    actions={
                        <>
                            <Button
                                variant="outline"
                                onClick={handleAddAnotherBill}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Another Bill
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                        </>
                    }
                    className="mb-6 print:hidden"
                />

                {/* Bill Header */}
                <Card className="mb-6">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8" />
                                <div>
                                    <CardTitle className="text-2xl">Patient Billing Invoice</CardTitle>
                                    <p className="text-blue-100 text-sm">Bill #{billing.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-100">Bill Date</p>
                                <p className="font-semibold">{safeFormatDate(billing.billing_date)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm text-muted-foreground">Status</span>
                                <p className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[billing.status]}`}>
                                    {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                <p className="text-3xl font-bold text-blue-600">{format(Number(billing.total_amount))}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Patient Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Patient Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <span className="text-sm text-muted-foreground">Patient Name</span>
                                    <p className="font-semibold">{billing.patient_name}</p>
                                </div>
                            </div>
                            {billing.admission && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Age/Sex</span>
                                            <p className="font-semibold">{billing.admission.age}/{billing.admission.sex.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Phone</span>
                                            <p className="font-semibold">{billing.admission.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Admission Date</span>
                                            <p className="font-semibold">
                                                {safeFormatDate(billing.admission.admission_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Bed/Cabin</span>
                                            <p className="font-semibold">
                                                {billing.admission.bedCabin
                                                    ? `${billing.admission.bedCabin.code} (${billing.admission.bedCabin.type})`
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Doctor</span>
                                            <p className="font-semibold">{billing.admission.doctor?.doctor_name || '-'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Operation Types */}
                {billing.operations && billing.operations.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Operation Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">SL</th>
                                            <th className="text-left p-3">Operation Type</th>
                                            <th className="text-left p-3">Date</th>
                                            <th className="text-right p-3">Charges</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.operations.map((op, index) => (
                                            <tr key={op.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">{op.operation_type}</td>
                                                <td className="p-3">{safeFormatDate(op.operation_date)}</td>
                                                <td className="p-3 text-right">{format(Number(op.charges))}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-b-2 border-gray-300 dark:border-gray-700 font-semibold">
                                            <td className="p-3" colSpan={3}>Total Operations</td>
                                            <td className="p-3 text-right">{format(totalOperations)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Consultants */}
                {billing.consultants && billing.consultants.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Consultants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">SL</th>
                                            <th className="text-left p-3">Consultant Name</th>
                                            <th className="text-left p-3">Date</th>
                                            <th className="text-right p-3">Fees</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.consultants.map((cons, index) => (
                                            <tr key={cons.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">{cons.consultant_name || '-'}</td>
                                                <td className="p-3">{safeFormatDate(cons.visit_date)}</td>
                                                <td className="p-3 text-right">{format(Number(cons.fees))}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-b-2 border-gray-300 dark:border-gray-700 font-semibold">
                                            <td className="p-3" colSpan={3}>Total Consultants</td>
                                            <td className="p-3 text-right">{format(totalConsultants)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Clinical Services */}
                {billing.services && billing.services.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Clinical Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">SL</th>
                                            <th className="text-left p-3">Service</th>
                                            <th className="text-left p-3">Provider</th>
                                            <th className="text-left p-3">Against</th>
                                            <th className="text-right p-3">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.services.map((srv, index) => (
                                            <tr key={srv.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">{srv.service_name || '-'}</td>
                                                <td className="p-3">{srv.service_provider}</td>
                                                <td className="p-3">{srv.service_against}</td>
                                                <td className="p-3 text-right">{format(Number(srv.amount))}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-b-2 border-gray-300 dark:border-gray-700 font-semibold">
                                            <td className="p-3" colSpan={4}>Total Services</td>
                                            <td className="p-3 text-right">{format(totalServices)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 print:bg-white print:dark:bg-white p-0">
                    <CardHeader>
                        <CardTitle>Billing Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {billing.operations && billing.operations.length > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span>Operation Types Charges:</span>
                                    <span className="font-bold">{format(totalOperations)}</span>
                                </div>
                            )}
                            {billing.consultants && billing.consultants.length > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span>Consultant Fees:</span>
                                    <span className="font-bold">{format(totalConsultants)}</span>
                                </div>
                            )}
                            {billing.services && billing.services.length > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span>Services Charges:</span>
                                    <span className="font-bold">{format(totalServices)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-bold">Grand Total:</span>
                                <span className="text-2xl font-bold text-blue-600">{format(Number(billing.total_amount))}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-between items-center print:hidden">
                    <Button
                        variant="outline"
                        onClick={() => navigate({ to: '/dashboard/admission/patients' })}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients List
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleAddAnotherBill}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another Bill
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
