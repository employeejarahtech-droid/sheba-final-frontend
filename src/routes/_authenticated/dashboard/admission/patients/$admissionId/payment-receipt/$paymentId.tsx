import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useEffect, useRef } from 'react'
import { Loader2, ArrowLeft, Printer, Building2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

const API_URL = import.meta.env.VITE_API_URL

type CompanySettings = {
    company_name?: string
    company_logo?: string | null
    address1?: string | null
    address2?: string | null
    phone?: string | null
    email?: string | null
}

type PaymentItem = {
    id: number
    final_bill_id: number | null
    admission_id: number
    amount: number
    payment_date: string
    notes: string | null
    payment_method: string
    created_at: string
    created_by_user?: {
        id: number
        name: string
    }
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
    doctor?: {
        doctor_name: string
        speciality: string
    }
    bedCabin?: {
        code: string
        type: string
        ward: string
    }
}

export const Route = createFileRoute(
    '/_authenticated/dashboard/admission/patients/$admissionId/payment-receipt/$paymentId',
)({
    component: PaymentReceiptPrintPage,
})

function amountToWords(num: number): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const convert = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + 'crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    }

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = convert(integerPart).trim();
    if (result) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    if (decimalPart > 0) {
        result += ` and ${convert(decimalPart).trim()} paisa`;
    }

    return result ? result + ' Only' : '';
}

