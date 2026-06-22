import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Loader2, ArrowLeft, Printer } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { amountToWords } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL || ''

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
    const { format, currencySymbol, locale } = useCurrency()
    
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

    const fmtNum = (val: number | string | null | undefined) => {
        const n = typeof val === 'string' ? parseFloat(val) : (val ?? 0)
        return isNaN(n) ? '0.00' : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

    // Fetch company settings for company name, address and logo
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

    const admission = admissionData?.data as BillingData
    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null;
    const companyName = companySettings?.company_name || 'Sheba Hospital';
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

    const consolidatedItems = useMemo(() => {
        const list: {
            category: string
            description: string
            note?: string
            date?: string
            qty: number
            rate: number
            amount: number
        }[] = []

        // 1. Bed charges
        if (bedBills.length > 0) {
            bedBills.forEach((b: BedBill) => {
                list.push({
                    category: 'Bed Charges',
                    description: `${b.bed_code} (${b.bed_type})`,
                    date: `${safeFormatDate(b.from_date)} to ${safeFormatDate(b.to_date)}`,
                    qty: b.days,
                    rate: Number(b.rate_per_day),
                    amount: Number(b.total_amount)
                })
            })
        } else if (bedCharges?.breakdown?.length > 0) {
            bedCharges.breakdown.forEach((b: any) => {
                list.push({
                    category: 'Bed Charges',
                    description: `${b.bed_code} (${b.bed_type})`,
                    date: `${b.from ? safeFormatDate(b.from.split('T')[0]) : ''} to ${b.to ? safeFormatDate(b.to.split('T')[0]) : ''}`,
                    qty: b.days,
                    rate: Number(b.daily_rate),
                    amount: Number(b.charges)
                })
            })
        }

        // 2. Operations
        operations.forEach((op: Operation) => {
            list.push({
                category: 'Operation',
                description: op.operation_type,
                date: safeFormatDate(op.operation_date),
                qty: 1,
                rate: Number(op.charges),
                amount: Number(op.charges)
            })
        })

        // 3. Consultants
        consultants.forEach((c: Consultant) => {
            list.push({
                category: 'Consultant',
                description: c.consultant_name,
                date: safeFormatDate(c.visit_date),
                qty: 1,
                rate: Number(c.fees),
                amount: Number(c.fees)
            })
        })

        // 4. Surgeons
        surgeons.forEach((s: Surgeon) => {
            list.push({
                category: 'Surgeon',
                description: s.surgeon_name,
                date: safeFormatDate(s.operation_date),
                qty: 1,
                rate: Number(s.fees),
                amount: Number(s.fees)
            })
        })

        // 5. Assistants
        assistants.forEach((a: Assistant) => {
            list.push({
                category: 'Assistant',
                description: a.assistant_name,
                date: safeFormatDate(a.operation_date),
                qty: 1,
                rate: Number(a.fees),
                amount: Number(a.fees)
            })
        })

        // 6. Clinical Services
        services.forEach((s: Service) => {
            list.push({
                category: 'Clinical Service',
                description: s.service_name,
                note: s.note,
                qty: 1,
                rate: Number(s.amount),
                amount: Number(s.amount)
            })
        })

        return list
    }, [bedBills, bedCharges, operations, consultants, surgeons, assistants, services])

    if (admissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="invoice-print-area max-w-3xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none">
            <style>{`
              .bg-row-blue { background-color: #cfd2d8ff !important; }
              @media print {
                .bg-row-blue { background-color: #cfd2d8ff !important; }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                @page {
                    size: A4 portrait;
                    margin: 12mm;
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
                .border { border-color: oklch(0.929 0.013 255.508); }
                .border-dashed { border-color: oklch(0.929 0.013 255.508); }
              }
            `}</style>

            {/* Back & Print Buttons */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.close()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Close
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
                        <h1 className="text-2xl font-bold">{companyName}</h1>
                        <p className="text-sm mt-1 leading-5">
                            {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Title ──────────────────────────────────────────────────────── */}
            <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
                PRELIMINARY BILLING STATEMENT
            </h1>

            {/* ── Patient Info Table ──────────────────────────────────────────── */}
            <table className="w-full text-sm border">
                <tbody>
                    <tr className="border">
                        <td className="border px-2 py-1 w-1/3">
                            Admission ID: #{admissionId}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Generated Date: {safeFormatDate(new Date())}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Status: Preliminary
                        </td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1" colSpan={2}>
                            Patient Name: <strong>{admission?.patient_name || 'Unknown'}</strong>
                            {admission?.age && admission?.sex
                                ? ` — ${admission.age} yrs / ${admission.sex}`
                                : ''}
                        </td>
                        <td className="border px-2 py-1">
                            Phone: {admission?.phone || 'N/A'}
                        </td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1">
                            Admission Date: {admission?.admission_date ? safeFormatDate(admission.admission_date) : '-'}
                        </td>
                        <td className="border px-2 py-1">
                            Attending Doctor: {admission?.doctor?.doctor_name ? `Dr. ${admission.doctor.doctor_name}` : 'N/A'}
                        </td>
                        <td className="border px-2 py-1">
                            Bed/Cabin: {admission?.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : 'N/A'}
                        </td>
                    </tr>
                    {admission?.diagnosis && (
                        <tr className="border">
                            <td className="border px-2 py-1" colSpan={3}>
                                Diagnosis: {admission.diagnosis}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ── Bill Items Table ────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-6">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-2 py-1 text-left text-xs w-[4%]">#</th>
                        <th className="px-2 py-1 text-left text-xs w-[20%]">Category</th>
                        <th className="px-2 py-1 text-left text-xs w-[40%]">Description</th>
                        <th className="px-2 py-1 text-center text-xs w-[10%]">Qty/Days</th>
                        <th className="px-2 py-1 text-right text-xs w-[13%]">Rate ({currencySymbol})</th>
                        <th className="px-2 py-1 text-right text-xs w-[13%]">Amount ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {consolidatedItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed">
                            <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
                            <td className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase">
                                {item.category}
                            </td>
                            <td className="px-2 py-1 text-xs">
                                {item.description}
                                {item.note && <span className="block text-gray-500 mt-0.5">{item.note}</span>}
                                {item.date && <span className="block text-gray-400 text-[10px] mt-0.5">{item.date}</span>}
                            </td>
                            <td className="px-2 py-1 text-center text-xs">{item.qty}</td>
                            <td className="px-2 py-1 text-right text-xs">{fmtNum(item.rate)}</td>
                            <td className="px-2 py-1 text-right text-xs font-semibold">{fmtNum(item.amount)}</td>
                        </tr>
                    ))}
                    {/* Grand totals row */}
                    <tr className="font-bold text-xs border-t-2 border-b border-gray-500">
                        <td className="px-2 py-1" colSpan={4}>Total</td>
                        <td className="px-2 py-1 text-right" colSpan={2}>{fmtNum(grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            {/* ── Bill Totals ─────────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-3">
                <tbody>
                    <tr className="border font-bold">
                        <td className="border px-2 py-1 text-right" colSpan={4}>Grand Total Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            <p className="text-sm mt-6 italic">Total In Words: {amountToWords(grandTotal)}</p>

            {/* ── Signature Row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 mt-32 text-sm">
                <div>
                    <p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p>
                </div>
                <div className="text-right">
                    <p className="border-t border-dashed w-56 ml-auto pt-1">Authority Signature:</p>
                </div>
            </div>
        </div>
    )
}
