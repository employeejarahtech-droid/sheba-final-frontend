import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { ArrowLeft, FileText, Calendar, User, Phone, BedDouble, Stethoscope, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/hooks/use-currency'
import { PageHeader } from '@/components/layout/page-header'

export function BillCreatedPage() {
    const { admissionId } = useParams({ from: '/_authenticated/dashboard/admission/patients/$admissionId/bill-created/' })
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { format } = useCurrency()
    const { formatDate } = useDateFormat()
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

    // Fetch admission details
    const { data: admissionData, isLoading } = useQuery({
        queryKey: ['admission', admissionId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission')
            return await res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch billing items
    const { data: billingData } = useQuery({
        queryKey: ['billing-items', admissionId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/items/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch billing items')
            return await res.json()
        },
        enabled: !!token && !!admissionId,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    const admission = admissionData?.data
    const items = billingData?.data || []

    // Calculate totals
    const operationsTotal = items.filter((i: any) => i.item_type === 'operation').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const consultantsTotal = items.filter((i: any) => i.item_type === 'consultant').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const servicesTotal = items.filter((i: any) => i.item_type === 'service').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const surgeonsTotal = items.filter((i: any) => i.item_type === 'surgeon').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const assistantsTotal = items.filter((i: any) => i.item_type === 'assistant').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const bedTotal = items.filter((i: any) => i.item_type === 'bed_cabin').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
    const grandTotal = operationsTotal + consultantsTotal + servicesTotal + surgeonsTotal + assistantsTotal + bedTotal

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <PageHeader
                title="Bill Created"
                subtitle={`Billing details for admission #${admissionId}`}
                backButton={{
                    onClick: () => navigate({ to: '/dashboard/admission/patients' }),
                    label: 'Back to Patients',
                }}
                actions={
                    <Badge className={admission?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {admission?.status?.charAt(0).toUpperCase() + admission?.status?.slice(1)}
                    </Badge>
                }
            />

            {/* Patient Information Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Patient Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">Patient Name</span>
                            <p className="font-semibold">{admission?.patient_name || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Age/Sex</span>
                            <p className="font-semibold">{admission?.age || '-'}/{admission?.sex?.toUpperCase() || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Phone</span>
                            <p className="font-semibold">{admission?.phone || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Admission Date</span>
                            <p className="font-semibold">
                                {admission?.admission_date ? safeFormatDate(admission.admission_date) : '-'}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Bed/Cabin</span>
                            <p className="font-semibold">
                                {admission?.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : '-'}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Doctor</span>
                            <p className="font-semibold">{admission?.doctor?.doctor_name || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Diagnosis</span>
                            <p className="font-semibold">{admission?.diagnosis || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Bill Created</span>
                            <p className="font-semibold text-green-600">
                                {admission?.bill_created_date ? safeFormatDate(admission.bill_created_date) : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Billing Items */}
            <div className="grid gap-6">
                {/* Operations */}
                {items.filter((i: any) => i.item_type === 'operation').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Operation Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'operation').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.operation_type || item.name}</p>
                                            <p className="text-sm text-muted-foreground">{safeFormatDate(item.operation_date)}</p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Operations</p>
                                    <p className="font-bold text-lg">{format(operationsTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Consultants */}
                {items.filter((i: any) => i.item_type === 'consultant').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'consultant').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.doctor?.doctor_name || item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.visit_type || 'Consultation'}</p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Consultants</p>
                                    <p className="font-bold text-lg">{format(consultantsTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Clinical Services */}
                {items.filter((i: any) => i.item_type === 'service').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Clinical Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'service').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.service?.name || item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.note || '-'}</p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Services</p>
                                    <p className="font-bold text-lg">{format(servicesTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Surgeons */}
                {items.filter((i: any) => i.item_type === 'surgeon').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Surgeons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'surgeon').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.surgeon?.name || item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.operation_type || '-'}</p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Surgeons</p>
                                    <p className="font-bold text-lg">{format(surgeonsTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assistants */}
                {items.filter((i: any) => i.item_type === 'assistant').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Assistants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'assistant').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.assistant?.name || item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.operation_type || '-'}</p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Assistants</p>
                                    <p className="font-bold text-lg">{format(assistantsTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Bed/Cabin Charges */}
                {items.filter((i: any) => i.item_type === 'bed_cabin').length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BedDouble className="h-5 w-5" />
                                Bed/Cabin Charges
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {items.filter((i: any) => i.item_type === 'bed_cabin').map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.bed_cabin?.code || 'Bed/Cabin'} ({item.days} days)</p>
                                            <p className="text-sm text-muted-foreground">
                                                {safeFormatDate(item.from_date)} to {safeFormatDate(item.to_date)}
                                            </p>
                                        </div>
                                        <p className="font-semibold">{format(parseFloat(item.amount || 0))}</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <p className="font-semibold">Total Bed Charges</p>
                                    <p className="font-bold text-lg">{format(bedTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Grand Total Summary */}
                <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="h-6 w-6" />
                            Grand Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {format(grandTotal)}
                        </div>
                        <p className="text-purple-100 mt-2">
                            {items.length} billing item{items.length !== 1 ? 's' : ''} added
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
                <Button
                    onClick={() => navigate({ to: `/dashboard/admission/patients/${admissionId}/billing` })}
                    className="flex-1"
                >
                    Add More Items
                </Button>
                <Button
                    onClick={() => navigate({ to: `/dashboard/admission/patients/${admissionId}/final-bill` })}
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                >
                    Finalise Bill
                </Button>
                <Button
                    onClick={() => navigate({ to: `/dashboard/admission/patients/${admissionId}/print` })}
                    variant="outline"
                    className="flex-1"
                >
                    Print
                </Button>
            </div>
        </div>
    )
}
