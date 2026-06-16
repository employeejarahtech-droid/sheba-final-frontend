import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Loader2, Building2, ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type AdmissionData = {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    sex: string
    phone: string
    admission_date: string
    discharge_date: string | null
    status: 'active' | 'discharged' | 'critical'
    bedCabin?: {
        id: number
        code: string
        type: string
        ward: string
    }
    doctor?: {
        id: number
        doctor_name: string
        speciality: string
    }
    diagnosis: string | null
    bill_created: number
    bill_created_date: string | null
    bill_created_by_user?: {
        id: number
        name: string
    }
    final_bill_created: number
    final_bill_created_date: string | null
    final_bill_created_by_user?: {
        id: number
        name: string
    }
    discharged: number
    discharged_date: string | null
    discharged_by_user?: {
        id: number
        name: string
    }
    payment_completed: number
    payment_completed_date: string | null
    payment_completed_by_user?: {
        id: number
        name: string
    }
    bills_distributed: number
    bills_distributed_date: string | null
    bills_distributed_by_user?: {
        id: number
        name: string
    }
    balance_distributed: number
    balance_distributed_date: string | null
    balance_distributed_by_user?: {
        id: number
        name: string
    }
    total_bill_amount?: number
    finalBill?: {
        id: number
        total_bill_amount: number
        total_discount: number
        total_discounted_amount: number
        paid_amount: number
        due_amount: number
        status: 'pending' | 'partial' | 'paid' | 'cancelled'
        payment_count: number
    }
    advancePayments?: {
        total_amount: number
        payment_count: number
        payments?: Array<{
            id: number
            amount: number
            payment_date: string
            notes?: string
            payment_method?: string
        }>
    }
}

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/$admissionId/print/$step')({
    component: AdmissionStepPrintPage,
})

