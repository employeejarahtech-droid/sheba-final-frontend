import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'

const API_URL = import.meta.env.VITE_API_URL

type CompanySettings = {
    company_name?: string
    company_logo?: string | null
    address1?: string | null
    address2?: string | null
    phone?: string | null
    email?: string | null
}

type InvoiceItem = {
    id: number
    final_distribution_id: number
    amount: string
    finalDistribution?: {
        id: number
        service_name: string
        admission_id: number
        admission?: {
            id: number
            admission_prefix: string | null
            patient_name: string
        } | null
    } | null
}

type Invoice = {
    id: number
    invoice_no: string
    provider_type: string
    provider_id: number
    provider_name: string | null
    total_amount: string
    payment_date: string
    payment_method: string | null
    created_at: string
    doctor?: { id: number; doctor_name: string; speciality: string } | null
    items: InvoiceItem[]
}

export const Route = createFileRoute(
    '/_authenticated/dashboard/finance/doctor-bills/invoices/$invoiceId/print',
)({
    component: ProviderPaymentInvoicePrintPage,
})

function ProviderPaymentInvoicePrintPage() {
    const { invoiceId } = Route.useParams()
    const { format, currencySymbol } = useCurrency()
    const { formatDateTime } = useDateFormat()
    const token = getCookie('accessToken')

    const { data, isLoading } = useQuery({
        queryKey: ['provider-payment-invoice', invoiceId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/final/invoices/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch invoice')
            return res.json()
        },
        enabled: !!token && !!invoiceId,
    })
    const invoice: Invoice | undefined = data?.data

    const { data: companySettings } = useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()
            return result.data
        },
        enabled: !!token,
    })

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <p className="text-red-600 text-lg font-semibold mb-4">Invoice not found</p>
                    <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
                </div>
            </div>
        )
    }

    const providerName = invoice.doctor?.doctor_name
        ? `Dr. ${invoice.doctor.doctor_name}${invoice.doctor.speciality ? ` (${invoice.doctor.speciality})` : ''}`
        : invoice.provider_name || '—'
    const totalAmount = Number(invoice.total_amount || 0)

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <div className="max-w-3xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:mt-0 print:pb-0 print-report" style={{ paddingTop: '20px' }}>
                    <style>{`
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .no-print { display: none !important; }
                        }
                        @page {
                            margin: 12mm;
                            size: A4 portrait;
                        }
                    `}</style>

                    {/* Header Action Buttons */}
                    <div className="print:hidden flex items-center justify-between gap-4 mb-6">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button variant="default" size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                        </Button>
                    </div>

                    {/* Voucher frame */}
                    <div>
                        <div className="p-5 border-b border-gray-400 dark:border-gray-600">
                            <div className="flex items-start justify-between gap-6">
                                <div className="w-3/5 flex items-center gap-4">
                                    {companySettings?.company_logo ? (
                                        <img
                                            src={companySettings.company_logo.startsWith('http') ? companySettings.company_logo : `${API_URL}${companySettings.company_logo}`}
                                            alt="Company Logo"
                                            className="w-24 h-24 object-contain"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-full shadow-lg bg-violet-600">
                                            <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-2xl font-bold">{companySettings?.company_name || 'Sheba Hospital'}</h1>
                                        {companySettings?.address1 && (
                                            <p className="text-sm mt-1 leading-5">{companySettings.address1}</p>
                                        )}
                                        {companySettings?.address2 && (
                                            <p className="text-sm leading-5">{companySettings.address2}</p>
                                        )}
                                        {(companySettings?.phone || companySettings?.email) && (
                                            <p className="text-sm leading-5">
                                                {companySettings.phone && `Phone: ${companySettings.phone}`}
                                                {companySettings.phone && companySettings.email && ' | '}
                                                {companySettings.email && `Email: ${companySettings.email}`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="w-2/5 text-right">
                                    <h2 className="text-lg font-bold tracking-widest uppercase">Payment Invoice</h2>
                                    <p className="text-sm mt-1 leading-5">Invoice No: <span className="font-mono font-semibold">{invoice.invoice_no}</span></p>
                                    <p className="text-sm leading-5">Date: {formatDateTime(invoice.payment_date)}</p>
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                        (PAID)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            <table className="w-full text-sm border">
                                <tbody>
                                    <tr className="border">
                                        <td className="border px-2 py-1 whitespace-nowrap">
                                            {invoice.provider_type} : <strong>{providerName}</strong>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Items table */}
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-400 dark:border-gray-600">
                                        <th className="text-left py-2 font-semibold w-12">#</th>
                                        <th className="text-left py-2 font-semibold">Admission / Patient</th>
                                        <th className="text-left py-2 font-semibold">Service</th>
                                        <th className="text-right py-2 font-semibold">Amount ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, idx) => {
                                        const fd = item.finalDistribution
                                        const adm = fd?.admission
                                        return (
                                            <tr key={item.id} className="border-b border-dashed">
                                                <td className="py-2 pr-2 text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2 pr-2">
                                                    {adm ? (
                                                        <>
                                                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-1">{adm.admission_prefix || `#${adm.id}`}</span>
                                                            {adm.patient_name}
                                                        </>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-2 pr-2">{fd?.service_name || '—'}</td>
                                                <td className="py-2 text-right font-medium">{format(Number(item.amount))}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-400 dark:border-gray-600">
                                        <td colSpan={3} className="py-2 font-bold text-right">Total</td>
                                        <td className="py-2 text-right font-bold">{format(totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Payment mode */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Payment Mode:</span>
                                    <p className="font-medium capitalize">{invoice.payment_method?.replace('_', ' ') || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Items:</span>
                                    <p className="font-medium">{invoice.items.length}</p>
                                </div>
                            </div>

                            {/* Amount in words + boxed total */}
                            <div className="flex items-stretch gap-4">
                                <div className="flex-1 border border-dashed rounded p-3 text-sm">
                                    <span className="text-muted-foreground block mb-1">In Words:</span>
                                    <p className="font-semibold italic">{amountToWords(totalAmount)}</p>
                                </div>
                                <div className="border border-gray-400 dark:border-gray-600 rounded px-6 py-2 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Invoice Amount</span>
                                    <span className="text-2xl font-bold whitespace-nowrap">{format(totalAmount)}</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                <tbody>
                                    <tr>
                                        <td className="w-1/3 text-center align-top pt-14">
                                            <p className="border-t border-dashed w-4/5 pt-1 mx-auto">Prepared By</p>
                                        </td>
                                        <td className="w-1/3 text-center align-top pt-14">
                                            <p className="border-t border-dashed w-4/5 pt-1 mx-auto">Received By ({invoice.provider_type})</p>
                                        </td>
                                        <td className="w-1/3 text-center align-top pt-14">
                                            <p className="border-t border-dashed w-4/5 pt-1 mx-auto">Authorized Signatory</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-300 dark:border-gray-700 px-5 py-2 text-center text-[10px] text-muted-foreground">
                            This is a computer-generated payment invoice and does not require a physical seal.
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