function PaymentReceiptPrintPage() {
    const { admissionId, paymentId } = Route.useParams()
    const { format } = useCurrency()
    const { formatDate } = useDateFormat()
    const token = getCookie('accessToken')

    const hasPrinted = useRef(false)

    // Fetch company settings
    const { data: companySettings } = useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return {}
            const d = await res.json()
            return d.data
        },
        enabled: !!token,
    })

    // Fetch admission details
    const { data: admissionData, isLoading: admissionLoading } = useQuery({
        queryKey: ['admission-detail', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch payments list
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['admission-payments', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const admission = admissionData?.data as AdmissionData | undefined
    const payments = paymentsData?.data as PaymentItem[] | undefined
    const currentPayment = payments?.find((p) => p.id === Number(paymentId))

    // Auto-print only on initial load, not on refresh
    useEffect(() => {
        if (admission && currentPayment && !hasPrinted.current) {
            const printKey = `payment-print-${paymentId}`
            const alreadyPrinted = sessionStorage.getItem(printKey)

            if (!alreadyPrinted) {
                hasPrinted.current = true
                sessionStorage.setItem(printKey, 'true')
                setTimeout(() => {
                    window.print()
                }, 500)
            }
        }
    }, [admission, currentPayment, paymentId])

    const isLoading = admissionLoading || paymentsLoading

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        )
    }

    if (!admission || !currentPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <p className="text-red-600 text-lg font-semibold mb-4">Payment Receipt Not Found</p>
                    <Button onClick={() => window.history.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    const fmtDateTime = (d: any) => {
        if (!d) return '-'
        const date = new Date(d)
        return `${formatDate(date)} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    }

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <div className="max-w-3xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:mt-0 print:pb-0" style={{ paddingTop: '20px' }}>

                    {/* Header Action Buttons */}
                    <div className="print:hidden flex items-center justify-between gap-4 mb-6">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button variant="default" size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                    </div>

                    {/* Hospital Brand Header */}
                    <div className="text-center pb-3 mb-3">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            {companySettings?.company_logo ? (
                                <img
                                    src={companySettings.company_logo.startsWith('http') ? companySettings.company_logo : `${API_URL}${companySettings.company_logo}`}
                                    alt="Hospital Logo"
                                    className="h-16 w-16 object-contain rounded-lg"
                                />
                            ) : (
                                <div className="p-3 bg-blue-600 rounded-full shadow-lg">
                                    <Building2 className="h-7 w-7 text-white" />
                                </div>
                            )}
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                                    {companySettings?.company_name || 'Sheba Hospital'}
                                </h1>
                                <div className="text-gray-500 text-xs space-y-0.5 mt-0.5">
                                    {companySettings?.address1 && <p>{companySettings.address1}</p>}
                                    {companySettings?.address2 && <p>{companySettings.address2}</p>}
                                    {(companySettings?.phone || companySettings?.email) && (
                                        <p>
                                            {companySettings.phone && `Phone: ${companySettings.phone}`}
                                            {companySettings.phone && companySettings.email && ' | '}
                                            {companySettings.email && `Email: ${companySettings.email}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 underline">
                            Money Receipt
                        </h2>
                    </div>

                    {/* Patient Information Section */}
                    <div className="border rounded-lg p-4 bg-gray-50/50 mb-6 text-sm">
                        <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">Patient Details</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            <div>
                                <span className="text-gray-500">Patient Name:</span>
                                <p className="font-semibold text-gray-800">{admission.patient_name || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Admission Number:</span>
                                <p className="font-semibold text-purple-700">{admission.admission_prefix || `ADM-${admission.id}`}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Age / Sex:</span>
                                <p className="font-semibold text-gray-800">
                                    {admission.age_text || admission.age || '-'} / {admission.sex?.toUpperCase() || '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Phone:</span>
                                <p className="font-semibold text-gray-800">{admission.phone || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Bed / Cabin:</span>
                                <p className="font-semibold text-gray-800">
                                    {admission.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type} - ${admission.bedCabin.ward})` : '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Attending Doctor:</span>
                                <p className="font-semibold text-gray-800">{admission.doctor?.doctor_name || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Transaction Details Table */}
                    <div className="border rounded-lg overflow-hidden mb-6 text-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-2.5 px-4 font-semibold text-gray-700 w-1/3">Transaction Field</th>
                                    <th className="py-2.5 px-4 font-semibold text-gray-700 w-2/3">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-2.5 px-4 text-gray-500">Receipt ID</td>
                                    <td className="py-2.5 px-4 font-mono font-semibold text-gray-800">#{currentPayment.id}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2.5 px-4 text-gray-500">Payment Date & Time</td>
                                    <td className="py-2.5 px-4 text-gray-800">{fmtDateTime(currentPayment.payment_date || currentPayment.created_at)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2.5 px-4 text-gray-500">Payment Method</td>
                                    <td className="py-2.5 px-4 text-gray-800 capitalize font-medium flex items-center gap-1.5">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        {currentPayment.payment_method || '-'}
                                    </td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2.5 px-4 text-gray-500">Collected By</td>
                                    <td className="py-2.5 px-4 text-gray-800 font-medium">{currentPayment.created_by_user?.name || '-'}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2.5 px-4 text-gray-500">Remarks / Notes</td>
                                    <td className="py-2.5 px-4 text-gray-600">{currentPayment.notes || '-'}</td>
                                </tr>
                                <tr className="bg-blue-50/50">
                                    <td className="py-3 px-4 font-bold text-gray-700">Amount Paid</td>
                                    <td className="py-3 px-4 font-bold text-lg text-emerald-600">
                                        {format(Number(currentPayment.amount))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Amount in words */}
                    <div className="border border-dashed rounded-lg p-4 bg-gray-50 mb-16 text-sm text-gray-700">
                        <span className="font-semibold text-gray-500 block mb-1">Amount in Words:</span>
                        <p className="font-bold text-blue-800 italic">
                            Taka {amountToWords(Number(currentPayment.amount))}
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 text-sm pt-8">
                        <div>
                            <p className="border-t border-dashed w-40 pt-1 text-center text-gray-600 mx-auto">
                                Received By
                            </p>
                        </div>
                        <div>
                            <p className="border-t border-dashed w-48 pt-1 text-center text-gray-600 mx-auto">
                                Authorized Signature
                            </p>
                        </div>
                    </div>

                </div>
            </Main>
        </>
    )
}
