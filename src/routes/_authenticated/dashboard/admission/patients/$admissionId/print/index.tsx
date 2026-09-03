import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Loader2, Building2, ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type CompanySettings = {
    company_name?: string
    company_logo?: string | null
    address1?: string | null
    address2?: string | null
    phone?: string | null
    email?: string | null
}

type AdmissionData = {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    age_text?: string
    sex: string
    phone: string
    admission_date: string
    admission_time?: string | null
    discharge_date: string | null
    status: 'active' | 'discharged' | 'critical'
    address?: string | null
    village?: string | null
    district?: string | null
    division?: string | null
    country?: string | null
    referredByDoctor?: {
        id: number
        doctor_name: string
        speciality: string
    } | null
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
    created_by_user?: {
        id: number
        name: string
    }
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

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/$admissionId/print/')({
    component: AdmissionPrintPage,
})

function AdmissionPrintPage() {
    const { admissionId } = Route.useParams()
    const { format } = useCurrency()

    const token = getCookie('accessToken')

    // Fetch company settings for logo, name and address
    const { data: companySettings } = useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async (): Promise<CompanySettings> => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return {} as CompanySettings
            const data = await res.json()
            return data.data
        },
        enabled: !!token,
        retry: false,
        refetchOnWindowFocus: false,
    })

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

    if (isLoading || !admission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading admission details...</p>
                </div>
            </div>
        )
    }

    const formattedAdmissionDate = admission.admission_date
        ? new Date(admission.admission_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'N/A'
    // Prefer the recorded admission time; older rows may only have created_at.
    const admissionTime = admission.admission_time
        || (admission.created_at
            ? new Date(admission.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '')
    const admissionDateAndTime = admissionTime
        ? `${formattedAdmissionDate} ${admissionTime}`
        : formattedAdmissionDate
    const dischargeDate = admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'
    const bedCabinInfo = admission.bedCabin
        ? `${admission.bedCabin.code} (${admission.bedCabin.type})${admission.bedCabin.ward ? `, Ward: ${admission.bedCabin.ward}` : ''}`
        : 'N/A'
    const doctorName = admission.doctor?.doctor_name || 'N/A'
    const refByDoctorName = admission.referredByDoctor?.doctor_name || 'N/A'
    // Composite address: village/area parts first, then the detailed address line.
    const addressParts = [
        admission.village,
        admission.district,
        admission.division,
        admission.country,
    ].filter(Boolean)
    const patientDetails = [
        addressParts.length ? addressParts.join(', ') : '',
        admission.address || '',
    ].filter(Boolean).join(' — ') || 'N/A'

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
                        <Link to="/dashboard/admission/patients">
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

                    {/* Header: Logo/Company (left 50%) + Title (right 50%) */}
                    <div className="mb-6 flex items-start justify-between gap-6">
                        <div className="w-1/2 flex items-center gap-4">
                            {companySettings?.company_logo ? (
                                <img
                                    src={companySettings.company_logo.startsWith('http') ? companySettings.company_logo : `${API_URL}${companySettings.company_logo}`}
                                    alt="Company Logo"
                                    className="w-24 h-24 object-contain"
                                />
                            ) : (
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full shadow-lg">
                                    <Building2 className="h-8 w-8 text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold">{companySettings?.company_name || 'Hospital'}</h1>
                                {companySettings?.address1 && (
                                    <p className="text-sm mt-1 leading-5">{companySettings.address1}</p>
                                )}
                                {companySettings?.address2 && (
                                    <p className="text-sm leading-5">{companySettings.address2}</p>
                                )}
                            </div>
                        </div>

                        <div className="w-1/2 text-right">
                            <h2 className="text-xl font-bold tracking-widest uppercase">Admission Form</h2>
                            <p className="text-sm mt-1 leading-5">Admission Date: {formattedAdmissionDate}</p>
                            <p className="text-sm leading-5">Discharge Date: {dischargeDate}</p>
                        </div>
                    </div>

                    {/* Patient Information Table — fixed 4-column grid so every
                        row's cells align: 50/50, 50/25/25, then full-width. */}
                    <table className="w-full table-fixed text-sm border mb-6">
                        <colgroup>
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                        </colgroup>
                        <tbody>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={2}>Admission ID : {admission.admission_prefix || `ADM-${admission.id}`}</td>
                                <td className="border px-3 py-2" colSpan={2}>Date &amp; Time : {admissionDateAndTime}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={2}>Patient Name: {admission.patient_name || 'N/A'}</td>
                                <td className="border px-3 py-2">Age: {admission.age_text || admission.age || 'N/A'}</td>
                                <td className="border px-3 py-2">Sex: {admission.sex?.toUpperCase() || 'N/A'}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={4}>Ref By: {refByDoctorName}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={4}>Surgeon / Consultant: {doctorName}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={4}>Bed / Cabin No: {bedCabinInfo}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={4}>Contact No: {admission.phone || 'N/A'}</td>
                            </tr>
                            <tr className="border">
                                <td className="border px-3 py-2" colSpan={4}>Patient Details: {patientDetails}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Admission Details Table — clinical extras not covered above */}
                    {admission.diagnosis && (
                        <table className="w-full text-sm border mb-6">
                            <thead>
                                <tr className="border-t border-b bg-row-blue">
                                    <th className="px-3 py-2 text-left w-[50%]">Detail</th>
                                    <th className="px-3 py-2 text-left w-[50%]">Information</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-dashed">
                                    <td className="px-3 py-2">Diagnosis</td>
                                    <td className="px-3 py-2">{admission.diagnosis}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}



                    {/* Signature Row */}
                    <div className="flex justify-between mt-32 text-sm w-full">
                        <div style={{ textAlign: 'left' }}>
                            <p className="border-t border-dashed pt-1">
                                Prepared By: <span className="font-medium">{admission.created_by_user?.name || '-'}</span>
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="inline-block border-t border-dashed pt-1">Authorized Signature:</span>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
