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

    const { data: companySettings } = useQuery({
        queryKey: ["company-settings"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch company settings");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token,
    })

    const admission = admissionData?.data
    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null;
    const companyName = companySettings?.company_name || 'Sheba Hospital';

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
                    <Link to="/dashboard/admission/patients">
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

    const formattedAdmissionDate = admission.admission_date 
        ? new Date(admission.admission_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
        : 'N/A'
    const formattedAdmissionTime = admission.created_at
        ? new Date(admission.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : ''
    const admissionDateAndTime = formattedAdmissionTime 
        ? `${formattedAdmissionDate} ${formattedAdmissionTime}` 
        : formattedAdmissionDate
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
            <AppHeader fixed className="print:hidden" />

            <Main>
                <div className="invoice-print-area max-w-3xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none">
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
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #fff !important;
                            }
                            /* Hide app chrome on print */
                            .print\\:hidden {
                                display: none !important;
                            }
                            /* Reset layout constraints for printing */
                            .invoice-print-area {
                                max-width: 100% !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                box-shadow: none !important;
                            }
                            .invoice-print-area table {
                                width: 100% !important;
                            }
                            /* Avoid breaking rows across pages */
                            tr, td, th {
                                page-break-inside: avoid;
                            }
                            .border {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                            .border-dashed {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                        }
                        @page {
                            margin: 12mm;
                            size: A4 portrait;
                        }
                    `}</style>

                    {/* Back & Print Buttons */}
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button size="sm" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <div className='flex justify-center items-center gap-8'>
                            {companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt="Company Logo"
                                    className="w-24 h-24 object-contain"
                                />
                            ) : null}

                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-slate-900">{companyName}</h1>
                                <p className="text-sm mt-1 leading-5 text-slate-600">
                                    {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-center underline mb-1 tracking-wide uppercase text-slate-800">
                        {currentStep.title}
                    </h2>
                    <p className="text-center text-slate-500 text-xs mb-6 uppercase tracking-wider font-semibold">
                        {currentStep.description}
                    </p>

                    {/* Verification Status */}
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-6 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold">Verification Status</span>
                                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-1">
                                    {isCompleted ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                                            Pending
                                        </>
                                    )}
                                </span>
                            </div>
                            {isCompleted && (
                                <div>
                                    <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold">Completion Details</span>
                                    <span className="text-slate-700 block text-xs mt-1">
                                        Date: <strong>{formattedDate}</strong> {stepUser && <>• By: <strong>{stepUser}</strong></>}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Information Table */}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Patient Details</h3>
                    <table className="w-full text-sm border mb-6">
                        <tbody>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/3">
                                    Admission ID: <strong>{admission.admission_prefix || `ADM-${admission.id}`}</strong>
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Generated Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Patient Status: <strong style={{ color: statusStyle.color }}>{admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}</strong>
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1" colSpan={2}>
                                    Patient Name: <strong>{admission.patient_name || 'N/A'}</strong>
                                    {admission.age || admission.sex ? ` — ${admission.age ? `${admission.age} yrs` : ''}${admission.age && admission.sex ? ' / ' : ''}${admission.sex ? admission.sex.toUpperCase() : ''}` : ''}
                                </td>
                                <td className="border px-2 py-1">
                                    Phone: {admission.phone || 'N/A'}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1">
                                    Bed/Cabin: {bedCabinInfo}
                                </td>
                                <td className="border px-2 py-1">
                                    Ward: {admission.bedCabin?.ward || 'N/A'}
                                </td>
                                <td className="border px-2 py-1">
                                    Attending Doctor: <strong>{doctorName}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Admission Details Table */}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Admission Details</h3>
                    <table className="w-full text-sm border mb-6">
                        <thead>
                            <tr className="border-t border-b bg-row-blue">
                                <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Detail</th>
                                <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Information</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Admission Date and Time</td>
                                <td className="px-2 py-1 text-xs font-semibold">{admissionDateAndTime}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Discharge Date</td>
                                <td className="px-2 py-1 text-xs font-semibold">{dischargeDate}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Bed/Cabin Info</td>
                                <td className="px-2 py-1 text-xs font-semibold">{bedCabinInfo}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Attending Doctor</td>
                                <td className="px-2 py-1 text-xs font-semibold">{doctorName}</td>
                            </tr>
                            {admission.diagnosis && (
                                <tr className="border-b border-dashed">
                                    <td className="px-2 py-1 text-xs">Diagnosis</td>
                                    <td className="px-2 py-1 text-xs font-semibold">{admission.diagnosis}</td>
                                </tr>
                            )}
                            {/* Show bill amount if bill created */}
                            {step === 'bill-created' && admission.total_bill_amount && (
                                <tr className="border-b-2 font-bold bg-slate-50">
                                    <td className="px-2 py-1 text-xs">Total Bill Amount</td>
                                    <td className="px-2 py-1 text-xs text-slate-900 font-semibold">{format(admission.total_bill_amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Financial Information if final bill */}
                    {(step === 'final-bill' || step === 'payment-completed') && admission.finalBill && (
                        <>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Financial Summary</h3>
                            <table className="w-full text-sm border mb-6">
                                <thead>
                                    <tr className="border-t border-b bg-row-blue">
                                        <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Financial Detail</th>
                                        <th className="px-2 py-1 text-right text-xs uppercase w-[50%]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Total Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.total_discounted_amount)}</td>
                                    </tr>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Paid Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.paid_amount)}</td>
                                    </tr>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Due Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.due_amount)}</td>
                                    </tr>
                                    <tr className="border-b-2 font-bold bg-slate-50">
                                        <td className="px-2 py-1 text-xs">Payment Status</td>
                                        <td className="px-2 py-1 text-xs text-right uppercase tracking-wider">{admission.finalBill.status}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Footer Signatures */}
                    <div className="grid grid-cols-2 text-sm mt-24">
                        <div>
                            <p className="border-t border-dashed w-40 pt-1 text-center text-xs">Processed By:</p>
                        </div>
                        <div className="text-right">
                            <p className="border-t border-dashed w-56 ml-auto pt-1 text-center text-xs">
                                Authorized By:
                            </p>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