function AdmissionStepPrintPage() {
    const { admissionId, step } = Route.useParams()
    const { format } = useCurrency()
    const token = getCookie('accessToken')

    const { data: admissionData, isLoading } = useQuery({
        queryKey: ['admission-detail', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission details')
            const data = await res.json()

            // Fetch final bill if exists
            const billRes = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (billRes.ok) {
                const billData = await billRes.json()
                data.data.finalBill = billData.data
            }

            // Fetch advance payments
            const advRes = await fetch(`${API_URL}/api/admission/${admissionId}/advance-payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (advRes.ok) {
                const advData = await advRes.json()
                data.data.advancePayments = advData.data
            }

            return data as { data: AdmissionData }
        },
        enabled: !!token,
    })

    const admission = admissionData?.data

    // Get step info
    const stepConfig: Record<string, { title: string; description: string; getStatus: () => boolean; getDate: () => string | null; getUser: () => string | null }> = {
        'bill-created': {
            title: 'Bill Created',
            description: 'Preliminary bill has been created for this admission',
            getStatus: () => admission?.bill_created === 1,
            getDate: () => admission?.bill_created_date || null,
            getUser: () => admission?.bill_created_by_user?.name || null,
        },
        'final-bill': {
            title: 'Final Bill Created',
            description: 'Final bill has been generated for this admission',
            getStatus: () => admission?.final_bill_created === 1,
            getDate: () => admission?.final_bill_created_date || null,
            getUser: () => admission?.final_bill_created_by_user?.name || null,
        },
        'discharged': {
            title: 'Patient Discharged',
            description: 'Patient has been discharged from the hospital',
            getStatus: () => admission?.discharged === 1,
            getDate: () => admission?.discharged_date || null,
            getUser: () => admission?.discharged_by_user?.name || null,
        },
        'payment-completed': {
            title: 'Payment Completed',
            description: 'All payments have been completed for this admission',
            getStatus: () => admission?.payment_completed === 1,
            getDate: () => admission?.payment_completed_date || null,
            getUser: () => admission?.payment_completed_by_user?.name || null,
        },
        'bills-distributed': {
            title: 'Bills Distributed',
            description: 'Bills have been distributed to relevant parties',
            getStatus: () => admission?.bills_distributed === 1,
            getDate: () => admission?.bills_distributed_date || null,
            getUser: () => admission?.bills_distributed_by_user?.name || null,
        },
        'balance-distributed': {
            title: 'Balance Distributed',
            description: 'Balance amount has been distributed',
            getStatus: () => admission?.balance_distributed === 1,
            getDate: () => admission?.balance_distributed_date || null,
            getUser: () => admission?.balance_distributed_by_user?.name || null,
        },
    }

    const currentStep = stepConfig[step]

    if (isLoading || !admission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!currentStep) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 text-lg font-semibold mb-4">Invalid Step Type</p>
                    <Link to="/dashboard/patients">
                        <Button variant="outline">Back to Admissions</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isCompleted = currentStep.getStatus()
    const stepDate = currentStep.getDate()
    const stepUser = currentStep.getUser()
    const formattedDate = stepDate ? new Date(stepDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'

    const admissionDate = admission.admission_date ? new Date(admission.admission_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'
    const dischargeDate = admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'
    const bedCabinInfo = admission.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : 'N/A'
    const doctorName = admission.doctor?.doctor_name || 'N/A'

    const statusColors = {
        active: { bg: '#dcfce7', color: '#166534' },
        discharged: { bg: '#f3f4f6', color: '#374151' },
        critical: { bg: '#fee2e2', color: '#991b1b' },
    }
    const statusStyle = statusColors[admission.status] || statusColors.active

    return (
        <>
            <AppHeader fixed />

            <Main>
                <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: '40px' }}>
                    <style>{`
                        .bg-row-blue {
                            background-color: #cfd2d8ff !important;
                        }
                        @media print {
                            .bg-row-blue {
                                background-color: #cfd2d8ff !important;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .bg-background {
                                background-color: #fff;
                            }
                            body {
                                color: #000;
                                background-color: #fff;
                            }
                            .border {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                            .border-dashed {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                            .no-print {
                                display: none !important;
                            }
                        }
                        @page {
                            margin: 1cm;
                            size: A4;
                        }
                    `}</style>

                    {/* Header Buttons */}
                    <div className="print:hidden flex items-center justify-between gap-4 mb-6">
                        <Link to="/dashboard/patients">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Admissions
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
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

                    {/* Title */}
                    <h1 className="text-xl font-bold text-center underline mb-2 tracking-wide uppercase">
                        {currentStep.title}
                    </h1>
                    <p className="text-center text-gray-600 text-sm mb-6">
                        {currentStep.description}
                    </p>

                    {/* Step Status Banner */}
                    <div className={`mb-6 p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-lg">
                                    Status: {isCompleted ? '✅ Completed' : '⏳ Pending'}
                                </p>
                                {isCompleted && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Completed on: {formattedDate}
                                        {stepUser && ` • By: ${stepUser}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Patient Information Table */}
                    <table className="w-full text-sm border mb-6">
                        <tbody>
                            <tr className="border">
                                <td className="border px-3 py-2 w-1/4">Admission ID : {admission.admission_prefix || `ADM-${admission.id}`}</td>
                                <td className="border px-3 py-2 w-1/4">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                <td className="border px-3 py-2 w-1/4">Age: {admission.age || 'N/A'}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={2}>Patient Name: {admission.patient_name || 'N/A'}</td>
                                <td className="border px-3 py-2">Sex: {admission.sex?.toUpperCase() || 'N/A'}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2">Phone: {admission.phone || 'N/A'}</td>
                                <td className="border px-3 py-2">Status: <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}</span></td>
                                <td className="border px-3 py-2">Ward: {admission.bedCabin?.ward || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Admission Details Table */}
                    <table className="w-full text-sm border mb-6">
                        <thead>
                            <tr className="border-t border-b bg-row-blue">
                                <th className="px-3 py-2 text-left w-[50%]">Detail</th>
                                <th className="px-3 py-2 text-left w-[50%]">Information</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-dashed">
                                <td className="px-3 py-2">Admission Date</td>
                                <td className="px-3 py-2">{admissionDate}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-3 py-2">Discharge Date</td>
                                <td className="px-3 py-2">{dischargeDate}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-3 py-2">Bed/Cabin</td>
                                <td className="px-3 py-2">{bedCabinInfo}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-3 py-2">Attending Doctor</td>
                                <td className="px-3 py-2">{doctorName}</td>
                            </tr>
                            {admission.diagnosis && (
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Diagnosis</td>
                                    <td className="px-3 py-2">{admission.diagnosis}</td>
                                </tr>
                            )}
                            {/* Show bill amount if bill created */}
                            {step === 'bill-created' && admission.total_bill_amount && (
                                <tr className="border-b border-dashed bg-blue-50">
                                    <td className="px-3 py-2 font-semibold">Total Bill Amount</td>
                                    <td className="px-3 py-2 font-semibold text-blue-700">{format(admission.total_bill_amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Financial Information if final bill */}
                    {(step === 'final-bill' || step === 'payment-completed') && admission.finalBill && (
                        <table className="w-full text-sm border mb-6">
                            <thead>
                                <tr className="border-t border-b bg-row-blue">
                                    <th className="px-3 py-2 text-left w-[50%]">Financial Detail</th>
                                    <th className="px-3 py-2 text-left w-[50%]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Total Amount</td>
                                    <td className="px-3 py-2">{format(admission.finalBill.total_discounted_amount)}</td>
                                </tr>
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Paid Amount</td>
                                    <td className="px-3 py-2">{format(admission.finalBill.paid_amount)}</td>
                                </tr>
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Due Amount</td>
                                    <td className="px-3 py-2">{format(admission.finalBill.due_amount)}</td>
                                </tr>
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Payment Status</td>
                                    <td className="px-3 py-2">{admission.finalBill.status.charAt(0).toUpperCase() + admission.finalBill.status.slice(1)}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}

                    {/* Footer Signatures */}
                    <div className="grid grid-cols-2 text-sm mt-20">
                        <div>
                            <p className="border-t border-dashed w-40 pt-1 text-center">Processed By:</p>
                        </div>
                        <div className="text-right">
                            <p className="border-t border-dashed w-56 ml-auto pt-1">
                                Authorized By:
                            </p>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
