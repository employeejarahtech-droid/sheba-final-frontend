import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Loader2, ArrowLeft, FileText, Building2 } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL

type BillingData = {
    patient_name: string
    age: number
    sex: string
    phone: string
    admission_date: string
    bedCabin?: {
        code: string
        type: string
        ward: string
        price: number
    }
    doctor?: {
        doctor_name: string
    }
    diagnosis?: string
}

type Operation = {
    operation_type: string
    operation_date: string
    charges: number
}

type Consultant = {
    consultant_name: string
    visit_date: string
    fees: number
}

type Surgeon = {
    surgeon_name: string
    operation_date: string
    fees: number
}

type Assistant = {
    assistant_name: string
    operation_date: string
    fees: number
}

type Service = {
    service_name: string
    note: string
    amount: number
}

type BedBill = {
    bed_code: string
    bed_type: string
    from_date: string
    to_date: string
    days: number
    rate_per_day: number
    total_amount: number
}

export function BillingPrintPage() {
    const { admissionId } = useParams({ from: '/_authenticated/dashboard/admission/patients/$admissionId/billing-print/' })
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

    // Fetch admission details
    const { data: admissionData, isLoading: admissionLoading } = useQuery({
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

    // Fetch operations
    const { data: operationsData } = useQuery({
        queryKey: ['billing-operations', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/operations/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch consultants
    const { data: consultantsData } = useQuery({
        queryKey: ['billing-consultants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/consultants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch surgeons
    const { data: surgeonsData } = useQuery({
        queryKey: ['billing-surgeons', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/surgeons/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch assistants
    const { data: assistantsData } = useQuery({
        queryKey: ['billing-assistants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/assistants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch services
    const { data: servicesData } = useQuery({
        queryKey: ['billing-services', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/services/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch bed billing
    const { data: bedBillingData } = useQuery({
        queryKey: ['bed-billing', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/bed-cabins/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch bed charges
    const { data: bedChargesData } = useQuery({
        queryKey: ['bed-charges', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/bed-charges`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: { total: 0, breakdown: [] } }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    if (admissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const admission = admissionData?.data as BillingData
    const operations = operationsData?.data || []
    const consultants = consultantsData?.data || []
    const surgeons = surgeonsData?.data || []
    const assistants = assistantsData?.data || []
    const services = servicesData?.data || []
    const bedBills = bedBillingData?.data || []

    const bedCharges = bedChargesData?.data || { total: 0, breakdown: [] }
    const totalBedCharges = bedBills.length > 0
        ? bedBills.reduce((sum: number, b: BedBill) => sum + Number(b.total_amount), 0)
        : bedCharges.total

    const totalOperations = operations.reduce((sum: number, op: Operation) => sum + Number(op.charges), 0)
    const totalConsultants = consultants.reduce((sum: number, c: Consultant) => sum + Number(c.fees), 0)
    const totalSurgeons = surgeons.reduce((sum: number, s: Surgeon) => sum + Number(s.fees), 0)
    const totalAssistants = assistants.reduce((sum: number, a: Assistant) => sum + Number(a.fees), 0)
    const totalServices = services.reduce((sum: number, s: Service) => sum + Number(s.amount), 0)
    const grandTotal = totalBedCharges + totalOperations + totalConsultants + totalSurgeons + totalAssistants + totalServices

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
                {/* Print Button - Hidden when printing */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Button variant="outline" onClick={() => window.close()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={handlePrint}>
                        <FileText className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>

                {/* Header */}
                <div className="text-center border-b-2 border-blue-600 pb-6 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-bold text-gray-800">Sheba Hospital</h1>
                            <p className="text-sm text-gray-600">Healthcare Excellence</p>
                        </div>
                    </div>
                    <div className="text-gray-600 text-sm space-y-1">
                        <p className="font-medium">Providing Quality Healthcare Services</p>
                    </div>
                </div>

                {/* Document Title */}
                <div className="text-center bg-gray-50 rounded-lg py-3 mb-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Patient Billing Statement</h2>
                    <p className="text-sm text-gray-600">Admission ID: {admissionId} | Generated: {safeFormatDate(new Date())}</p>
                </div>

                {/* Patient Information */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Name:</span>
                            <p className="font-medium">{admission?.patient_name || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Age/Sex:</span>
                            <p className="font-medium">{admission?.age || '-'}/{admission?.sex?.toUpperCase() || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Phone:</span>
                            <p className="font-medium">{admission?.phone || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Admission Date:</span>
                            <p className="font-medium">
                                {admission?.admission_date ? safeFormatDate(admission.admission_date) : '-'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Bed/Cabin:</span>
                            <p className="font-medium">
                                {admission?.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : '-'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-600">Doctor:</span>
                            <p className="font-medium">{admission?.doctor?.doctor_name || '-'}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-600">Diagnosis:</span>
                            <p className="font-medium">{admission?.diagnosis || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Charges Table */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Charges Details</h2>

                    {bedBills.length > 0 || bedCharges.breakdown?.length > 0 ? (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Bed/Cabin Charges</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Description</th>
                                        <th className="border p-2 text-center">Days</th>
                                        <th className="border p-2 text-right">Rate</th>
                                        <th className="border p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bedBills.length > 0 ? (
                                        bedBills.map((bill: BedBill, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border p-2">{bill.bed_code} ({bill.bed_type})</td>
                                                <td className="border p-2 text-center">{bill.days}</td>
                                                <td className="border p-2 text-right">{format(Number(bill.rate_per_day))}</td>
                                                <td className="border p-2 text-right">{format(Number(bill.total_amount))}</td>
                                            </tr>
                                        ))
                                    ) : bedCharges.breakdown?.map((bed: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{bed.bed_code} ({bed.bed_type})</td>
                                            <td className="border p-2 text-center">{bed.days}</td>
                                            <td className="border p-2 text-right">{format(Number(bed.daily_rate))}</td>
                                            <td className="border p-2 text-right">{format(Number(bed.charges))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {operations.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Operation Types</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Operation Type</th>
                                        <th className="border p-2 text-left">Date</th>
                                        <th className="border p-2 text-right">Charges</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operations.map((op: Operation, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{op.operation_type}</td>
                                            <td className="border p-2">{safeFormatDate(op.operation_date)}</td>
                                            <td className="border p-2 text-right">{format(Number(op.charges))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {consultants.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Consultants</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Consultant</th>
                                        <th className="border p-2 text-left">Visit Date</th>
                                        <th className="border p-2 text-right">Fees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultants.map((c: Consultant, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{c.consultant_name}</td>
                                            <td className="border p-2">{safeFormatDate(c.visit_date)}</td>
                                            <td className="border p-2 text-right">{format(Number(c.fees))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {surgeons.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Surgeons</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Surgeon</th>
                                        <th className="border p-2 text-left">Operation Date</th>
                                        <th className="border p-2 text-right">Fees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {surgeons.map((s: Surgeon, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{s.surgeon_name}</td>
                                            <td className="border p-2">{safeFormatDate(s.operation_date)}</td>
                                            <td className="border p-2 text-right">{format(Number(s.fees))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {assistants.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Assistants</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Assistant</th>
                                        <th className="border p-2 text-left">Operation Date</th>
                                        <th className="border p-2 text-right">Fees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assistants.map((a: Assistant, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{a.assistant_name}</td>
                                            <td className="border p-2">{safeFormatDate(a.operation_date)}</td>
                                            <td className="border p-2 text-right">{format(Number(a.fees))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {services.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-medium text-md mb-2 text-blue-600">Clinical Services</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Service</th>
                                        <th className="border p-2 text-left">Note</th>
                                        <th className="border p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((s: Service, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border p-2">{s.service_name}</td>
                                            <td className="border p-2">{s.note || '-'}</td>
                                            <td className="border p-2 text-right">{format(Number(s.amount))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="border-t pt-4">
                    <h2 className="text-lg font-semibold mb-3">Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                            <span>Bed/Cabin Charges:</span>
                            <span>{format(totalBedCharges)}</span>
                        </div>
                        {totalOperations > 0 && (
                            <div className="flex justify-between py-1">
                                <span>Operation Types Charges:</span>
                                <span>{format(totalOperations)}</span>
                            </div>
                        )}
                        {totalConsultants > 0 && (
                            <div className="flex justify-between py-1">
                                <span>Consultant Fees:</span>
                                <span>{format(totalConsultants)}</span>
                            </div>
                        )}
                        {totalSurgeons > 0 && (
                            <div className="flex justify-between py-1">
                                <span>Surgeon Fees:</span>
                                <span>{format(totalSurgeons)}</span>
                            </div>
                        )}
                        {totalAssistants > 0 && (
                            <div className="flex justify-between py-1">
                                <span>Assistant Fees:</span>
                                <span>{format(totalAssistants)}</span>
                            </div>
                        )}
                        {totalServices > 0 && (
                            <div className="flex justify-between py-1">
                                <span>Services Charges:</span>
                                <span>{format(totalServices)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
                            <span>Grand Total:</span>
                            <span className="text-blue-600">{format(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-sm text-gray-600">
                    <p>Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
}
